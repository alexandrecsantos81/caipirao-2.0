const pool = require('../db');

// @desc    Registrar uma nova VENDA (ENTRADA)
const createVenda = async (req, res) => {
  const { cliente_id, produtos } = req.body;
  const usuario_id = req.user.id;

  if (!cliente_id || !produtos || !Array.isArray(produtos) || produtos.length === 0) {
    return res.status(400).json({ error: 'Dados da venda inválidos. Cliente e produtos são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validação de estoque antes de qualquer inserção
    for (const item of produtos) {
      const produtoResult = await client.query('SELECT nome, quantidade_em_estoque FROM produtos WHERE id = $1', [item.produto_id]);
      if (produtoResult.rows.length === 0) {
        throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      }
      const produto = produtoResult.rows[0];
      // Convertendo para Number para garantir a comparação correta
      if (Number(produto.quantidade_em_estoque) < Number(item.quantidade)) {
        throw new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.quantidade_em_estoque}, Solicitado: ${item.quantidade}.`);
      }
    }

    // Calcula o valor total da venda
    const valor_total_venda = produtos.reduce((total, item) => {
      return total + (item.quantidade * item.valor_unitario);
    }, 0);

    // Insere a movimentação principal
    const movimentacaoResult = await client.query(
      `INSERT INTO movimentacoes (tipo, valor_total, cliente_id, usuario_id, produtos)
       VALUES ('ENTRADA', $1, $2, $3, $4)
       RETURNING id`,
      [valor_total_venda, cliente_id, usuario_id, JSON.stringify(produtos)]
    );
    const movimentacao_id = movimentacaoResult.rows[0].id;

    // Atualiza o estoque de cada produto
    for (const item of produtos) {
      await client.query(
        'UPDATE produtos SET quantidade_em_estoque = quantidade_em_estoque - $1 WHERE id = $2',
        [item.quantidade, item.produto_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: movimentacao_id, message: 'Venda registrada com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', error);
    // Retorna a mensagem de erro específica (ex: estoque insuficiente) para o frontend
    res.status(400).json({ error: error.message || 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// As outras funções (getVendas, createDespesa, getDespesas) não precisam de alteração neste momento.
// ... (cole o restante do seu arquivo aqui)
const getVendas = async (req, res) => {
    const pagina = parseInt(req.query.pagina, 10) || 1;
    const limite = parseInt(req.query.limite, 10) || 10;
    const offset = (pagina - 1) * limite;

    try {
        const query = `
            SELECT 
                m.id, 
                m.data_movimentacao, -- JÁ ESTAVA CORRETO AQUI
                m.valor_total, 
                c.nome AS cliente_nome, 
                u.nome AS usuario_nome,
                m.produtos
            FROM movimentacoes m
            LEFT JOIN clientes c ON m.cliente_id = c.id
            LEFT JOIN utilizadores u ON m.utilizador_id = u.id
            WHERE m.tipo = 'ENTRADA'
            ORDER BY m.data_movimentacao DESC -- CORREÇÃO AQUI
            LIMIT $1 OFFSET $2;
        `;
        const vendasResult = await pool.query(query, [limite, offset]);
        
        const totalResult = await pool.query("SELECT COUNT(*) FROM movimentacoes WHERE tipo = 'ENTRADA'");
        const totalVendas = parseInt(totalResult.rows[0].count, 10);

        res.status(200).json({
            dados: vendasResult.rows,
            total: totalVendas,
            pagina: pagina,
            limite: limite,
            totalPaginas: Math.ceil(totalVendas / limite)
        });
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

const createDespesa = async (req, res) => {
    const { descricao, valor_total } = req.body;
    const usuario_id = req.user.id;

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

const getDespesas = async (req, res) => {
    const pagina = parseInt(req.query.pagina, 10) || 1;
    const limite = parseInt(req.query.limite, 10) || 10;
    const offset = (pagina - 1) * limite;

    try {
        const query = `
            SELECT 
                m.id,
                m.descricao,
                m.valor_total,
                m.data_movimentacao, -- JÁ ESTAVA CORRETO AQUI
                u.nome as usuario_nome
            FROM movimentacoes m
            LEFT JOIN utilizadores u ON m.utilizador_id = u.id
            WHERE m.tipo = 'SAIDA'
            ORDER BY m.data_movimentacao DESC -- CORREÇÃO AQUI
            LIMIT $1 OFFSET $2;
        `;
        const despesasResult = await pool.query(query, [limite, offset]);

        const totalResult = await pool.query("SELECT COUNT(*) FROM movimentacoes WHERE tipo = 'SAIDA'");
        const totalDespesas = parseInt(totalResult.rows[0].count, 10);

        res.status(200).json({
            dados: despesasResult.rows,
            total: totalDespesas,
            pagina: pagina,
            limite: limite,
            totalPaginas: Math.ceil(totalDespesas / limite)
        });
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};


module.exports = {
  createVenda,
  getVendas,
  createDespesa,
  getDespesas
};
