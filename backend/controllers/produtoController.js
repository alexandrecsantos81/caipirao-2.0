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
    // CORREÇÃO: Extrair 'price' em vez de 'preco'
    const { nome, unidade_medida, price } = req.body;

    // CORREÇÃO: Validar a variável 'price'
    if (!nome || price === undefined || price === null || !unidade_medida) {
      return res.status(400).json({ msg: 'Nome, preço e unidade de medida são obrigatórios.' });
    }

    // A variável já é um número, mas parseFloat não prejudica.
    const precoNumerico = parseFloat(price);

    if (isNaN(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ msg: 'O preço fornecido é inválido.' });
    }

    // CORREÇÃO: Usar a coluna 'price' do banco de dados
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
    // CORREÇÃO: Extrair 'price' em vez de 'preco'
    const { nome, unidade_medida, price } = req.body;

    // CORREÇÃO: Validar a variável 'price'
    if (!nome || price === undefined || price === null || !unidade_medida) {
      return res.status(400).json({ msg: 'Nome, preço e unidade de medida são obrigatórios.' });
    }

    const precoNumerico = parseFloat(price);

    if (isNaN(precoNumerico) || precoNumerico < 0) {
      return res.status(400).json({ msg: 'O preço fornecido é inválido.' });
    }

    // CORREÇÃO: Usar a coluna 'price' do banco de dados
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
 * @desc    Adiciona uma quantidade ao estoque de um produto existente.
 * @route   POST /api/produtos/:id/adicionar-estoque
 * @access  Restrito (Admin)
 */
const addEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade } = req.body;

    if (typeof quantidade !== 'number') {
      return res.status(400).json({ msg: 'A quantidade deve ser um número.' });
    }

    const produtoAtualizado = await pool.query(
      'UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque + $1 WHERE id = $2 RETURNING *',
      [quantidade, id]
    );

    if (produtoAtualizado.rows.length === 0) {
      return res.status(404).json({ msg: 'Produto não encontrado.' });
    }

    res.json(produtoAtualizado.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};


module.exports = {
  getProdutos,
  createProduto, // <- Corrigida
  updateProduto, // <- Corrigida
  deleteProduto,
  addEstoque,
};
