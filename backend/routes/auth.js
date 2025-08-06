// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- ROTA DE REGISTRO DE NOVO USUÁRIO ---
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, perfil = 'USER' } = req.body;

    // 1. Verificar se o usuário já existe
    const userExists = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }

    // 2. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    // CORREÇÃO: O resultado da criptografia será inserido na coluna 'senha'.
    const senhaCriptografada = await bcrypt.hash(senha, salt);

    // 3. Inserir o novo usuário no banco de dados
    // CORREÇÃO: Usando a coluna 'senha' em vez de 'senha_hash'.
    const newUser = await pool.query(
      'INSERT INTO utilizadores (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil',
      [nome, email, senhaCriptografada, perfil]
    );

    res.status(201).json(newUser.rows[0]);

  } catch (err) {
    console.error("Erro no registro:", err.message);
    res.status(500).send('Erro no servidor');
  }
});


// --- ROTA DE LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // 1. Verificar se o email e a senha foram fornecidos
    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    // 2. Encontrar o usuário no banco de dados pelo email
    const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' }); // Usar msg genérica por segurança
    }

    const user = result.rows[0];

    // 3. Comparar a senha fornecida com a senha criptografada do banco
    // CORREÇÃO: Acessando a propriedade 'user.senha' em vez de 'user.senha_hash'.
    // Esta era a linha que causava o erro "Illegal arguments: string, undefined".
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 4. Se a senha for válida, gerar o token JWT
    const payload = {
      id: user.id,
      nome: user.nome,
      perfil: user.perfil,
    };

    // Use uma chave secreta forte e guarde-a em variáveis de ambiente (.env) em um projeto real
    const token = jwt.sign(payload, 'seuSuperSegredoJWT', { expiresIn: '8h' });

    res.json({ token });

  } catch (err) {
    // Adicionamos um log de erro mais específico aqui
    console.error("Erro no login:", err);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;
