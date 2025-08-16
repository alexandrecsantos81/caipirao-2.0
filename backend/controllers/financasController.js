// backend/controllers/financasController.js

const pool = require('../db');

const getDashboardConsolidado = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        const receitasCaipiraoQuery = `
            SELECT COALESCE(SUM(valor_total), 0) as total
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND data_venda BETWEEN $1 AND $2;
        `;
        const receitasCaipiraoResult = await pool.query(receitasCaipiraoQuery, [startDate, endDate]);
        const totalReceitasCaipirao = parseFloat(receitasCaipiraoResult.rows[0].total);

        // --- INÍCIO DA CORREÇÃO ---
        const despesasCaipiraoQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM despesas
            WHERE data_compra BETWEEN $1 AND $2;
        `;
        // --- FIM DA CORREÇÃO ---
        const despesasCaipiraoResult = await pool.query(despesasCaipiraoQuery, [startDate, endDate]);
        const totalDespesasCaipirao = parseFloat(despesasCaipiraoResult.rows[0].total);

        const receitasExternasQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM receitas_externas
            WHERE data_recebimento BETWEEN $1 AND $2;
        `;
        const receitasExternasResult = await pool.query(receitasExternasQuery, [startDate, endDate]);
        const totalReceitasExternas = parseFloat(receitasExternasResult.rows[0].total);

        const kpis = {
            receitasCaipirao: totalReceitasCaipirao,
            despesasCaipirao: totalDespesasCaipirao,
            receitasExternas: totalReceitasExternas,
            receitaTotalConsolidada: totalReceitasCaipirao + totalReceitasExternas,
            saldoConsolidado: (totalReceitasCaipirao + totalReceitasExternas) - totalDespesasCaipirao,
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
