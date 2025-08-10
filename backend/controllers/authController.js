// backend/controllers/authController.js

const pool = require('../db.js'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { credencial, senha } = req.body;

    console.log('\n--- NOVA TENTATIVA DE LOGIN ---');
    console.log('Credencial recebida:', credencial);
    console.log('Senha recebida:', senha);

    if (!credencial || !senha) {
        return res.status(400).json({ error: 'Credencial e senha são obrigatórias.' });
    }

    try {
        const query = `
            SELECT id, nome, email, nickname, telefone, perfil, status, senha 
            FROM utilizadores 
            WHERE (email = $1 OR nickname = $1 OR telefone = $1) AND status = 'ATIVO'
        `;
        
        console.log('Executando query no banco...');
        const resultado = await pool.query(query, [credencial]);
        console.log('Resultado da query:', resultado.rows);

        if (resultado.rows.length === 0) {
            console.log('>>> MOTIVO DA FALHA: Nenhum utilizador encontrado com essa credencial e status ATIVO.');
            return res.status(401).json({ error: 'Credenciais inválidas ou utilizador inativo.' });
        }

        const utilizador = resultado.rows[0];
        console.log('Utilizador encontrado:', utilizador);
        console.log('Hash da senha no banco:', utilizador.senha);

        console.log('Comparando senhas com bcrypt.compare...');
        const senhaValida = await bcrypt.compare(senha, utilizador.senha);
        console.log('Resultado da comparação (senhaValida):', senhaValida);

        if (!senhaValida) {
            console.log('>>> MOTIVO DA FALHA: bcrypt.compare retornou false.');
            return res.status(401).json({ error: 'Credenciais inválidas ou utilizador inativo.' });
        }

        console.log('Login bem-sucedido! Gerando token...');
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
