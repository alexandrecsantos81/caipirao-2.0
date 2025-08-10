const pool = require('../db.js'); // Garanta que o caminho está correto
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { credencial, senha } = req.body;

    if (!credencial || !senha) {
        return res.status(400).json({ error: 'Credencial e senha são obrigatórias.' });
    }

    try {
        const query = `
            SELECT id, nome, email, nickname, telefone, perfil, status, senha 
            FROM utilizadores 
            WHERE (email = $1 OR nickname = $1 OR telefone = $1) AND status = 'ATIVO'
        `;
        
        const resultado = await pool.query(query, [credencial]);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas ou utilizador inativo.' });
        }

        const utilizador = resultado.rows[0];

        // --- VERIFICAÇÃO DE SEGURANÇA ADICIONADA ---
        // Se não houver senha no banco para este usuário, é uma falha de autenticação.
        if (!utilizador.senha) {
            console.error(`Tentativa de login para o usuário ${utilizador.email} sem senha cadastrada.`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        // -----------------------------------------

        const senhaValida = await bcrypt.compare(senha, utilizador.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: utilizador.id, nome: utilizador.nome, perfil: utilizador.perfil },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });

    } catch (error) {
        console.error('>>> ERRO CRÍTICO DURANTE O LOGIN:', error);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
};

module.exports = {
    loginUser,
};
