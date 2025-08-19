// backend/controllers/dashboardController.js

const pool = require('../db');

// A função getKPIs permanece a mesma da versão anterior
const getKPIs = async (req, res) => {
    try {
        // --- 1. Receita Paga (Mês) ---
        const receitasPagasQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "totalVendasMes"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND data_pagamento IS NOT NULL AND
                  data_pagamento >= DATE_TRUNC('month', CURRENT_DATE) AND
                  data_pagamento < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const receitasPagasResult = await pool.query(receitasPagasQuery);
        const { totalVendasMes } = receitasPagasResult.rows[0];

        // --- 2. Despesas Pagas (Mês) ---
        const despesasPagasQuery = `
            SELECT COALESCE(SUM(valor), 0) AS "totalDespesasMes"
            FROM despesas
            WHERE data_pagamento IS NOT NULL AND
                  data_pagamento >= DATE_TRUNC('month', CURRENT_DATE) AND
                  data_pagamento < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const despesasPagasResult = await pool.query(despesasPagasQuery);
        const { totalDespesasMes } = despesasPagasResult.rows[0];

        // --- 3. Contas a Receber (Total Pendente) ---
        const contasAReceberQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "totalContasAReceber"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND opcao_pagamento = 'A PRAZO' AND data_pagamento IS NULL;
        `;
        const contasAReceberResult = await pool.query(contasAReceberQuery);
        const { totalContasAReceber } = contasAReceberResult.rows[0];

        // --- 4. Contas a Pagar (Total Pendente) ---
        const contasAPagarQuery = `
            SELECT COALESCE(SUM(valor), 0) AS "totalContasAPagar"
            FROM despesas
            WHERE data_pagamento IS NULL;
        `;
        const contasAPagarResult = await pool.query(contasAPagarQuery);
        const { totalContasAPagar } = contasAPagarResult.rows[0];

        // --- 5. Novos Clientes no Mês ---
        const novosClientesQuery = `
            SELECT COUNT(id) AS "novosClientesMes"
            FROM clientes
            WHERE data_criacao >= DATE_TRUNC('month', CURRENT_DATE);
        `;
        const novosClientesResult = await pool.query(novosClientesQuery);
        const { novosClientesMes } = novosClientesResult.rows[0];

        // --- 6. Receita Prevista (Mês) ---
        const receitaPrevistaQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "receitaPrevistaMes"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND
                  data_venda >= DATE_TRUNC('month', CURRENT_DATE) AND
                  data_venda < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const receitaPrevistaResult = await pool.query(receitaPrevistaQuery);
        const { receitaPrevistaMes } = receitaPrevistaResult.rows[0];

        res.status(200).json({
            totalVendasMes: parseFloat(totalVendasMes),
            totalDespesasMes: parseFloat(totalDespesasMes),
            saldoMes: parseFloat(totalVendasMes) - parseFloat(totalDespesasMes),
            totalContasAReceber: parseFloat(totalContasAReceber),
            totalContasAPagar: parseFloat(totalContasAPagar),
            novosClientesMes: parseInt(novosClientesMes, 10),
            receitaPrevistaMes: parseFloat(receitaPrevistaMes),
        });

    } catch (error) {
        console.error('Erro ao buscar KPIs do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// A função getVendasPorDia permanece a mesma
const getVendasPorDia = async (req, res) => { /* ...código original... */ };

// A função getDespesasPorCategoria permanece a mesma
const getDespesasPorCategoria = async (req, res) => { /* ...código original... */ };


/**
 * @desc    Busca o ranking de produtos mais vendidos no mês.
 * @route   GET /api/dashboard/ranking-produtos
 * @access  Protegido
 */
const getRankingProdutos = async (req, res) => {
    try {
        // ✅ CORREÇÃO APLICADA AQUI:
        // A sintaxe 'FROM movimentacoes m, jsonb_array_elements(m.produtos) AS item' foi a causa do erro.
        // A forma correta e mais moderna é usar um LATERAL JOIN.
        const query = `
            SELECT 
                p.nome,
                SUM(
                    (item->>'quantidade')::numeric * 
                    COALESCE((item->>'preco_manual')::numeric, p.price)
                ) AS total_vendido
            FROM 
                movimentacoes m
            CROSS JOIN LATERAL 
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
 * @desc    Busca o ranking de clientes que mais compraram no mês.
 * @route   GET /api/dashboard/ranking-clientes
 * @access  Protegido
 */
const getRankingClientes = async (req, res) => {
    try {
        // ✅ CORREÇÃO APLICADA AQUI:
        // A consulta já estava correta, mas mantemos o padrão para consistência.
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
