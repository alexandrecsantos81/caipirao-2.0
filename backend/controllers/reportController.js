const pool = require('../db');

/**
 * @description Calcula e retorna os principais KPIs financeiros, com filtro de data opcional.
 * @route GET /api/reports/summary?de=AAAA-MM-DD&ate=AAAA-MM-DD
 * @access Privado - Apenas ADMINS
 */
const getFinancialSummary = async (req, res) => {
    // 1. Extrai as datas da query string
    const { de, ate } = req.query;

    // 2. Prepara os parâmetros e a cláusula WHERE para as queries
    const params = [];
    let dateFilter = '';

    if (de && ate) {
        // Adiciona um dia ao 'ate' para incluir o dia inteiro na consulta
        const ateDate = new Date(ate);
        ateDate.setDate(ateDate.getDate() + 1);
        
        dateFilter = 'WHERE data_movimentacao >= $1 AND data_movimentacao < $2';
        params.push(de, ateDate.toISOString().split('T')[0]);
    }

    try {
        // 3. Modifica as queries para incluir o filtro de data
        const receitaQuery = `SELECT COALESCE(SUM(valor_total), 0) AS total FROM movimentacoes WHERE tipo = 'ENTRADA' ${dateFilter ? `AND ${dateFilter.replace('WHERE ', '')}` : ''}`;
        const despesaQuery = `SELECT COALESCE(SUM(valor_total), 0) AS total FROM movimentacoes WHERE tipo = 'SAIDA' ${dateFilter ? `AND ${dateFilter.replace('WHERE ', '')}` : ''}`;

        const receitaResult = await pool.query(receitaQuery, params);
        const receitaTotal = parseFloat(receitaResult.rows[0].total);

        const despesaResult = await pool.query(despesaQuery, params);
        const despesaTotal = parseFloat(despesaResult.rows[0].total);

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

/**
 * @description Retorna uma lista dos produtos mais vendidos, com filtro de data opcional.
 * @route GET /api/reports/produtos-mais-vendidos?de=AAAA-MM-DD&ate=AAAA-MM-DD
 * @access Privado - Apenas ADMINS
 */
const getProdutosMaisVendidos = async (req, res) => {
    // 1. Extrai as datas da query string
    const { de, ate } = req.query;
    
    const params = [];
    let dateFilter = '';

    if (de && ate) {
        const ateDate = new Date(ate);
        ateDate.setDate(ateDate.getDate() + 1);

        // O placeholder ($1, $2) será adicionado dinamicamente
        dateFilter = `AND m.data_movimentacao >= $${params.length + 1} AND m.data_movimentacao < $${params.length + 2}`;
        params.push(de, ateDate.toISOString().split('T')[0]);
    }

    try {
        // 2. Modifica a query para incluir o filtro de data
        const query = `
            SELECT 
                p.id,
                p.nome,
                SUM(item.quantidade) AS total_vendido
            FROM 
                movimentacoes m,
                jsonb_to_recordset(m.produtos) AS item(produto_id INTEGER, quantidade INTEGER)
            JOIN 
                produtos p ON item.produto_id = p.id
            WHERE 
                m.tipo = 'ENTRADA'
                ${dateFilter}
            GROUP BY 
                p.id, p.nome
            ORDER BY 
                total_vendido DESC
            LIMIT 10;
        `;

        const result = await pool.query(query, params);

        const produtos = result.rows.map(produto => ({
            ...produto,
            total_vendido: parseInt(produto.total_vendido, 10)
        }));

        res.status(200).json(produtos);

    } catch (error) {
        console.error('Erro ao buscar produtos mais vendidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};


module.exports = {
    getFinancialSummary,
    getProdutosMaisVendidos
};
