// backend/controllers/authController.js

const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Público
const registerUser = async (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        // Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        // CORREÇÃO: Garante que a query INSERT use os nomes de coluna corretos
        // da tabela 'utilizadores' (nome, email, senha, perfil).
        const novoUsuario = await db.query(
            `INSERT INTO utilizadores (nome, email, senha, perfil) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nome, email, perfil`,
            [nome, email, senhaCriptografada, perfil || 'USER']

        );

        res.status(201).json(novoUsuario.rows[0]);

    } catch (error) {
        // Este console.log é crucial para depuração
        console.error('ERRO DETALHADO AO REGISTRAR:', error); 

        if (error.code === '23505') { // Código para violação de chave única (email duplicado)
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }
        
        // Mensagem de erro genérica que você recebeu
        res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
    }
};

// @desc    Autenticar um usuário (Login)
// @route   POST /api/auth/login
// @access  Público
const loginUser = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const resultado = await db.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        const usuario = resultado.rows[0];

        if (usuario && (await bcrypt.compare(senha, usuario.senha))) {
            // Senha correta, gerar token JWT
            const token = jwt.sign(
                { userId: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
                process.env.JWT_SECRET,
                { expiresIn: '1d' } // Token expira em 1 dia
            );

            res.json({ token });
        } else {
            // Usuário não encontrado ou senha incorreta
            res.status(401).json({ error: 'Credenciais inválidas.' });
        }
    } catch (error) {
        console.error('ERRO DETALHADO NO LOGIN:', error);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
