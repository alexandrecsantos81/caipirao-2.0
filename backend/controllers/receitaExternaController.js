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

// ... (o resto das funções: create, update, delete)
const createReceitaExterna = async (req, res) => { /* ...código original... */ };
const updateReceitaExterna = async (req, res) => { /* ...código original... */ };
const deleteReceitaExterna = async (req, res) => { /* ...código original... */ };

module.exports = {
    getReceitasExternas,
    createReceitaExterna,
    updateReceitaExterna,
    deleteReceitaExterna,
};
