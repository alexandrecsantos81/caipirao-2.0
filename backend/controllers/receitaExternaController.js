const pool = require('../db');

const getReceitasExternas = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        let query = 'SELECT * FROM receitas_externas';
        const params = [];
        if (startDate && endDate) {
            query += ' WHERE data_recebimento BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }
        query += ' ORDER BY data_recebimento DESC';
        
        const resultado = await pool.query(query, params);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar receitas externas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const createReceitaExterna = async (req, res) => {
    const { descricao, valor, data_recebimento, categoria } = req.body;
    const utilizador_id = req.user.id; // ID do admin logado

    if (!descricao || !valor || !data_recebimento) {
        return res.status(400).json({ error: 'Descrição, valor e data são obrigatórios.' });
    }

    try {
        const novaReceita = await pool.query(
            `INSERT INTO receitas_externas (descricao, valor, data_recebimento, categoria, utilizador_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [descricao.toUpperCase(), valor, data_recebimento, categoria ? categoria.toUpperCase() : null, utilizador_id]
        );
        res.status(201).json(novaReceita.rows[0]);
    } catch (error) {
        console.error('Erro ao criar receita externa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const updateReceitaExterna = async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, data_recebimento, categoria } = req.body;

    if (!descricao || !valor || !data_recebimento) {
        return res.status(400).json({ error: 'Descrição, valor e data são obrigatórios.' });
    }

    try {
        const receitaAtualizada = await pool.query(
            `UPDATE receitas_externas
             SET descricao = $1, valor = $2, data_recebimento = $3, categoria = $4
             WHERE id = $5 RETURNING *`,
            [descricao.toUpperCase(), valor, data_recebimento, categoria ? categoria.toUpperCase() : null, id]
        );

        if (receitaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: 'Receita não encontrada.' });
        }

        res.status(200).json(receitaAtualizada.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar receita externa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const deleteReceitaExterna = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM receitas_externas WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Receita não encontrada.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error('Erro ao deletar receita externa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getReceitasExternas,
    createReceitaExterna,
    updateReceitaExterna,
    deleteReceitaExterna,
};
