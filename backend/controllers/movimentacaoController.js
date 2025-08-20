const pool = require('../db');
const PDFDocument = require('pdfkit');

/**
 * @desc    Registrar uma nova VENDA (ENTRADA) com lógica financeira e verificação de estoque
 * @route   POST /api/movimentacoes/vendas
 * @access  Privado (qualquer usuário logado)
 */
const createVenda = async (req, res) => {
  const { cliente_id, produtos, data_venda, opcao_pagamento, data_vencimento } = req.body;
  const utilizador_id = req.user.id;

  if (!utilizador_id) {
    return res.status(401).json({ error: 'ID do usuário não encontrado no token. Faça login novamente.' });
  }
  if (!cliente_id || !produtos || !Array.isArray(produtos) || produtos.length === 0 || !opcao_pagamento || !data_venda) {
    return res.status(400).json({ error: 'Dados da venda inválidos.' });
  }
  if (opcao_pagamento === 'A PRAZO' && !data_vencimento) {
    return res.status(400).json({ error: 'Data de vencimento é obrigatória para vendas a prazo.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let valor_total_venda = 0;
    const produtosParaSalvar = [];

    for (const item of produtos) {
      if (!item.produto_id || !item.quantidade || item.quantidade <= 0) {
        throw new Error('Cada produto na venda deve ter um ID e uma quantidade válida.');
      }
      const produtoResult = await client.query('SELECT nome, price, unidade_medida, quantidade_em_estoque FROM produtos WHERE id = $1 FOR UPDATE', [item.produto_id]);
      if (produtoResult.rows.length === 0) {
        throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      }
      const produtoDB = produtoResult.rows[0];

      if (produtoDB.quantidade_em_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${produtoDB.nome}". Disponível: ${produtoDB.quantidade_em_estoque}, Solicitado: ${item.quantidade}.`);
      }
    }

    for (const item of produtos) {
      const produtoResult = await client.query('SELECT nome, price, unidade_medida FROM produtos WHERE id = $1', [item.produto_id]);
      const produtoDB = produtoResult.rows[0];
      
      const valor_unitario = (item.preco_manual !== undefined && item.preco_manual !== null && !isNaN(parseFloat(item.preco_manual)))
                             ? parseFloat(item.preco_manual)
                             : parseFloat(produtoDB.price);
      
      const valor_item = item.quantidade * valor_unitario;
      valor_total_venda += valor_item;
      
      produtosParaSalvar.push({
        produto_id: item.produto_id, nome: produtoDB.nome, unidade_medida: produtoDB.unidade_medida,
        quantidade: item.quantidade, valor_unitario: valor_unitario, valor_total_item: valor_item,
      });

      await client.query('UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque - $1 WHERE id = $2', [item.quantidade, item.produto_id]);
    }

    const data_pagamento_inicial = opcao_pagamento === 'À VISTA' ? data_venda : null;
    const data_vencimento_final = opcao_pagamento === 'À VISTA' ? data_venda : data_vencimento;

    const movimentacaoResult = await client.query(
      `INSERT INTO movimentacoes (tipo, valor_total, cliente_id, utilizador_id, produtos, data_venda, opcao_pagamento, data_vencimento, data_pagamento)
       VALUES ('ENTRADA', $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [valor_total_venda, cliente_id, utilizador_id, JSON.stringify(produtosParaSalvar), data_venda, opcao_pagamento, data_vencimento_final, data_pagamento_inicial]
    );
    const movimentacao_id = movimentacaoResult.rows[0].id;
    
    await client.query('COMMIT');
    res.status(201).json({ id: movimentacao_id, message: 'Venda registrada com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', error);
    res.status(400).json({ error: error.message || 'Erro interno do servidor ao registrar venda.' });
  } finally {
    client.release();
  }
};


/**
 * @desc    Obter todas as VENDAS com paginação e filtro
 * @route   GET /api/movimentacoes/vendas
 * @access  Privado (qualquer usuário logado)
 */
const getVendas = async (req, res) => {
    const { pagina = 1, limite = 50, termoBusca } = req.query;
    const offset = (pagina - 1) * limite;

    let whereClauses = ["m.tipo = 'ENTRADA'"];
    const params = [];

    if (termoBusca) {
        params.push(`%${termoBusca}%`);
        whereClauses.push(`(c.nome ILIKE $${params.length} OR u.nome ILIKE $${params.length})`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const countQuery = `
            SELECT COUNT(m.id)
            FROM movimentacoes m
            LEFT JOIN clientes c ON m.cliente_id = c.id
            LEFT JOIN utilizadores u ON m.utilizador_id = u.id
            ${whereString}
        `;
        const totalResult = await pool.query(countQuery, params);
        const totalVendas = parseInt(totalResult.rows[0].count, 10);

        const query = `
            SELECT m.id, m.data_venda, m.valor_total, m.opcao_pagamento, m.data_vencimento, m.data_pagamento, c.nome AS cliente_nome, u.nome AS usuario_nome, m.produtos, m.cliente_id
            FROM movimentacoes m
            LEFT JOIN clientes c ON m.cliente_id = c.id
            LEFT JOIN utilizadores u ON m.utilizador_id = u.id
            ${whereString}
            ORDER BY m.data_venda DESC, m.id DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2};
        `;
        
        const vendasResult = await pool.query(query, [...params, limite, offset]);
        
        // ✅ NOVO: Calcular o peso total para cada venda
        const vendasComPeso = vendasResult.rows.map(venda => {
            let peso_total = 0;
            if (venda.produtos && Array.isArray(venda.produtos)) {
                peso_total = venda.produtos.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
            }
            return {
                ...venda,
                peso_total: peso_total
            };
        });

        res.status(200).json({
            dados: vendasComPeso, // Envia os dados com o novo campo
            total: totalVendas,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas: Math.ceil(totalVendas / limite),
        });
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Obter todas as contas a receber pendentes para o card do dashboard
 * @route   GET /api/movimentacoes/contas-a-receber
 * @access  Restrito (Admin)
 */
const getContasAReceber = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id,
                m.valor_total,
                m.data_vencimento,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone
            FROM 
                movimentacoes m
            JOIN 
                clientes c ON m.cliente_id = c.id
            WHERE 
                m.tipo = 'ENTRADA' 
                AND m.opcao_pagamento = 'A PRAZO'
                AND m.data_pagamento IS NULL
            ORDER BY 
                m.data_vencimento ASC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar contas a receber:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Registrar o pagamento (total ou parcial) de uma venda
 * @route   PUT /api/movimentacoes/vendas/:id/pagamento
 * @access  Restrito (Admin)
 */
const registrarPagamento = async (req, res) => {
    const { id } = req.params;
    const { data_pagamento, valor_pago, responsavel_quitacao_id } = req.body;
    const userIdFromToken = req.user.id;

    if (!data_pagamento || valor_pago === undefined || valor_pago <= 0) {
        return res.status(400).json({ error: 'Data de pagamento e um valor pago válido são obrigatórios.' });
    }
    
    const responsavelId = responsavel_quitacao_id || userIdFromToken;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const vendaOriginalResult = await client.query(
            'SELECT * FROM movimentacoes WHERE id = $1 AND data_pagamento IS NULL FOR UPDATE', 
            [id]
        );

        if (vendaOriginalResult.rowCount === 0) {
            throw new Error('Venda não encontrada ou já quitada.');
        }

        const vendaOriginal = vendaOriginalResult.rows[0];
        const valorPagoNumerico = parseFloat(valor_pago);
        const valorDevido = parseFloat(vendaOriginal.valor_total);

        if (valorPagoNumerico > valorDevido + 0.001) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `O valor a pagar (R$ ${valorPagoNumerico.toFixed(2)}) não pode ser maior que o saldo devedor (R$ ${valorDevido.toFixed(2)}).` });
        }

        const valorRestante = valorDevido - valorPagoNumerico;

        if (valorRestante <= 0.009) { 
            const vendaQuitada = await client.query(
                `UPDATE movimentacoes 
                 SET data_pagamento = $1, valor_total = $2, responsavel_quitacao_id = $3
                 WHERE id = $4
                 RETURNING *`,
                [data_pagamento, valorDevido, responsavelId, id]
            );
            await client.query('COMMIT');
            return res.status(200).json(vendaQuitada.rows[0]);

        } else {
            await client.query(
                'UPDATE movimentacoes SET valor_total = $1 WHERE id = $2',
                [valorRestante, id]
            );

            const novaMovimentacaoPaga = await client.query(
                `INSERT INTO movimentacoes (tipo, valor_total, cliente_id, utilizador_id, produtos, data_venda, opcao_pagamento, data_vencimento, data_pagamento, responsavel_quitacao_id, venda_pai_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [
                    vendaOriginal.tipo,
                    valorPagoNumerico,
                    vendaOriginal.cliente_id,
                    vendaOriginal.utilizador_id,
                    JSON.stringify([{ "descricao": `PAGAMENTO PARCIAL - REF. VENDA #${id}` }]),
                    vendaOriginal.data_venda,
                    vendaOriginal.opcao_pagamento,
                    vendaOriginal.data_vencimento,
                    data_pagamento,
                    responsavelId,
                    id
                ]
            );
            
            await client.query('COMMIT');
            return res.status(200).json(novaMovimentacaoPaga.rows[0]);
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao registrar pagamento:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};


/**
 * @desc    Atualizar uma VENDA (ENTRADA)
 * @route   PUT /api/movimentacoes/vendas/:id
 * @access  Privado (qualquer usuário logado)
 */
const updateVenda = async (req, res) => {
    const { id } = req.params;
    const { cliente_id, produtos, data_venda, opcao_pagamento, data_vencimento } = req.body;
    
    if (!cliente_id || !produtos || !Array.isArray(produtos) || produtos.length === 0 || !opcao_pagamento || !data_venda) {
        return res.status(400).json({ error: 'Dados da venda inválidos.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const vendaAntigaResult = await client.query('SELECT produtos FROM movimentacoes WHERE id = $1 AND tipo = \'ENTRADA\' FOR UPDATE', [id]);
        if (vendaAntigaResult.rows.length === 0) {
            throw new Error('Venda não encontrada.');
        }
        const produtosAntigos = vendaAntigaResult.rows[0].produtos;
        for (const item of produtosAntigos) {
            await client.query('UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque + $1 WHERE id = $2', [item.quantidade, item.produto_id]);
        }

        for (const item of produtos) {
            const produtoResult = await client.query('SELECT nome, quantidade_em_estoque FROM produtos WHERE id = $1 FOR UPDATE', [item.produto_id]);
            if (produtoResult.rows.length === 0) throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
            const produtoDB = produtoResult.rows[0];
            if (produtoDB.quantidade_em_estoque < item.quantidade) {
                throw new Error(`Estoque insuficiente para "${produtoDB.nome}". Disponível: ${produtoDB.quantidade_em_estoque}, Solicitado: ${item.quantidade}.`);
            }
        }

        let valor_total_venda = 0;
        const produtosParaSalvar = [];
        for (const item of produtos) {
            const produtoResult = await client.query('SELECT nome, price, unidade_medida FROM produtos WHERE id = $1', [item.produto_id]);
            const produtoDB = produtoResult.rows[0];
            const valor_unitario = (item.preco_manual !== undefined && item.preco_manual !== null) ? parseFloat(item.preco_manual) : parseFloat(produtoDB.price);
            const valor_item = item.quantidade * valor_unitario;
            valor_total_venda += valor_item;

            produtosParaSalvar.push({
                produto_id: item.produto_id, nome: produtoDB.nome, unidade_medida: produtoDB.unidade_medida,
                quantidade: item.quantidade, valor_unitario: valor_unitario, valor_total_item: valor_item,
            });
            await client.query('UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque - $1 WHERE id = $2', [item.quantidade, item.produto_id]);
        }

        const data_pagamento_final = opcao_pagamento === 'À VISTA' ? data_venda : null;
        const data_vencimento_final = opcao_pagamento === 'À VISTA' ? data_venda : data_vencimento;

        const result = await client.query(
            `UPDATE movimentacoes 
             SET cliente_id = $1, produtos = $2, data_venda = $3, opcao_pagamento = $4, data_vencimento = $5, valor_total = $6, data_pagamento = $7
             WHERE id = $8 RETURNING *`,
            [cliente_id, JSON.stringify(produtosParaSalvar), data_venda, opcao_pagamento, data_vencimento_final, valor_total_venda, data_pagamento_final, id]
        );

        await client.query('COMMIT');
        res.status(200).json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar venda:', error);
        res.status(400).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Deletar uma VENDA (ENTRADA)
 * @route   DELETE /api/movimentacoes/vendas/:id
 * @access  Privado (qualquer usuário logado)
 */
const deleteVenda = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const vendaResult = await client.query('SELECT produtos FROM movimentacoes WHERE id = $1 AND tipo = \'ENTRADA\'', [id]);
        if (vendaResult.rows.length === 0) {
            throw new Error('Venda não encontrada.');
        }
        const produtos = vendaResult.rows[0].produtos;

        for (const item of produtos) {
            await client.query('UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque + $1 WHERE id = $2', [item.quantidade, item.produto_id]);
        }

        await client.query('DELETE FROM movimentacoes WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.status(204).send();

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar venda:', error);
        res.status(400).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Gerar um comprovante em PDF para uma venda específica
 * @route   GET /api/movimentacoes/vendas/:id/pdf
 * @access  Privado (qualquer usuário logado)
 */
const getVendaPDF = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT 
                m.id, m.data_venda, m.valor_total, m.opcao_pagamento, m.data_vencimento, m.data_pagamento, m.produtos,
                c.nome AS cliente_nome, c.telefone AS cliente_telefone, c.endereco AS cliente_endereco,
                u.nome AS usuario_nome
            FROM movimentacoes m
            LEFT JOIN clientes c ON m.cliente_id = c.id
            LEFT JOIN utilizadores u ON m.utilizador_id = u.id
            WHERE m.id = $1 AND m.tipo = 'ENTRADA'
        `;
        const vendaResult = await pool.query(query, [id]);

        if (vendaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Venda não encontrada.' });
        }
        const venda = vendaResult.rows[0];

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=comprovante_venda_${id}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text('Comprovante de Venda', { align: 'center' });
        doc.fontSize(12).text('Caipirão 3.0', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(14).text(`Venda #${venda.id}`, { continued: true });
        doc.fontSize(12).text(`Data: ${new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, { align: 'right' });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold').text('Cliente:');
        doc.font('Helvetica').text(venda.cliente_nome || 'Não informado');
        doc.text(`Telefone: ${venda.cliente_telefone || 'Não informado'}`);
        doc.text(`Endereço: ${venda.cliente_endereco || 'Não informado'}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('Produtos');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 300;
        const priceX = 380;
        const totalX = 460;

        doc.fontSize(10).text('Item', itemX, tableTop);
        doc.text('Qtd/Peso', qtyX, tableTop, { width: 80, align: 'right' });
        doc.text('Preço Unit.', priceX, tableTop, { width: 80, align: 'right' });
        doc.text('Total Item', totalX, tableTop, { width: 80, align: 'right' });
        doc.moveDown();

        const drawLine = (y) => doc.moveTo(50, y).lineTo(550, y).stroke();
        drawLine(doc.y);
        doc.moveDown(0.5);

        venda.produtos.forEach(item => {
            const y = doc.y;
            doc.fontSize(10).font('Helvetica').text(item.nome, itemX, y, { width: 240 });
            doc.text(`${item.quantidade.toFixed(2)} ${item.unidade_medida}`, qtyX, y, { width: 80, align: 'right' });
            doc.text(item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), priceX, y, { width: 80, align: 'right' });
            doc.text(item.valor_total_item.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), totalX, y, { width: 80, align: 'right' });
            doc.moveDown();
        });

        drawLine(doc.y);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Total Geral:', 380, doc.y, { align: 'right', width: 80 });
        doc.text(venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 460, doc.y - 16, { align: 'right', width: 80 });
        doc.moveDown(2);

        doc.fontSize(12).font('Helvetica-Bold').text('Pagamento:');
        doc.font('Helvetica').text(`Forma: ${venda.opcao_pagamento}`);
        if (venda.opcao_pagamento === 'A PRAZO') {
            doc.text(`Vencimento: ${new Date(venda.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`);
        }
        doc.text(`Status: ${venda.data_pagamento ? `Pago em ${new Date(venda.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : 'Pendente'}`);
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Oblique').text(`Vendedor: ${venda.usuario_nome}`, 50, 750, { align: 'left' });
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 750, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error('Erro ao gerar PDF da venda:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar o PDF.' });
    }
};


module.exports = {
  createVenda,
  getVendas,
  getContasAReceber,
  registrarPagamento,
  updateVenda,
  deleteVenda,
  getVendaPDF,
};
