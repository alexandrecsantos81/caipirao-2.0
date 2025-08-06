// backend/controllers/movimentacaoController.js

const pool = require('../db');

// Listar todas as movimentações do tipo 'ENTRADA' (Vendas)
exports.listarMovimentacoes = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id, 
        m.tipo, 
        m.data, 
        m.valor_total, 
        c.nome AS cliente_nome, 
        u.nome AS usuario_nome,
        m.produtos
      FROM movimentacoes m
      JOIN clientes c ON m.cliente_id = c.id
      JOIN utilizadores u ON m.utilizador_id = u.id
      WHERE m.tipo = 'ENTRADA'
      ORDER BY m.data DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar movimentações.' });
  }
};

// Criar uma nova movimentação (Venda)
exports.criarMovimentacao = async (req, res) => {
  const { cliente_id, valor_total, produtos } = req.body;
  const utilizador_id = req.user.id; // ID do usuário logado, vindo do middleware verifyToken

  if (!cliente_id || !valor_total || !produtos || !Array.isArray(produtos)) {
    return res.status(400).json({ message: 'Campos obrigatórios: cliente_id, valor_total e um array de produtos.' });
  }

  try {
    const query = `
      INSERT INTO movimentacoes (tipo, cliente_id, utilizador_id, valor_total, produtos, data)
      VALUES ('ENTRADA', $1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    // Armazenamos o array de produtos como uma string JSON no banco de dados
    const { rows } = await pool.query(query, [cliente_id, utilizador_id, valor_total, JSON.stringify(produtos)]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar movimentação.' });
  }
};

// Buscar uma movimentação específica por ID
exports.buscarMovimentacaoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                m.id, 
                m.tipo, 
                m.data, 
                m.valor_total, 
                m.cliente_id,
                c.nome AS cliente_nome, 
                m.utilizador_id,
                u.nome AS usuario_nome,
                m.produtos
            FROM movimentacoes m
            JOIN clientes c ON m.cliente_id = c.id
            JOIN utilizadores u ON m.utilizador_id = u.id
            WHERE m.id = $1 AND m.tipo = 'ENTRADA';
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Movimentação não encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar movimentação por ID:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// Deletar uma movimentação
exports.deletarMovimentacao = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM movimentacoes WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Movimentação não encontrada.' });
    }
    res.status(200).json({ message: 'Movimentação deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar movimentação:', error);
    res.status(500).json({ message: 'Erro no servidor ao deletar movimentação.' });
  }
};
