// backend/controllers/produtoController.js

const pool = require('../db');

/**
 * @desc    Obter todos os produtos com paginação e filtro de busca
 * @route   GET /api/produtos
 * @access  Privado
 */
const getProdutos = async (req, res) => {
    const { pagina = 1, limite = 50, termoBusca } = req.query; // ✅ Captura o termoBusca
    const offset = (pagina - 1) * limite;

    // ✅ Construção da query dinâmica
    let queryBase = 'FROM produtos';
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (termoBusca) {
        // Filtra pelo nome do produto, ignorando maiúsculas/minúsculas
        whereClause = `WHERE nome ILIKE $${paramIndex}`;
        params.push(`%${termoBusca}%`);
        paramIndex++;
    }

    try {
        // Query para contagem total, agora considerando o filtro
        const totalQuery = `SELECT COUNT(*) ${queryBase} ${whereClause}`;
        const totalResult = await pool.query(totalQuery, termoBusca ? [params[0]] : []);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        // Adiciona os parâmetros de paginação ao final do array de parâmetros
        params.push(limite, offset);

        // Query para buscar os dados com filtro e paginação
        const produtosQuery = `
            SELECT *
            ${queryBase}
            ${whereClause}
            ORDER BY data_criacao DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const produtosResult = await pool.query(produtosQuery, params);

        res.json({
            dados: produtosResult.rows,
            total: totalItens,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas: totalPaginas,
        });
    } catch (err) {
        console.error('Erro ao buscar produtos:', err.message);
        res.status(500).send('Erro no servidor');
    }
};


/**
 * @desc    Criar um novo produto
 * @route   POST /api/produtos
 * @access  Restrito (Admin)
 */
const createProduto = async (req, res) => {
  try {
    const { nome, unidade_medida, price } = req.body;

    if (!nome || nome.trim() === '' || price === undefined || price === null || !unidade_medida || unidade_medida.trim() === '') {
      return res.status(400).json({ msg: 'Nome, preço e unidade de medida são obrigatórios.' });
    }

    const precoNumerico = parseFloat(price);

    if (isNaN(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ msg: 'O preço fornecido é inválido.' });
    }

    const novoProduto = await pool.query(
      'INSERT INTO produtos (nome, unidade_medida, price) VALUES ($1, $2, $3) RETURNING *',
      [nome.trim().toUpperCase(), unidade_medida.trim().toUpperCase(), precoNumerico]
    );

    res.status(201).json(novoProduto.rows[0]);
  } catch (err) {
    console.error("Erro em createProduto:", err.message);
    res.status(500).send('Erro no servidor');
  }
};

/**
 * @desc    Atualizar um produto
 * @route   PUT /api/produtos/:id
 * @access  Restrito (Admin)
 */
const updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, unidade_medida, price } = req.body;

    if (!nome || nome.trim() === '' || price === undefined || price === null || !unidade_medida || unidade_medida.trim() === '') {
      return res.status(400).json({ msg: 'Nome, preço e unidade de medida são obrigatórios.' });
    }

    const precoNumerico = parseFloat(price);

    if (isNaN(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ msg: 'O preço fornecido é inválido.' });
    }

    const produtoAtualizado = await pool.query(
      'UPDATE produtos SET nome = $1, unidade_medida = $2, price = $3 WHERE id = $4 RETURNING *',
      [nome.trim().toUpperCase(), unidade_medida.trim().toUpperCase(), precoNumerico, id]
    );

    if (produtoAtualizado.rows.length === 0) {
      return res.status(404).json({ msg: 'Produto não encontrado.' });
    }

    res.json(produtoAtualizado.rows[0]);
  } catch (err) {
    console.error("Erro em updateProduto:", err.message);
    res.status(500).send('Erro no servidor');
  }
};

/**
 * @desc    Deletar um produto
 * @route   DELETE /api/produtos/:id
 * @access  Restrito (Admin)
 */
const deleteProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteRes = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);

    if (deleteRes.rowCount === 0) {
        return res.status(404).json({ msg: 'Produto não encontrado.' });
    }

    res.json({ msg: 'Produto deletado com sucesso.' });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23503') {
        return res.status(400).json({ msg: 'Não é possível deletar o produto, pois ele já está associado a uma ou mais vendas.' });
    }
    res.status(500).send('Erro no servidor');
  }
};

/**
 * @desc    Registra uma entrada de estoque para um produto e atualiza sua quantidade.
 * @route   POST /api/produtos/:id/entradas-estoque
 * @access  Restrito (Admin)
 */
const registrarEntradaEstoque = async (req, res) => {
  const { id: produto_id } = req.params;
  const { quantidade_adicionada, custo_total, observacao, data_entrada } = req.body; // Adicionado data_entrada
  const utilizador_id = req.user.id;

  if (!quantidade_adicionada || quantidade_adicionada <= 0 || custo_total === undefined || custo_total < 0 || !data_entrada) {
    return res.status(400).json({ error: 'Data da entrada, quantidade adicionada e custo total são obrigatórios e devem ser valores positivos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const produtoAtualizado = await client.query(
      'UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque + $1 WHERE id = $2 RETURNING *',
      [quantidade_adicionada, produto_id]
    );

    if (produtoAtualizado.rowCount === 0) {
      throw new Error('Produto não encontrado.');
    }

    await client.query(
      `INSERT INTO entradas_estoque (produto_id, utilizador_id, quantidade_adicionada, custo_total, observacao, data_entrada)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [produto_id, utilizador_id, quantidade_adicionada, custo_total, observacao ? observacao.toUpperCase() : null, data_entrada]
    );

    await client.query('COMMIT');
    res.status(200).json(produtoAtualizado.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar entrada de estoque:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};

module.exports = {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  registrarEntradaEstoque,
};
