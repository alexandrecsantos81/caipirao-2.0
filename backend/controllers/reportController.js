// backend/controllers/reportController.js

const pool = require('../db');

/**
 * @description Calcula e retorna os principais KPIs financeiros.
 * - Receita Total (soma de todas as vendas)
 * - Despesa Total (soma de todas as despesas)
 * - Saldo/Lucro (Receita - Despesa)
 */
const getFinancialSummary = async (req, res) => {
    try {
        // Query para calcular o total de ENTRADAS (Vendas)
        const receitaResult = await pool.query(
            "SELECT COALESCE(SUM(valor_total), 0) AS total FROM movimentacoes WHERE tipo = 'ENTRADA'"
        );
        const receitaTotal = parseFloat(receitaResult.rows[0].total);

        // Query para calcular o total de SAÍDAS (Despesas)
        const despesaResult = await pool.query(
            "SELECT COALESCE(SUM(valor_total), 0) AS total FROM movimentacoes WHERE tipo = 'SAIDA'"
        );
        const despesaTotal = parseFloat(despesaResult.rows[0].total);

        // Calcula o saldo
        const saldo = receitaTotal - despesaTotal;

        res.status(200).json({
            receitaTotal,
            despesaTotal,
            saldo
        });

    } catch (error) {
        console.error('Erro ao gerar resumo financeiro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Futuramente, podemos adicionar outros relatórios aqui.
// Ex: Vendas por período, produtos mais vendidos, etc.
/*
const getVendasPorPeriodo = async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    // Lógica para buscar vendas no período...
    res.status(200).json({ ... });
}
*/

module.exports = {
    getFinancialSummary
};
