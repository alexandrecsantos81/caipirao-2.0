const pool = require('../db');

/**
 * @desc    Obter todos os produtos com paginação
 * @route   GET /api/produtos
 * @access  Privado
 */
const getProdutos = async (req, res) => {
    const pagina = parseInt(req.query.pagina, 10) || 1;
    const limite = parseInt(req.query.limite, 10) || 10;
    const offset = (pagina - 1) * limite;

    try {
        const totalResult = await pool.query('SELECT COUNT(*) FROM produtos');
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        const produtosResult = await pool.query(
            'SELECT * FROM produtos ORDER BY nome ASC LIMIT $1 OFFSET $2',
            [limite, offset]
        );

        res.json({
            dados: produtosResult.rows,
            totalPaginas,
            paginaAtual: pagina,
        });
    } catch (err) {
        console.error(err.message);
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

    if (!nome || price === undefined || price === null || !unidade_medida) {
      return res.status(400).json({ msg: 'Nome, preço e unidade de medida são obrigatórios.' });
    }

    const precoNumerico = parseFloat(price);

    if (isNaN(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ msg: 'O preço fornecido é inválido.' });
    }

    const novoProduto = await pool.query(
      'INSERT INTO produtos (nome, unidade_medida, price) VALUES ($1, $2, $3) RETURNING *',
      [nome, unidade_medida, precoNumerico]
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

    if (!nome || price === undefined || price === null || !unidade_medida) {
      return res.status(400).json({ msg: 'Nome, preço e unidade de medida são obrigatórios.' });
    }

    const precoNumerico = parseFloat(price);

    if (isNaN(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ msg: 'O preço fornecido é inválido.' });
    }

    const produtoAtualizado = await pool.query(
      'UPDATE produtos SET nome = $1, unidade_medida = $2, price = $3 WHERE id = $4 RETURNING *',
      [nome, unidade_medida, precoNumerico, id]
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
  const { quantidade_adicionada, custo_total, observacao } = req.body;
  const utilizador_id = req.user.id; // Pega o ID do usuário logado

  if (!quantidade_adicionada || quantidade_adicionada <= 0 || custo_total === undefined || custo_total < 0) {
    return res.status(400).json({ error: 'Quantidade adicionada e custo total são obrigatórios e devem ser valores positivos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Atualiza a quantidade em estoque do produto
    const produtoAtualizado = await client.query(
      'UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque + $1 WHERE id = $2 RETURNING *',
      [quantidade_adicionada, produto_id]
    );

    if (produtoAtualizado.rowCount === 0) {
      throw new Error('Produto não encontrado.');
    }

    // 2. Insere o registro na nova tabela de histórico de entradas
    await client.query(
      `INSERT INTO entradas_estoque (produto_id, utilizador_id, quantidade_adicionada, custo_total, observacao)
       VALUES ($1, $2, $3, $4, $5)`,
      [produto_id, utilizador_id, quantidade_adicionada, custo_total, observacao]
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
