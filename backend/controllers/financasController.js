const pool = require('../db');

const getDashboardConsolidado = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        // 1. Receitas do Negócio (Caipirão)
        const receitasCaipiraoQuery = `
            SELECT COALESCE(SUM(valor_total), 0) as total
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND data_venda BETWEEN $1 AND $2;
        `;
        const receitasCaipiraoResult = await pool.query(receitasCaipiraoQuery, [startDate, endDate]);
        const totalReceitasCaipirao = parseFloat(receitasCaipiraoResult.rows[0].total);

        // 2. Despesas do Negócio (Caipirão)
        const despesasCaipiraoQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM despesas
            WHERE data_compra BETWEEN $1 AND $2;
        `;
        const despesasCaipiraoResult = await pool.query(despesasCaipiraoQuery, [startDate, endDate]);
        const totalDespesasCaipirao = parseFloat(despesasCaipiraoResult.rows[0].total);

        // 3. Receitas Pessoais (Externas)
        const receitasExternasQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM receitas_externas
            WHERE data_recebimento BETWEEN $1 AND $2;
        `;
        const receitasExternasResult = await pool.query(receitasExternasQuery, [startDate, endDate]);
        const totalReceitasExternas = parseFloat(receitasExternasResult.rows[0].total);

        // 4. (NOVO) Despesas Pessoais
        const despesasPessoaisQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM despesas_pessoais
            WHERE data_vencimento BETWEEN $1 AND $2;
        `;
        const despesasPessoaisResult = await pool.query(despesasPessoaisQuery, [startDate, endDate]);
        const totalDespesasPessoais = parseFloat(despesasPessoaisResult.rows[0].total);


        // 5. (ATUALIZADO) Montagem dos KPIs
        const kpis = {
            receitasCaipirao: totalReceitasCaipirao,
            despesasCaipirao: totalDespesasCaipirao,
            receitasExternas: totalReceitasExternas,
            despesasPessoais: totalDespesasPessoais, // KPI novo
            receitaTotalConsolidada: totalReceitasCaipirao + totalReceitasExternas,
            despesaTotalConsolidada: totalDespesasCaipirao + totalDespesasPessoais, // KPI novo
            saldoConsolidado: (totalReceitasCaipirao + totalReceitasExternas) - (totalDespesasCaipirao + totalDespesasPessoais), // Lógica de cálculo atualizada
        };

        res.status(200).json({ kpis });

    } catch (error) {
        console.error('Erro ao buscar dados para o dashboard financeiro consolidado:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar sua solicitação.' });
    }
};

module.exports = {
    getDashboardConsolidado,
};
