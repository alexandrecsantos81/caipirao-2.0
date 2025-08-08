const db = require('../db');

// @desc    Criar um novo cliente
// @route   POST /api/clientes
const createCliente = async (req, res) => {
    const { nome, email, telefone, coordenada_x, coordenada_y, responsavel, endereco, tem_whatsapp } = req.body;

    if (!nome || !telefone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }

    try {
        const novoCliente = await db.query(
            `INSERT INTO clientes (nome, email, telefone, coordenada_x, coordenada_y, responsavel, endereco, tem_whatsapp) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [nome, email, telefone, coordenada_x, coordenada_y, responsavel, endereco, tem_whatsapp || false]
        );
        res.status(201).json(novoCliente.rows[0]);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Atualizar um cliente
// @route   PUT /api/clientes/:id
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, coordenada_x, coordenada_y, responsavel, endereco, tem_whatsapp } = req.body;

    if (!nome || !telefone) {
        return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }

    try {
        const clienteAtualizado = await db.query(
            `UPDATE clientes 
             SET nome = $1, email = $2, telefone = $3, coordenada_x = $4, coordenada_y = $5, responsavel = $6, endereco = $7, tem_whatsapp = $8
             WHERE id = $9 
             RETURNING *`,
            [nome, email, telefone, coordenada_x, coordenada_y, responsavel, endereco, tem_whatsapp || false, id]
        );
        if (clienteAtualizado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado para atualização.' });
        }
        res.status(200).json(clienteAtualizado.rows[0]);
    } catch (error) {
        console.error(`Erro ao atualizar cliente com ID ${id}:`, error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está em uso por outro cliente.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Obter todos os clientes com paginação e status de atividade
// @route   GET /api/clientes?pagina=1&limite=10
const getClientes = async (req, res) => {
    const pagina = parseInt(req.query.pagina, 10) || 1;
    const limite = parseInt(req.query.limite, 10) || 10;
    const offset = (pagina - 1) * limite;

    try {
                const clientesQuery = `
                    SELECT 
                        c.*,
                        CASE
                            WHEN MAX(m.data_movimentacao) >= NOW() - INTERVAL '3 months' THEN 'Ativo' -- CORREÇÃO AQUI
                            ELSE 'Inativo'
                        END AS status
                    FROM 
                clientes c
            LEFT JOIN 
                movimentacoes m ON c.id = m.cliente_id AND m.tipo = 'ENTRADA'
            GROUP BY 
                c.id
            ORDER BY 
                c.nome ASC
            LIMIT $1 OFFSET $2;
        `;
        const clientesResult = await db.query(clientesQuery, [limite, offset]);

        const totalResult = await db.query('SELECT COUNT(*) FROM clientes');
        const totalClientes = parseInt(totalResult.rows[0].count, 10);

        res.status(200).json({
            dados: clientesResult.rows,
            total: totalClientes,
            pagina: pagina,
            limite: limite,
            totalPaginas: Math.ceil(totalClientes / limite)
        });
    } catch (error) {
        console.error('Erro ao buscar clientes com status:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Obter um cliente específico pelo ID
// @route   GET /api/clientes/:id
const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const cliente = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
        if (cliente.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.status(200).json(cliente.rows[0]);
    } catch (error) {
        console.error(`Erro ao buscar cliente com ID ${id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Deletar um cliente
// @route   DELETE /api/clientes/:id
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado para exclusão.' });
        }
        res.status(200).json({ message: 'Cliente deletado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao deletar cliente com ID ${id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    createCliente,
    getClientes,
    getClienteById,
    updateCliente,
    deleteCliente,
};
