// backend/controllers/reportController.js

const pool = require('../db');
const PDFDocument = require('pdfkit');

// =====================================================================
// FUNÇÕES DE BUSCA DE DADOS (JSON) - COM CORREÇÕES
// =====================================================================

const getSalesSummary = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    try {
        // ✅ CORREÇÃO FINAL APLICADA AQUI:
        // Simplificamos a subconsulta 'evolucao_diaria' para agrupar diretamente
        // pelo campo 'data_venda', que já é do tipo DATE. Isso é mais robusto.
        const query = `
            WITH vendas_no_periodo AS (
                SELECT 
                    m.id, 
                    m.valor_total, 
                    m.data_venda,
                    (SELECT SUM((p_item->>'quantidade')::numeric) FROM jsonb_array_elements(m.produtos) AS p_item) as peso_venda
                FROM movimentacoes m
                WHERE m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
            ),
            evolucao_diaria AS (
                SELECT 
                    data_venda AS data, 
                    SUM(valor_total) AS faturamento 
                FROM vendas_no_periodo 
                GROUP BY data_venda
                ORDER BY data_venda ASC
            )
            SELECT 
                (SELECT json_build_object(
                    'faturamentoTotal', COALESCE(SUM(valor_total), 0), 
                    'pesoTotalVendido', COALESCE(SUM(peso_venda), 0), 
                    'totalTransacoes', COUNT(id)) 
                FROM vendas_no_periodo) AS kpis,
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
        // ✅ CORREÇÃO APLICADA AQUI:
        // A sintaxe 'FROM movimentacoes m, jsonb_array_elements(m.produtos) AS item' foi a causa do erro.
        // A forma correta e mais moderna é usar um LATERAL JOIN.
        const query = `
            SELECT 
                p.id AS "produtoId",
                p.nome,
                SUM(item.quantidade * COALESCE(item.preco_manual, p.price)) AS "valorTotal",
                SUM(item.quantidade) AS "quantidadeTotal"
            FROM 
                movimentacoes m
            CROSS JOIN LATERAL 
                jsonb_to_recordset(m.produtos) AS item(produto_id int, quantidade numeric, preco_manual numeric)
            JOIN 
                produtos p ON p.id = item.produto_id
            WHERE 
                m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2
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
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


// --- O RESTANTE DO ARQUIVO PERMANECE IGUAL ---

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

// ... (O restante do arquivo, com as funções de PDF, permanece o mesmo) ...
// (Vou omitir o resto para ser breve, mas você deve manter o seu código existente para as funções de PDF)

// =====================================================================
// FUNÇÕES DE GERAÇÃO DE PDF (ATUALIZADAS)
// =====================================================================

// Função de ajuda para buscar os dados da empresa
const getPdfHeaderData = async () => {
    const empresaResult = await pool.query('SELECT * FROM empresa_dados WHERE id = 1');
    return empresaResult.rows.length > 0 ? empresaResult.rows[0] : {};
};

// Função de ajuda para configurar o cabeçalho do PDF
const setupPdf = (res, doc, dadosEmpresa, title, subtitle) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=relatorio.pdf`);
    doc.pipe(res);

    // Cabeçalho da Empresa
    doc.fontSize(16).font('Helvetica-Bold').text(dadosEmpresa.nome_fantasia || 'Nome da Empresa', { align: 'center' });
    if (dadosEmpresa.cnpj) doc.fontSize(9).font('Helvetica').text(`CNPJ: ${dadosEmpresa.cnpj}`, { align: 'center' });
    if (dadosEmpresa.endereco_completo) doc.text(dadosEmpresa.endereco_completo, { align: 'center' });
    doc.moveDown(1);

    // Título do Relatório
    doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
    if (subtitle) {
        doc.fontSize(11).font('Helvetica').text(subtitle, { align: 'center' });
    }
    doc.moveDown(2);
};

const finalizePdf = (doc) => {
    doc.fontSize(8).font('Helvetica-Oblique').text(
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        50, 780, { align: 'right' }
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

const gerarComprovanteVenda = async (req, res) => {
    const { id } = req.params;
    try {
        const vendaQuery = `
            SELECT m.id, m.data_venda, m.valor_total, m.opcao_pagamento, m.produtos,
                   c.nome as cliente_nome, c.telefone as cliente_telefone, c.endereco as cliente_endereco,
                   u.nome as vendedor_nome
            FROM movimentacoes m
            LEFT JOIN clientes c ON m.cliente_id = c.id
            LEFT JOIN utilizadores u ON m.utilizador_id = u.id
            WHERE m.id = $1 AND m.tipo = 'ENTRADA'`;
        const vendaResult = await pool.query(vendaQuery, [id]);
        if (vendaResult.rows.length === 0) return res.status(404).json({ error: 'Venda não encontrada.' });
        
        const dadosVenda = vendaResult.rows[0];
        const dadosEmpresa = await getPdfHeaderData();
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=comprovante_venda_${id}.pdf`);
        doc.pipe(res);

        doc.fontSize(16).font('Helvetica-Bold').text(dadosEmpresa.nome_fantasia || 'Nome da Empresa', { align: 'center' });
        if (dadosEmpresa.cnpj) doc.fontSize(9).font('Helvetica').text(`CNPJ: ${dadosEmpresa.cnpj}`, { align: 'center' });
        if (dadosEmpresa.endereco_completo) doc.text(dadosEmpresa.endereco_completo, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).font('Helvetica-Bold').text(`Comprovante de Venda #${dadosVenda.id}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold').text('Data da Venda:', { continued: true }).font('Helvetica').text(` ${new Date(dadosVenda.data_venda).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        doc.font('Helvetica-Bold').text('Cliente:', { continued: true }).font('Helvetica').text(` ${dadosVenda.cliente_nome || 'Não informado'}`);
        if (dadosVenda.cliente_endereco) doc.font('Helvetica-Bold').text('Endereço:', { continued: true }).font('Helvetica').text(` ${dadosVenda.cliente_endereco}`);
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Itens da Venda');
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Produto', 50, tableTop);
        doc.text('Qtd.', 300, tableTop, { width: 60, align: 'right' });
        doc.text('Vlr. Unit.', 380, tableTop, { width: 70, align: 'right' });
        doc.text('Subtotal', 460, tableTop, { width: 85, align: 'right' });
        doc.moveDown();
        doc.font('Helvetica');
        dadosVenda.produtos.forEach(item => {
            const y = doc.y;
            doc.text(item.nome, 50, y, { width: 240 });
            doc.text(`${item.quantidade} ${item.unidade_medida}`, 300, y, { width: 60, align: 'right' });
            doc.text(item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 380, y, { width: 70, align: 'right' });
            doc.text((item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 460, y, { width: 85, align: 'right' });
            doc.moveDown(0.5);
        });
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Valor Total:', { width: 410, align: 'right' });
        doc.text(dadosVenda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { align: 'right' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Forma de Pagamento: ${dadosVenda.opcao_pagamento}`);
        
        finalizePdf(doc);

    } catch (error) {
        console.error('Erro ao gerar comprovante de venda:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getProductRankingPDF = async (req, res) => {
    const { startDate, endDate, orderBy = 'valor' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });
    try {
        // ✅ CORREÇÃO APLICADA AQUI TAMBÉM
        const query = `
            SELECT 
                p.nome, p.unidade_medida, SUM(item.quantidade) AS "quantidadeTotal", 
                SUM(item.quantidade * COALESCE(item.preco_manual, p.price)) AS "valorTotal"
            FROM 
                movimentacoes m
            CROSS JOIN LATERAL 
                jsonb_to_recordset(m.produtos) AS item(produto_id int, quantidade numeric, preco_manual numeric)
            JOIN 
                produtos p ON p.id = item.produto_id
            WHERE 
                m.tipo = 'ENTRADA' AND m.data_venda BETWEEN $1 AND $2 
            GROUP BY 
                p.id, p.nome, p.unidade_medida
            ORDER BY 
                CASE WHEN $3 = 'quantidade' THEN SUM(item.quantidade) ELSE SUM(item.quantidade * COALESCE(item.preco_manual, p.price)) END DESC;
        `;
        const result = await pool.query(query, [startDate, endDate, orderBy]);
        const data = result.rows;
        const dadosEmpresa = await getPdfHeaderData();
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, dadosEmpresa, 'Relatório de Ranking de Produtos', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [null, { text: 'Produto', x: 45, width: 280 }, { text: 'Qtd. Total', x: 330, width: 100, align: 'right' }, { text: 'Valor Total (R$)', x: 430, width: 120, align: 'right' }], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [index, { text: item.nome, x: 45, width: 280 }, { text: `${Number(item.quantidadeTotal).toFixed(2)} ${item.unidade_medida}`, x: 330, width: 100, align: 'right' }, { text: Number(item.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 430, width: 120, align: 'right' }]);
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
        const dadosEmpresa = await getPdfHeaderData();
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, dadosEmpresa, 'Relatório de Ranking de Clientes', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [null, { text: 'Cliente', x: 45, width: 230 }, { text: 'Telefone', x: 280, width: 90 }, { text: 'Nº Compras', x: 375, width: 70, align: 'right' }, { text: 'Valor Gasto (R$)', x: 450, width: 100, align: 'right' }], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [index, { text: item.nome, x: 45, width: 230 }, { text: item.telefone || 'N/A', x: 280, width: 90 }, { text: item.totalCompras, x: 375, width: 70, align: 'right' }, { text: Number(item.valorTotalGasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 450, width: 100, align: 'right' }]);
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
        const dadosEmpresa = await getPdfHeaderData();
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, dadosEmpresa, 'Relatório de Produtividade por Vendedor', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [null, { text: 'Vendedor', x: 45, width: 280 }, { text: 'Nº de Vendas', x: 330, width: 100, align: 'right' }, { text: 'Valor Total Vendido (R$)', x: 430, width: 120, align: 'right' }], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [index, { text: item.nome, x: 45, width: 280 }, { text: item.numeroDeVendas, x: 330, width: 100, align: 'right' }, { text: Number(item.valorTotalVendido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 430, width: 120, align: 'right' }]);
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
        const dadosEmpresa = await getPdfHeaderData();
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        setupPdf(res, doc, dadosEmpresa, 'Relatório de Entradas de Estoque', `Período de ${new Date(startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`);
        
        let y = doc.y;
        generateTableRow(doc, y, [null, { text: 'Data', x: 45, width: 70 }, { text: 'Produto', x: 120, width: 170 }, { text: 'Responsável', x: 300, width: 110 }, { text: 'Quantidade', x: 415, width: 60, align: 'right' }, { text: 'Custo (R$)', x: 480, width: 70, align: 'right' }], true);
        y += 20;

        data.forEach((item, index) => {
            generateTableRow(doc, y, [index, { text: new Date(item.data_entrada).toLocaleDateString('pt-BR'), x: 45, width: 70 }, { text: item.produto_nome, x: 120, width: 170 }, { text: item.responsavel_nome, x: 300, width: 110 }, { text: Number(item.quantidade_adicionada).toFixed(2), x: 415, width: 60, align: 'right' }, { text: Number(item.custo_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), x: 480, width: 70, align: 'right' }]);
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
    gerarComprovanteVenda,
    getProductRankingPDF,
    getClientRankingPDF,
    getSellerProductivityPDF,
    getStockEntriesPDF,
};
