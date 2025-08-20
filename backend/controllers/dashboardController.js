const pool = require('../db');

// ... (a função getKPIs, que já foi corrigida, permanece a mesma) ...
const getKPIs = async (req, res) => {
    try {
        const receitasPagasQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "totalVendasMes"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND data_pagamento IS NOT NULL AND
                  data_pagamento >= DATE_TRUNC('month', CURRENT_DATE) AND
                  data_pagamento < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const receitasPagasResult = await pool.query(receitasPagasQuery);
        const totalVendasMes = parseFloat(receitasPagasResult.rows[0].totalVendasMes);

        const despesasPagasQuery = `
            SELECT COALESCE(SUM(valor), 0) AS "totalDespesasMes"
            FROM despesas
            WHERE data_pagamento IS NOT NULL AND
                  data_pagamento >= DATE_TRUNC('month', CURRENT_DATE) AND
                  data_pagamento < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const despesasPagasResult = await pool.query(despesasPagasQuery);
        const totalDespesasMes = parseFloat(despesasPagasResult.rows[0].totalDespesasMes);

        const contasAReceberQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "totalContasAReceber"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND opcao_pagamento = 'A PRAZO' AND data_pagamento IS NULL;
        `;
        const contasAReceberResult = await pool.query(contasAReceberQuery);
        const totalContasAReceber = parseFloat(contasAReceberResult.rows[0].totalContasAReceber);

        const contasAPagarQuery = `
            SELECT COALESCE(SUM(valor), 0) AS "totalContasAPagar"
            FROM despesas
            WHERE data_pagamento IS NULL;
        `;
        const contasAPagarResult = await pool.query(contasAPagarQuery);
        const totalContasAPagar = parseFloat(contasAPagarResult.rows[0].totalContasAPagar);

        const novosClientesQuery = `
            SELECT COUNT(id) AS "novosClientesMes"
            FROM clientes
            WHERE data_criacao >= DATE_TRUNC('month', CURRENT_DATE);
        `;
        const novosClientesResult = await pool.query(novosClientesQuery);
        const novosClientesMes = parseInt(novosClientesResult.rows[0].novosClientesMes, 10);

        const receitaPrevistaQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "receitaPrevistaMes"
            FROM movimentacoes
            WHERE tipo = 'ENTRADA' AND
                  data_venda >= DATE_TRUNC('month', CURRENT_DATE) AND
                  data_venda < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const receitaPrevistaResult = await pool.query(receitaPrevistaQuery);
        const receitaPrevistaMes = parseFloat(receitaPrevistaResult.rows[0].receitaPrevistaMes);

        res.status(200).json({
            totalVendasMes,
            totalDespesasMes,
            saldoMes: totalVendasMes - totalDespesasMes,
            totalContasAReceber,
            totalContasAPagar,
            novosClientesMes,
            receitaPrevistaMes,
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
        // A forma correta e mais moderna é usar um LATERAL JOIN com jsonb_to_recordset.
        const query = `
            SELECT 
                p.nome,
                SUM(item.quantidade * COALESCE(item.preco_manual, p.price)) AS total_vendido
            FROM 
                movimentacoes m
            CROSS JOIN LATERAL 
                jsonb_to_recordset(m.produtos) AS item(produto_id int, quantidade numeric, preco_manual numeric)
            JOIN 
                produtos p ON p.id = item.produto_id
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
        // A consulta já estava correta, mas garantimos a consistência e robustez.
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

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'É necessário fornecer tanto a data de início quanto a de fim.' });
    }

    try {
        // ✅ CONSULTA CORRIGIDA E OTIMIZADA
        // Usando CTEs (Common Table Expressions) para clareza e performance.
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

// ... (a função getDashboardVendedor permanece a mesma) ...
const getDashboardVendedor = async (req, res) => {
    const vendedorId = req.params.id;
    const userIdFromToken = req.user.id;

    if (parseInt(vendedorId, 10) !== userIdFromToken) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode visualizar seu próprio dashboard.' });
    }

    try {
        const totalVendasQuery = `
            SELECT COALESCE(SUM(valor_total), 0) AS "totalVendasMes"
            FROM movimentacoes
            WHERE utilizador_id = $1
              AND tipo = 'ENTRADA'
              AND data_venda >= DATE_TRUNC('month', CURRENT_DATE)
              AND data_venda < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const totalVendasResult = await pool.query(totalVendasQuery, [vendedorId]);
        const totalVendasMes = parseFloat(totalVendasResult.rows[0].totalVendasMes);

        const novosClientesQuery = `
            SELECT COUNT(DISTINCT m.cliente_id) AS "novosClientesMes"
            FROM movimentacoes m
            JOIN clientes c ON m.cliente_id = c.id
            WHERE m.utilizador_id = $1
              AND c.data_criacao >= DATE_TRUNC('month', CURRENT_DATE)
              AND c.data_criacao < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        `;
        const novosClientesResult = await pool.query(novosClientesQuery, [vendedorId]);
        const novosClientesMes = parseInt(novosClientesResult.rows[0].novosClientesMes, 10);

        const comissaoPrevista = totalVendasMes * 0.05;

        res.status(200).json({
            totalVendasMes,
            novosClientesMes,
            comissaoPrevista
        });

    } catch (error) {
        console.error(`Erro ao buscar KPIs para o vendedor ${vendedorId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar sua solicitação.' });
    }
};


module.exports = {
    getKPIs,
    getVendasPorDia,
    getDespesasPorCategoria,
    getRankingProdutos,
    getRankingClientes,
    getFluxoCaixaDiario,
    getDashboardVendedor,
};
