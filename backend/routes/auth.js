// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Importa a conexão com o banco
const router = express.Router(); // Cria um roteador do Express

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota para registrar um novo usuário: POST /api/auth/register
router.post('/register', async (req, res) => {
    const { nome, email, senha, perfil = 'USER' } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const newUser = await db.query(
            'INSERT INTO utilizadores (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil',
            [nome, email, senha_hash, perfil.toUpperCase()]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error('Erro no registro:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
    }
});

// Rota para login de usuário: POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const result = await db.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id, perfil: user.perfil },
            process.env.JWT_SECRET || 'seu_segredo_jwt_padrao',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router; // Exporta o roteador para ser usado no server.js
