// backend/controllers/dashboardController.js

const pool = require('../db');

/**
 * @desc    Busca os principais KPIs para os cards do dashboard.
 * @route   GET /api/dashboard/kpis
 * @access  Protegido
 */
const getKPIs = async (req, res) => {
    try {
        // --- 1. Resumo Financeiro do Mês Atual ---
        const resumoMesQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN valor_total ELSE 0 END), 0) AS "totalVendasMes",
                COALESCE(SUM(CASE WHEN tipo_saida IS NOT NULL THEN valor ELSE 0 END), 0) AS "totalDespesasMes"
            FROM (
                SELECT 'ENTRADA' as tipo, valor_total, NULL as tipo_saida, NULL as valor, data_venda as data_mov
                FROM movimentacoes
                WHERE data_venda >= DATE_TRUNC('month', CURRENT_DATE)
                
                UNION ALL
                
                SELECT NULL as tipo, NULL as valor_total, tipo_saida, valor, data_vencimento as data_mov
                FROM despesas
                WHERE data_vencimento >= DATE_TRUNC('month', CURRENT_DATE)
            ) as movimentacoes_mes;
        `;
        const resumoMesResult = await pool.query(resumoMesQuery);
        const { totalVendasMes, totalDespesasMes } = resumoMesResult.rows[0];


        // --- 2. Total de Contas a Receber (Vendas a Prazo Pendentes) ---
        const contasAReceberQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "totalContasAReceber"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND opcao_pagamento = 'A PRAZO' AND data_pagamento IS NULL;
        `;
        const contasAReceberResult = await pool.query(contasAReceberQuery);
        const { totalContasAReceber } = contasAReceberResult.rows[0];


        // --- 3. Total de Contas a Pagar (Despesas Pendentes) ---
        const contasAPagarQuery = `
            SELECT COALESCE(SUM(valor), 0) AS "totalContasAPagar"
            FROM despesas
            WHERE data_pagamento IS NULL;
        `;
        const contasAPagarResult = await pool.query(contasAPagarQuery);
        const { totalContasAPagar } = contasAPagarResult.rows[0];


        // --- 4. Novos Clientes no Mês Atual ---
        const novosClientesQuery = `
            SELECT COUNT(id) AS "novosClientesMes"
            FROM clientes
            WHERE data_criacao >= DATE_TRUNC('month', CURRENT_DATE);
        `;
        const novosClientesResult = await pool.query(novosClientesQuery);
        const { novosClientesMes } = novosClientesResult.rows[0];


        // --- 5. Monta o objeto de resposta ---
        res.status(200).json({
            totalVendasMes: parseFloat(totalVendasMes),
            totalDespesasMes: parseFloat(totalDespesasMes),
            saldoMes: parseFloat(totalVendasMes) - parseFloat(totalDespesasMes),
            totalContasAReceber: parseFloat(totalContasAReceber),
            totalContasAPagar: parseFloat(totalContasAPagar),
            novosClientesMes: parseInt(novosClientesMes, 10),
        });

    } catch (error) {
        console.error('Erro ao buscar KPIs do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


/**
 * @desc    Busca dados de vendas diárias para o gráfico do dashboard.
 * @route   GET /api/dashboard/vendas-por-dia
 * @access  Protegido
 */
const getVendasPorDia = async (req, res) => {
    try {
        const query = `
            SELECT 
                TO_CHAR(data_venda, 'YYYY-MM-DD') AS dia,
                SUM(valor_total) AS total
            FROM movimentacoes
            WHERE 
                tipo = 'ENTRADA' AND
                data_venda >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY dia
            ORDER BY dia ASC;
        `;
        const resultado = await pool.query(query);

        const dadosFormatados = resultado.rows.map(row => ({
            dia: new Date(row.dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            total: parseFloat(row.total)
        }));

        res.status(200).json(dadosFormatados);

    } catch (error) {
        console.error('Erro ao buscar dados de vendas por dia:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Busca o total de despesas do mês atual, agrupado por categoria.
 * @route   GET /api/dashboard/despesas-por-categoria
 * @access  Protegido (Admin)
 */
const getDespesasPorCategoria = async (req, res) => {
    try {
        const query = `
            SELECT 
                tipo_saida AS name,
                SUM(valor) AS value
            FROM 
                despesas
            WHERE 
                data_vencimento >= DATE_TRUNC('month', CURRENT_DATE) AND
                data_vencimento < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY 
                tipo_saida
            HAVING
                SUM(valor) > 0
            ORDER BY 
                value DESC;
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas por categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Busca o ranking dos 2 produtos mais vendidos no mês atual.
 * @route   GET /api/dashboard/ranking-produtos
 * @access  Protegido (Admin)
 */
const getRankingProdutos = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.nome,
                SUM(
                    (item->>'quantidade')::numeric * 
                    COALESCE((item->>'preco_manual')::numeric, p.price)
                ) AS total_vendido
            FROM 
                movimentacoes m,
                jsonb_array_elements(m.produtos) AS item
            JOIN 
                produtos p ON (item->>'produto_id')::int = p.id
            WHERE 
                m.tipo = 'ENTRADA' AND 
                m.data_venda >= DATE_TRUNC('month', CURRENT_DATE) AND
                m.data_venda < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY 
                p.nome
            ORDER BY 
                total_vendido DESC
            LIMIT 2;
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar ranking de produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Busca o ranking dos 5 clientes que mais compraram no mês atual.
 * @route   GET /api/dashboard/ranking-clientes
 * @access  Protegido (Admin)
 */
const getRankingClientes = async (req, res) => {
    try {
        const query = `
            SELECT
                c.nome,
                SUM(m.valor_total) as total_comprado
            FROM
                movimentacoes m
            JOIN
                clientes c ON m.cliente_id = c.id
            WHERE
                m.tipo = 'ENTRADA' AND
                m.data_venda >= DATE_TRUNC('month', CURRENT_DATE) AND
                m.data_venda < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY
                c.nome
            ORDER BY
                total_comprado DESC
            LIMIT 5;
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar ranking de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Busca dados diários de Receitas e Despesas para o gráfico de fluxo de caixa.
 * @route   GET /api/dashboard/fluxo-caixa-diario
 * @access  Protegido
 */
const getFluxoCaixaDiario = async (req, res) => {
    try {
        const query = `
            WITH days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS dia
            ),
            daily_revenues AS (
                SELECT 
                    data_venda::date AS dia,
                    SUM(valor_total) as receitas
                FROM movimentacoes
                WHERE tipo = 'ENTRADA' AND data_venda >= CURRENT_DATE - INTERVAL '29 days'
                GROUP BY data_venda::date
            ),
            daily_expenses AS (
                SELECT 
                    data_compra::date AS dia,
                    SUM(valor) as despesas
                FROM despesas
                WHERE data_compra >= CURRENT_DATE - INTERVAL '29 days'
                GROUP BY data_compra::date
            )
            SELECT 
                TO_CHAR(days.dia, 'DD/MM') as dia,
                COALESCE(dr.receitas, 0) as receitas,
                COALESCE(de.despesas, 0) as despesas
            FROM days
            LEFT JOIN daily_revenues dr ON days.dia = dr.dia
            LEFT JOIN daily_expenses de ON days.dia = de.dia
            ORDER BY days.dia ASC;
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar dados de fluxo de caixa diário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


module.exports = {
    getKPIs,
    getVendasPorDia,
    getDespesasPorCategoria,
    getRankingProdutos,
    getRankingClientes,
    getFluxoCaixaDiario, // <-- Exportando a nova função
};
