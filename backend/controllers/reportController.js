// backend/src/controllers/reportController.js

const pool = require('../db');

/**
 * @description Calcula e retorna os KPIs de Vendas Gerais e a evolução diária das vendas.
 * @route GET /api/reports/sales-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access Privado - Apenas ADMINS
 */
const getSalesSummary = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        const query = `
            WITH vendas_no_periodo AS (
                SELECT 
                    id,
                    valor_total,
                    data_venda,
                    (
                        SELECT COALESCE(SUM((item->>'quantidade')::numeric), 0) 
                        FROM jsonb_array_elements(produtos) AS item
                    ) AS peso_venda
                FROM 
                    movimentacoes
                WHERE 
                    tipo = 'ENTRADA' AND 
                    data_venda BETWEEN $1 AND $2
            ),
            evolucao_diaria AS (
                SELECT
                    data_venda::date AS data,
                    SUM(valor_total) AS faturamento
                FROM
                    vendas_no_periodo
                GROUP BY
                    data_venda::date
                ORDER BY
                    data ASC
            )
            SELECT 
                (
                    SELECT json_build_object(
                        'faturamentoTotal', COALESCE(SUM(valor_total), 0),
                        'pesoTotalVendido', COALESCE(SUM(peso_venda), 0),
                        'totalTransacoes', COUNT(id)
                    ) 
                    FROM vendas_no_periodo
                ) AS kpis,
                (
                    SELECT COALESCE(json_agg(evolucao_diaria), '[]'::json) 
                    FROM evolucao_diaria
                ) AS evolucaoVendas;
        `;

        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao gerar resumo de vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar resumo de vendas.' });
    }
};

/**
 * @description Retorna o ranking de produtos mais vendidos.
 * @route GET /api/reports/product-ranking?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&orderBy=valor
 * @access Privado - Apenas ADMINS
 */
const getProductRanking = async (req, res) => {
    const { startDate, endDate, orderBy = 'valor' } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    if (orderBy !== 'valor' && orderBy !== 'quantidade') {
        return res.status(400).json({ error: "Parâmetro 'orderBy' inválido. Use 'valor' ou 'quantidade'." });
    }

    try {
        const query = `
            SELECT 
                p.id AS "produtoId",
                p.nome,
                SUM(
                    item.quantidade * COALESCE(item.preco_manual, p.price)
                ) AS "valorTotal",
                SUM(item.quantidade) AS "quantidadeTotal"
            FROM 
                movimentacoes m,
                jsonb_to_recordset(m.produtos) AS item(produto_id int, quantidade numeric, preco_manual numeric)
            JOIN 
                produtos p ON p.id = item.produto_id
            WHERE 
                m.tipo = 'ENTRADA' AND 
                m.data_venda BETWEEN $1 AND $2
            GROUP BY 
                p.id, p.nome
            ORDER BY
                CASE 
                    WHEN $3 = 'quantidade' THEN SUM(item.quantidade)
                    ELSE SUM(item.quantidade * COALESCE(item.preco_manual, p.price))
                END DESC
            LIMIT 10;
        `;

        const result = await pool.query(query, [startDate, endDate, orderBy]);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao gerar ranking de produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar ranking de produtos.' });
    }
};

/**
 * @description Retorna o ranking de clientes que mais compraram.
 * @route GET /api/reports/client-ranking?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access Privado - Apenas ADMINS
 */
const getClientRanking = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        const query = `
            SELECT 
                c.id AS "clienteId",
                c.nome,
                c.telefone,
                COUNT(m.id) AS "totalCompras",
                SUM(m.valor_total) AS "valorTotalGasto"
            FROM 
                movimentacoes m
            JOIN 
                clientes c ON m.cliente_id = c.id
            WHERE 
                m.tipo = 'ENTRADA' AND 
                m.data_venda BETWEEN $1 AND $2
            GROUP BY 
                c.id, c.nome, c.telefone
            ORDER BY 
                "valorTotalGasto" DESC
            LIMIT 20;
        `;

        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao gerar ranking de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar ranking de clientes.' });
    }
};

/**
 * @description Retorna a lista de clientes ativos e inativos.
 * @route GET /api/reports/client-analysis
 * @access Privado - Apenas ADMINS
 */
const getClientAnalysis = async (req, res) => {
    try {
        const query = `
            WITH ultima_compra AS (
                SELECT
                    cliente_id,
                    MAX(data_venda) as data_ultima_compra
                FROM
                    movimentacoes
                WHERE
                    tipo = 'ENTRADA'
                GROUP BY
                    cliente_id
            )
            SELECT
                c.id AS "clienteId",
                c.nome,
                c.telefone,
                uc.data_ultima_compra,
                CASE
                    WHEN uc.data_ultima_compra >= CURRENT_DATE - INTERVAL '90 days' THEN 'Ativo'
                    ELSE 'Inativo'
                END AS status
            FROM
                clientes c
            LEFT JOIN
                ultima_compra uc ON c.id = uc.cliente_id
            ORDER BY
                status, uc.data_ultima_compra DESC NULLS LAST, c.nome;
        `;

        const result = await pool.query(query);

        const ativos = result.rows.filter(c => c.status === 'Ativo');
        const inativos = result.rows.filter(c => c.status === 'Inativo');

        res.status(200).json({ ativos, inativos });

    } catch (error) {
        console.error('Erro ao gerar análise de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar análise de clientes.' });
    }
};

/**
 * @description Retorna o ranking de produtividade dos vendedores.
 * @route GET /api/reports/seller-productivity?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access Privado - Apenas ADMINS
 */
const getSellerProductivity = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        const query = `
            SELECT
                u.id AS "vendedorId",
                u.nome,
                COUNT(m.id) AS "numeroDeVendas",
                COALESCE(SUM(m.valor_total), 0) AS "valorTotalVendido"
            FROM
                utilizadores u
            LEFT JOIN
                movimentacoes m ON u.id = m.utilizador_id
                AND m.tipo = 'ENTRADA'
                AND m.data_venda BETWEEN $1 AND $2
            WHERE
                u.status = 'ATIVO' -- Considera apenas vendedores ativos
            GROUP BY
                u.id, u.nome
            ORDER BY
                "valorTotalVendido" DESC;
        `;

        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao gerar relatório de produtividade:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar relatório de produtividade.' });
    }
};


// Exporta todas as funções do controller
module.exports = {
    getSalesSummary,
    getProductRanking,
    getClientRanking,
    getClientAnalysis,
    getSellerProductivity, // Adiciona a nova função à exportação
};
