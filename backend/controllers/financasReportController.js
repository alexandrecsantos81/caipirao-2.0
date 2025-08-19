const pool = require('../db');
const PDFDocument = require('pdfkit'); // Usaremos a biblioteca base, não a 'pdfkit-table'

/**
 * Função auxiliar para desenhar uma tabela manualmente no PDF.
 * @param {PDFDocument} doc - A instância do documento PDF.
 * @param {Array<Object>} data - Os dados a serem exibidos nas linhas.
 * @param {Object} options - Opções de configuração da tabela.
 */
const drawTable = (doc, data, options) => {
    let y = doc.y;
    const { headers, rowHeight = 20, columnWidths, columnAligns } = options;

    // Desenhar o cabeçalho da tabela
    doc.font('Helvetica-Bold').fontSize(9);
    headers.forEach((header, i) => {
        doc.text(header, columnWidths[i].x, y, { width: columnWidths[i].width, align: columnAligns[i] });
    });
    y += rowHeight;
    doc.moveTo(40, y - 5).lineTo(555, y - 5).strokeColor('#333').stroke();

    // Desenhar as linhas de dados
    doc.font('Helvetica').fontSize(8);
    data.forEach((row, rowIndex) => {
        // Adiciona um fundo cinza para linhas alternadas para melhor legibilidade
        if (rowIndex % 2 === 1) {
            doc.rect(40, y, 515, rowHeight).fill('#f0f0f0').fillColor('black');
        }

        // Itera sobre as chaves de cada objeto de dados para preencher as células
        Object.keys(row).forEach((key, i) => {
            let cellText = row[key];

            // Formatação dos dados da célula
            if (cellText === null || cellText === undefined) {
                cellText = '---';
            } else if (typeof cellText === 'number') {
                cellText = cellText.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            } else if (key.includes('data') && cellText) {
                cellText = new Date(cellText).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            }

            doc.text(String(cellText), columnWidths[i].x, y + 6, { width: columnWidths[i].width, align: columnAligns[i] });
        });

        y += rowHeight;

        // Reseta a cor de preenchimento após uma linha cinza
        if (rowIndex % 2 === 1) {
            doc.fillColor('black');
        }
    });
};

/**
 * Função genérica para gerar um PDF a partir de uma consulta SQL.
 * @param {Object} req - O objeto de requisição do Express.
 * @param {Object} res - O objeto de resposta do Express.
 * @param {string} title - O título principal do relatório.
 * @param {string} query - A consulta SQL para buscar os dados.
 * @param {Array} params - Os parâmetros para a consulta SQL.
 * @param {Object} tableOptions - As opções de layout para a tabela.
 */
const generatePdf = async (req, res, title, query, params, tableOptions) => {
    try {
        const result = await pool.query(query, params);
        const data = result.rows;

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${title.toLowerCase().replace(/ /g, '_')}.pdf`);
        doc.pipe(res);

        // Cabeçalho do documento
        doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(
            `Período de ${new Date(params[0]).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a ${new Date(params[1]).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`,
            { align: 'center' }
        );
        doc.moveDown(2);

        // Verifica se há dados para exibir
        if (data.length === 0) {
            doc.fontSize(14).font('Helvetica-Oblique').text('Nenhum dado encontrado para o período selecionado.', { align: 'center' });
        } else {
            // Desenha a tabela usando a nova função manual
            drawTable(doc, data, tableOptions);
        }

        doc.end();
    } catch (error) {
        console.error(`Erro ao gerar PDF de ${title}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ error: `Erro interno do servidor ao gerar o relatório de ${title}.` });
        }
    }
};

// Função para gerar o PDF de Receitas Pessoais
const getReceitasPessoaisPDF = (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });

    const query = `
        SELECT data_recebimento, descricao, categoria, valor 
        FROM receitas_externas
        WHERE data_recebimento BETWEEN $1 AND $2
        ORDER BY data_recebimento DESC;
    `;
    
    const tableOptions = {
        headers: ['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'VALOR'],
        columnWidths: [ { x: 45, width: 80 }, { x: 130, width: 220 }, { x: 355, width: 100 }, { x: 460, width: 90 } ],
        columnAligns: ['left', 'left', 'left', 'right']
    };

    generatePdf(req, res, 'Relatório de Receitas Pessoais', query, [startDate, endDate], tableOptions);
};

// Função para gerar o PDF de Despesas Pessoais
const getDespesasPessoaisPDF = (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Datas são obrigatórias.' });

    const query = `
        SELECT data_vencimento, descricao, categoria, valor,
               CASE WHEN pago = TRUE THEN 'Pago' ELSE 'Pendente' END as status
        FROM despesas_pessoais
        WHERE data_vencimento BETWEEN $1 AND $2
        ORDER BY data_vencimento ASC;
    `;
    
    const tableOptions = {
        headers: ['VENCIMENTO', 'DESCRIÇÃO', 'CATEGORIA', 'STATUS', 'VALOR'],
        columnWidths: [ { x: 45, width: 80 }, { x: 130, width: 200 }, { x: 335, width: 80 }, { x: 420, width: 50 }, { x: 475, width: 75 } ],
        columnAligns: ['left', 'left', 'left', 'center', 'right']
    };

    generatePdf(req, res, 'Relatório de Despesas Pessoais', query, [startDate, endDate], tableOptions);
};

module.exports = {
    getReceitasPessoaisPDF,
    getDespesasPessoaisPDF,
};
