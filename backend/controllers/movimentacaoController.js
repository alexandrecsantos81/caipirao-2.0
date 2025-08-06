// backend/controllers/movimentacaoController.js

const pool = require('../db');

// Função para registrar uma nova VENDA (ENTRADA)
const createVenda = async (req, res) => {
  const { cliente_id, produtos } = req.body; // produtos é um array de { produto_id, quantidade, preco_unitario }
  const usuario_id = req.user.id; // ID do usuário logado (vendedor)

  if (!cliente_id || !produtos || !Array.isArray(produtos) || produtos.length === 0) {
    return res.status(400).json({ error: 'Dados da venda inválidos.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let valor_total_venda = 0;
    for (const item of produtos) {
        valor_total_venda += item.quantidade * item.preco_unitario;
    }

    // 1. Inserir a movimentação principal (a venda)
    const movimentacaoResult = await client.query(
      `INSERT INTO movimentacoes (tipo, valor_total, cliente_id, usuario_id)
       VALUES ('ENTRADA', $1, $2, $3)
       RETURNING id`,
      [valor_total_venda, cliente_id, usuario_id]
    );
    const movimentacao_id = movimentacaoResult.rows[0].id;

    // 2. Inserir os itens da movimentação
    const itemQueries = produtos.map(item => {
      return client.query(
        `INSERT INTO itens_movimentacao (movimentacao_id, produto_id, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [movimentacao_id, item.produto_id, item.quantidade, item.preco_unitario]
      );
    });

    await Promise.all(itemQueries);

    await client.query('COMMIT');
    res.status(201).json({ id: movimentacao_id, message: 'Venda registrada com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// Função para listar todas as VENDAS (ENTRADAS)
const getVendas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.id, 
                m.data_movimentacao, 
                m.valor_total, 
                c.nome AS cliente_nome, 
                u.nome AS usuario_nome
            FROM movimentacoes m
            JOIN clientes c ON m.cliente_id = c.id
            JOIN utilizadores u ON m.usuario_id = u.id
            WHERE m.tipo = 'ENTRADA'
            ORDER BY m.data_movimentacao DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- NOVAS FUNÇÕES PARA DESPESAS ---

/**
 * @description Registra uma nova despesa (movimentação do tipo 'SAÍDA').
 * Acesso restrito a ADMIN.
 */
const createDespesa = async (req, res) => {
    const { descricao, valor_total } = req.body;
    const usuario_id = req.user.id; // ID do admin que está registrando

    if (!descricao || !valor_total || valor_total <= 0) {
        return res.status(400).json({ error: 'Descrição e valor total são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO movimentacoes (tipo, descricao, valor_total, usuario_id)
             VALUES ('SAIDA', $1, $2, $3)
             RETURNING id, tipo, descricao, valor_total, data_movimentacao`,
            [descricao, valor_total, usuario_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao registrar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

/**
 * @description Lista todas as despesas (movimentações do tipo 'SAÍDA').
 */
const getDespesas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.id,
                m.descricao,
                m.valor_total,
                m.data_movimentacao,
                u.nome as usuario_nome
            FROM movimentacoes m
            JOIN utilizadores u ON m.usuario_id = u.id
            WHERE m.tipo = 'SAIDA'
            ORDER BY m.data_movimentacao DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};


module.exports = {
  createVenda,
  getVendas,
  createDespesa, // Exportando a nova função
  getDespesas    // Exportando a nova função
};
