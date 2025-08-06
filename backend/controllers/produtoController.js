// backend/controllers/produtoController.js

const pool = require('../db'); // Corrigindo o caminho para o arquivo de configuração do DB

/**
 * @desc    Obter todos os produtos
 * @route   GET /api/produtos
 * @access  Privado
 */
const getProdutos = async (req, res) => {
  try {
    const todosProdutos = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
    res.json(todosProdutos.rows);
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
    const { nome, descricao, preco, estoque } = req.body;

    // Validação simples
    if (!nome || !preco) {
      return res.status(400).json({ msg: 'Nome e preço são obrigatórios.' });
    }

    const novoProduto = await pool.query(
      'INSERT INTO produtos (nome, descricao, preco, estoque) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, descricao, preco, estoque]
    );

    res.status(201).json(novoProduto.rows[0]);
  } catch (err) {
    console.error(err.message);
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
    const { nome, descricao, preco, estoque } = req.body;

    // Validação simples
    if (!nome || !preco) {
        return res.status(400).json({ msg: 'Nome e preço são obrigatórios.' });
    }

    const produtoAtualizado = await pool.query(
      'UPDATE produtos SET nome = $1, descricao = $2, preco = $3, estoque = $4 WHERE id = $5 RETURNING *',
      [nome, descricao, preco, estoque, id]
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
    // Adicionado para verificar violações de chave estrangeira (ex: produto em uma venda)
    if (err.code === '23503') {
        return res.status(400).json({ msg: 'Não é possível deletar o produto, pois ele já está associado a uma ou mais vendas.' });
    }
    res.status(500).send('Erro no servidor');
  }
};


module.exports = {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
};
