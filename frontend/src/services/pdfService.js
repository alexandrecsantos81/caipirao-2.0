// backend/services/pdfService.js

const PDFDocument = require('pdfkit');

function formatarData(data) {
    if (!data) return 'N/A';
    // Converte a data para o fuso horário local e formata
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function gerarPdfVenda(dadosVenda, dadosEmpresa) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            font: 'Helvetica'
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        // --- CABEÇALHO COM DADOS DA EMPRESA ---
        doc.fontSize(16).font('Helvetica-Bold').text(dadosEmpresa.nome_fantasia || 'Nome da Empresa', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(dadosEmpresa.razao_social || '', { align: 'center' });
        if (dadosEmpresa.cnpj) {
            doc.text(`CNPJ: ${dadosEmpresa.cnpj}`, { align: 'center' });
        }
        if (dadosEmpresa.endereco_completo) {
            doc.text(dadosEmpresa.endereco_completo, { align: 'center' });
        }
        if (dadosEmpresa.telefone) {
            doc.text(`Contato: ${dadosEmpresa.telefone}`, { align: 'center' });
        }
        doc.moveDown(2);

        // --- TÍTULO DO DOCUMENTO ---
        doc.fontSize(14).font('Helvetica-Bold').text(`Comprovante de Venda #${dadosVenda.id}`, { align: 'center' });
        doc.moveDown();

        // --- DADOS DA VENDA E DO CLIENTE ---
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Data da Venda:', { continued: true });
        doc.font('Helvetica').text(` ${formatarData(dadosVenda.data_venda)}`);

        doc.font('Helvetica-Bold').text('Cliente:', { continued: true });
        doc.font('Helvetica').text(` ${dadosVenda.cliente_nome || 'Não informado'}`);

        if (dadosVenda.cliente_endereco) {
            doc.font('Helvetica-Bold').text('Endereço:', { continued: true });
            doc.font('Helvetica').text(` ${dadosVenda.cliente_endereco}`);
        }
        doc.moveDown();

        // --- TABELA DE PRODUTOS ---
        doc.fontSize(12).font('Helvetica-Bold').text('Itens da Venda');
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 300;
        const priceX = 380;
        const totalX = 460;

        // Cabeçalhos da tabela
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Produto', itemX, tableTop);
        doc.text('Qtd.', qtyX, tableTop, { width: 60, align: 'right' });
        doc.text('Vlr. Unit.', priceX, tableTop, { width: 70, align: 'right' });
        doc.text('Subtotal', totalX, tableTop, { width: 85, align: 'right' });
        doc.moveDown();

        // Itens da tabela
        doc.font('Helvetica');
        dadosVenda.produtos.forEach(item => {
            const y = doc.y;
            doc.text(item.nome, itemX, y, { width: 240 });
            doc.text(`${item.quantidade} ${item.unidade_medida}`, qtyX, y, { width: 60, align: 'right' });
            doc.text(formatarMoeda(item.valor_unitario), priceX, y, { width: 70, align: 'right' });
            doc.text(formatarMoeda(item.quantidade * item.valor_unitario), totalX, y, { width: 85, align: 'right' });
            doc.moveDown(0.5);
        });
        doc.lineCap('butt').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // --- TOTAIS E PAGAMENTO ---
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Valor Total:', { width: 410, align: 'right' });
        doc.text(formatarMoeda(dadosVenda.valor_total), { align: 'right' });
        doc.moveDown();

        doc.fontSize(10).font('Helvetica');
        doc.text(`Forma de Pagamento: ${dadosVenda.opcao_pagamento}`);
        if (dadosVenda.opcao_pagamento === 'A PRAZO' && dadosVenda.data_pagamento) {
            doc.text(`Data do Pagamento: ${formatarData(dadosVenda.data_pagamento)}`);
        }
        doc.moveDown(2);

        // --- RODAPÉ ---
        doc.fontSize(8).text(`Vendedor: ${dadosVenda.vendedor_nome || 'Não informado'}`, { align: 'center' });
        doc.text(`Gerado em: ${formatarData(new Date())}`, { align: 'center' });

        doc.end();
    });
}

module.exports = { gerarPdfVenda };
