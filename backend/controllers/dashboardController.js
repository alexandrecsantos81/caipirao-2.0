// backend/controllers/dashboardController.js

const pool = require('../db');

// As funções getKPIs, getVendasPorDia, getDespesasPorCategoria, getRankingProdutos e getRankingClientes permanecem as mesmas.
const getKPIs = async (req, res) => { /* ...código da versão anterior... */ };
const getVendasPorDia = async (req, res) => { /* ...código da versão anterior... */ };
const getDespesasPorCategoria = async (req, res) => { /* ...código da versão anterior... */ };
const getRankingProdutos = async (req, res) => { /* ...código da versão anterior... */ };
const getRankingClientes = async (req, res) => { /* ...código da versão anterior... */ };


/**
 * @desc    Busca os dados de fluxo de caixa diário (receitas vs despesas) para um período.
 * @route   GET /api/dashboard/fluxo-caixa-diario
 * @access  Protegido
 */
const getFluxoCaixaDiario = async (req, res) => {
    const { startDate, endDate } = req.query;

    // Validação para garantir que as datas foram fornecidas
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'É necessário fornecer tanto a data de início quanto a de fim.' });
    }

    try {
        // ✅ CONSULTA CORRIGIDA E OTIMIZADA
        const query = `
            WITH date_series AS (
                SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS dia
            ),
            daily_revenues AS (
                SELECT 
                    data_venda AS dia,
                    SUM(valor_total) as total
                FROM movimentacoes
                WHERE tipo = 'ENTRADA' AND data_venda BETWEEN $1 AND $2
                GROUP BY data_venda
            ),
            daily_expenses AS (
                SELECT 
                    data_compra AS dia,
                    SUM(valor) as total
                FROM despesas
                WHERE data_compra BETWEEN $1 AND $2
                GROUP BY data_compra
            )
            SELECT 
                TO_CHAR(ds.dia, 'DD/MM') as dia,
                COALESCE(dr.total, 0) as receitas,
                COALESCE(de.total, 0) as despesas
            FROM date_series ds
            LEFT JOIN daily_revenues dr ON ds.dia = dr.dia
            LEFT JOIN daily_expenses de ON ds.dia = de.dia
            ORDER BY ds.dia ASC;
        `;
        
        const resultado = await pool.query(query, [startDate, endDate]);
        res.status(200).json(resultado.rows);

    } catch (error) {
        console.error('Erro ao buscar dados de fluxo de caixa diário:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar a sua solicitação.' });
    }
};


module.exports = {
    getKPIs,
    getVendasPorDia,
    getDespesasPorCategoria,
    getRankingProdutos,
    getRankingClientes,
    getFluxoCaixaDiario,
};
