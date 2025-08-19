const pool = require('../db');

const getDashboardConsolidado = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        // ... (código dos KPIs do dashboard consolidado permanece o mesmo) ...
        const receitasCaipiraoQuery = `
            SELECT COALESCE(SUM(valor_total), 0) as total
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND data_venda BETWEEN $1 AND $2;
        `;
        const receitasCaipiraoResult = await pool.query(receitasCaipiraoQuery, [startDate, endDate]);
        const totalReceitasCaipirao = parseFloat(receitasCaipiraoResult.rows[0].total);

        const despesasCaipiraoQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM despesas
            WHERE data_compra BETWEEN $1 AND $2;
        `;
        const despesasCaipiraoResult = await pool.query(despesasCaipiraoQuery, [startDate, endDate]);
        const totalDespesasCaipirao = parseFloat(despesasCaipiraoResult.rows[0].total);

        const receitasExternasQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM receitas_externas
            WHERE data_recebimento BETWEEN $1 AND $2;
        `;
        const receitasExternasResult = await pool.query(receitasExternasQuery, [startDate, endDate]);
        const totalReceitasExternas = parseFloat(receitasExternasResult.rows[0].total);

        const despesasPessoaisQuery = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM despesas_pessoais
            WHERE data_vencimento BETWEEN $1 AND $2;
        `;
        const despesasPessoaisResult = await pool.query(despesasPessoaisQuery, [startDate, endDate]);
        const totalDespesasPessoais = parseFloat(despesasPessoaisResult.rows[0].total);

        const kpis = {
            receitasCaipirao: totalReceitasCaipirao,
            despesasCaipirao: totalDespesasCaipirao,
            receitasExternas: totalReceitasExternas,
            receitasPessoais: totalReceitasExternas,
            despesasPessoais: totalDespesasPessoais,
            receitaTotalConsolidada: totalReceitasCaipirao + totalReceitasExternas,
            despesaTotalConsolidada: totalDespesasCaipirao + totalDespesasPessoais,
            saldoConsolidado: (totalReceitasCaipirao + totalReceitasExternas) - (totalDespesasCaipirao + totalDespesasPessoais),
        };

        res.status(200).json({ kpis });

    } catch (error) {
        console.error('Erro ao buscar dados para o dashboard financeiro consolidado:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar sua solicitação.' });
    }
};

const getAnaliseFinanceira = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        // 1. Gráfico de Pizza: Despesas Pessoais por Categoria (sem alteração)
        const despesasPorCategoriaQuery = `
            SELECT
                COALESCE(categoria, 'Sem Categoria') as name,
                SUM(valor) as value
            FROM despesas_pessoais
            WHERE data_vencimento BETWEEN $1 AND $2
            GROUP BY COALESCE(categoria, 'Sem Categoria')
            HAVING SUM(valor) > 0
            ORDER BY value DESC;
        `;
        
        // 2. Gráfico de Barras: Balanço Mensal (sem alteração)
        const balancoMensalQuery = `
            WITH meses AS (
                SELECT DISTINCT date_trunc('month', generate_series($1::date, $2::date, '1 month'::interval))::date AS mes
            ),
            receitas AS (
                SELECT date_trunc('month', data_recebimento)::date AS mes, SUM(valor) as total
                FROM receitas_externas WHERE data_recebimento BETWEEN $1 AND $2 GROUP BY 1
            ),
            despesas AS (
                SELECT date_trunc('month', data_vencimento)::date AS mes, SUM(valor) as total
                FROM despesas_pessoais WHERE data_vencimento BETWEEN $1 AND $2 GROUP BY 1
            )
            SELECT TO_CHAR(meses.mes, 'MM/YYYY') as name, COALESCE(r.total, 0) as receitas, COALESCE(d.total, 0) as despesas
            FROM meses LEFT JOIN receitas r ON meses.mes = r.mes LEFT JOIN despesas d ON meses.mes = d.mes
            ORDER BY meses.mes ASC;
        `;

        // ✅ INÍCIO DA MODIFICAÇÃO: 3. Gráfico de Barras: Top 5 Despesas Individuais
        const top5DespesasQuery = `
            SELECT
                descricao,
                valor
            FROM
                despesas_pessoais
            WHERE
                data_vencimento BETWEEN $1 AND $2
            ORDER BY
                valor DESC
            LIMIT 5;
        `;
        // ✅ FIM DA MODIFICAÇÃO

        // Executa todas as consultas em paralelo
        const [
            despesasResult,
            balancoResult,
            top5Result // ✅ Executa a nova consulta
        ] = await Promise.all([
            pool.query(despesasPorCategoriaQuery, [startDate, endDate]),
            pool.query(balancoMensalQuery, [startDate, endDate]),
            pool.query(top5DespesasQuery, [startDate, endDate]) // ✅ Adiciona a nova consulta à execução
        ]);

        // Monta o objeto de resposta final
        res.status(200).json({
            despesasPorCategoria: despesasResult.rows,
            balancoMensal: balancoResult.rows,
            top5Despesas: top5Result.rows // ✅ Adiciona o novo dado à resposta
        });

    } catch (error) {
        console.error('Erro ao buscar dados para análise financeira:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar sua solicitação.' });
    }
};

module.exports = {
    getDashboardConsolidado,
    getAnaliseFinanceira,
};
