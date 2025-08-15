// backend/controllers/reportController.js

const pool = require('../db');
const PDFDocument = require('pdfkit');

// ... (Funções de busca de dados como getSalesSummary, getProductRanking, etc. permanecem as mesmas) ...
const getSalesSummary = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    try {
        const query = `
            WITH vendas_no_periodo AS (
                SELECT id, valor_total, data_venda, (SELECT COALESCE(SUM((item->>'quantidade')::numeric), 0) FROM jsonb_array_elements(produtos) AS item) AS peso_venda
                FROM movimentacoes WHERE tipo = 'ENTRADA' AND data_venda BETWEEN $1 AND $2
            ),
            evolucao_diaria AS (
                SELECT data_venda::date AS data, SUM(valor_total) AS faturamento FROM vendas_no_periodo GROUP BY data_venda::date ORDER BY data ASC
            )
            SELECT 
                (SELECT json_build_object('faturamentoTotal', COALESCE(SUM(valor_total), 0), 'pesoTotalVendido', COALESCE(SUM(peso_venda), 0), 'totalTransacoes', COUNT(id)) FROM vendas_no_periodo) AS kpis,
                (SELECT COALESCE(json_agg(evolucao_diaria), '[]'::json) FROM evolucao_diaria) AS evolucaoVendas;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao gerar resumo de vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar resumo de vendas.' });
    }
};

const getProductRanking = async (req, res) => {
    const { startDate, endDate, orderBy = 'valor' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    if (orderBy !== 'valor' && orderBy !== 'quantidade') return res.status(400).json({ error: "Parâmetro 'orderBy' inválido." });
    try {
        const query = `
            SELECT p.id AS "produtoId", p.nome, SUM((item->>'quantidade')::numeric * COALESCE((item->>'preco_manual')::numeric, p.price)) AS "valorTotal", SUM((item->>'quantidade')::numeric) AS "quantidadeTotal"
            FROM movimentacoes m, jsonb_to_recordset(m.produtos) AS item(produto_id int, quantidade numeric, preco_manual numeric)
            JOIN produtos p ON p.id = item.produto_id
            WHERE m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
            GROUP BY p.id, p.nome
            ORDER BY CASE WHEN $3 = 'quantidade' THEN SUM((item->>'quantidade')::numeric) ELSE SUM((item->>'quantidade')::numeric * COALESCE((item->>'preco_manual')::numeric, p.price)) END DESC LIMIT 10;
        `;
        const result = await pool.query(query, [startDate, endDate, orderBy]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar ranking de produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getClientRanking = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    try {
        const query = `
            SELECT c.id AS "clienteId", c.nome, c.telefone, COUNT(m.id) AS "totalCompras", SUM(m.valor_total) AS "valorTotalGasto"
            FROM movimentacoes m JOIN clientes c ON m.cliente_id = c.id
            WHERE m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
            GROUP BY c.id, c.nome, c.telefone ORDER BY "valorTotalGasto" DESC LIMIT 20;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar ranking de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getClientAnalysis = async (req, res) => {
    try {
        const query = `
            WITH ultima_compra AS (SELECT cliente_id, MAX(data_venda) as data_ultima_compra FROM movimentacoes WHERE tipo = 'ENTRADA' GROUP BY cliente_id)
            SELECT c.id AS "clienteId", c.nome, c.telefone, uc.data_ultima_compra,
                   CASE WHEN uc.data_ultima_compra >= CURRENT_DATE - INTERVAL '90 days' THEN 'Ativo' ELSE 'Inativo' END AS status
            FROM clientes c LEFT JOIN ultima_compra uc ON c.id = uc.cliente_id
            ORDER BY status, uc.data_ultima_compra DESC NULLS LAST, c.nome;
        `;
        const result = await pool.query(query);
        const ativos = result.rows.filter(c => c.status === 'Ativo');
        const inativos = result.rows.filter(c => c.status === 'Inativo');
        res.status(200).json({ ativos, inativos });
    } catch (error) {
        console.error('Erro ao gerar análise de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getSellerProductivity = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    try {
        const query = `
            SELECT u.id AS "vendedorId", u.nome, COUNT(m.id) AS "numeroDeVendas", COALESCE(SUM(m.valor_total), 0) AS "valorTotalVendido"
            FROM utilizadores u LEFT JOIN movimentacoes m ON u.id = m.utilizador_id AND m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
            WHERE u.status = 'ATIVO' GROUP BY u.id, u.nome ORDER BY "valorTotalVendido" DESC;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar relatório de produtividade:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getStockEntriesReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    try {
        const query = `
            SELECT ee.id, ee.data_entrada, p.nome AS "produto_nome", u.nome AS "responsavel_nome", ee.quantidade_adicionada, ee.custo_total, ee.observacao
            FROM entradas_estoque ee JOIN produtos p ON ee.produto_id = p.id JOIN utilizadores u ON ee.utilizador_id = u.id
            WHERE ee.data_entrada::date BETWEEN $1 AND $2 ORDER BY ee.data_entrada DESC;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar relatório de entradas de estoque:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


// =====================================================================
// FUNÇÕES DE GERAÇÃO DE PDF (REATORADAS)
// =====================================================================

const setupPdf = (res, doc, title, subtitle) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=relatorio_${title.toLowerCase().replace(/ /g, '_')}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
    if (subtitle) {
        doc.fontSize(12).font('Helvetica').text(subtitle, { align: 'center' });
    }
    doc.moveDown(2);
};

// CORREÇÃO APLICADA AQUI
const finalizePdf = (doc) => {
    // Posiciona o texto no rodapé da página (coordenada Y fixa)
    doc.fontSize(8).font('Helvetica-Oblique').text(
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        50, // margem esquerda
        780, // posição vertical perto do final da página A4
        { align: 'right' }
    );
    doc.end();
};

function generateTableRow(doc, y, items, isHeader = false) {
    const rowHeight = 20;
    const startX = 40;
    const endX = 555;

    if (!isHeader && items[0] % 2 === 0) {
        doc.rect(startX, y, endX - startX, rowHeight).fill('#f0f0f0');
    }
    
    doc.fillColor('black').font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);

    items.slice(1).forEach((item, i) => {
        doc.text(item.text, item.x, y + 6, { width: item.width, align: item.align || 'left' });
    });

    doc.moveTo(startX, y + rowHeight).lineTo(endX, y + rowHeight).strokeColor('#cccccc').stroke();
}

const getProductRankingPDF = async (req, res) => {
    const { startDate, endDate, orderBy = 'valor' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });
    try {
        const query = `
            SELECT p.nome, p.unidade_medida, SUM((item->>'quantidade')::numeric) AS "quantidadeTotal", SUM((item->>'quantidade')::numeric * COALESCE((item->>'preco_manual')::numeric, p.price)) AS "valorTotal"
            FROM movimentacoes m, jsonb_array_elements(m.produtos) AS item JOIN produtos p ON (item->>'produto_id')::int = p.id
            WHERE m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2 GROUP BY p.id, p.nome, p.unidade_medida
            ORDER BY CASE WHEN $3 = 'quantidade' THEN SUM((item->>'quantidade')::numeric) ELSE SUM((item->>'quantidade')::numeric * COALESCE((item->>'preco_manual')::numeric, p.price)) END DESC;
        `;
        const result = await pool.query(query, [startDate, endDate, orderBy]);
        const data = result.rows;
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, 'Relatório de Ranking de Produtos', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [
            null,
            { text: 'Produto', x: 45, width: 280 },
            { text: 'Qtd. Total', x: 330, width: 100, align: 'right' },
            { text: 'Valor Total (R$)', x: 430, width: 120, align: 'right' }
        ], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [
                index,
                { text: item.nome, x: 45, width: 280 },
                { text: `${item.quantidadeTotal.toFixed(2)} ${item.unidade_medida}`, x: 330, width: 100, align: 'right' },
                { text: item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 430, width: 120, align: 'right' }
            ]);
            y += 20;
        });
        
        finalizePdf(doc);
    } catch (error) {
        console.error('Erro ao gerar PDF de produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getClientRankingPDF = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });
    try {
        const query = `
            SELECT c.nome, c.telefone, COUNT(m.id) AS "totalCompras", SUM(m.valor_total) AS "valorTotalGasto"
            FROM movimentacoes m JOIN clientes c ON m.cliente_id = c.id
            WHERE m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
            GROUP BY c.id, c.nome, c.telefone ORDER BY "valorTotalGasto" DESC;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        const data = result.rows;
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, 'Relatório de Ranking de Clientes', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [
            null,
            { text: 'Cliente', x: 45, width: 230 },
            { text: 'Telefone', x: 280, width: 90 },
            { text: 'Nº Compras', x: 375, width: 70, align: 'right' },
            { text: 'Valor Gasto (R$)', x: 450, width: 100, align: 'right' }
        ], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [
                index,
                { text: item.nome, x: 45, width: 230 },
                { text: item.telefone || 'N/A', x: 280, width: 90 },
                { text: item.totalCompras, x: 375, width: 70, align: 'right' },
                { text: item.valorTotalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 450, width: 100, align: 'right' }
            ]);
            y += 20;
        });

        finalizePdf(doc);
    } catch (error) {
        console.error('Erro ao gerar PDF de clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getSellerProductivityPDF = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });
    try {
        const query = `
            SELECT u.nome, COUNT(m.id) AS "numeroDeVendas", COALESCE(SUM(m.valor_total), 0) AS "valorTotalVendido"
            FROM utilizadores u LEFT JOIN movimentacoes m ON u.id = m.utilizador_id AND m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
            WHERE u.status = 'ATIVO' GROUP BY u.id, u.nome ORDER BY "valorTotalVendido" DESC;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        const data = result.rows;
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, 'Relatório de Produtividade por Vendedor', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [
            null,
            { text: 'Vendedor', x: 45, width: 280 },
            { text: 'Nº de Vendas', x: 330, width: 100, align: 'right' },
            { text: 'Valor Total Vendido (R$)', x: 430, width: 120, align: 'right' }
        ], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [
                index,
                { text: item.nome, x: 45, width: 280 },
                { text: item.numeroDeVendas, x: 330, width: 100, align: 'right' },
                { text: item.valorTotalVendido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 430, width: 120, align: 'right' }
            ]);
            y += 20;
        });

        finalizePdf(doc);
    } catch (error) {
        console.error('Erro ao gerar PDF de produtividade:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getStockEntriesPDF = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });
    try {
        const query = `
            SELECT ee.data_entrada, p.nome AS produto_nome, u.nome AS responsavel_nome, ee.quantidade_adicionada, ee.custo_total
            FROM entradas_estoque ee JOIN produtos p ON ee.produto_id = p.id JOIN utilizadores u ON ee.utilizador_id = u.id
            WHERE ee.data_entrada::date BETWEEN $1 AND $2 ORDER BY ee.data_entrada DESC;
        `;
        const result = await pool.query(query, [startDate, endDate]);
        const data = result.rows;
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, 'Relatório de Entradas de Estoque', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [
            null,
            { text: 'Data', x: 45, width: 70 },
            { text: 'Produto', x: 120, width: 170 },
            { text: 'Responsável', x: 300, width: 110 },
            { text: 'Quantidade', x: 415, width: 60, align: 'right' },
            { text: 'Custo (R$)', x: 480, width: 70, align: 'right' }
        ], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [
                index,
                { text: new Date(item.data_entrada).toLocaleDateString('pt-BR'), x: 45, width: 70 },
                { text: item.produto_nome, x: 120, width: 170 },
                { text: item.responsavel_nome, x: 300, width: 110 },
                { text: item.quantidade_adicionada.toFixed(2), x: 415, width: 60, align: 'right' },
                { text: item.custo_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 480, width: 70, align: 'right' }
            ]);
            y += 20;
        });

        finalizePdf(doc);
    } catch (error) {
        console.error('Erro ao gerar PDF de estoque:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getSalesSummary,
    getProductRanking,
    getClientRanking,
    getClientAnalysis,
    getSellerProductivity,
    getStockEntriesReport,
    getProductRankingPDF,
    getClientRankingPDF,
    getSellerProductivityPDF,
    getStockEntriesPDF,
};
