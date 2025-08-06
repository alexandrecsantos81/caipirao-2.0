// Importação dos módulos necessários
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Nosso módulo de conexão com o banco

// Inicialização da aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Habilita o CORS para permitir requisições do frontend
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---

// Rota para registrar um novo usuário
app.post('/auth/register', async (req, res) => {
    const { nome, email, senha, perfil = 'USER' } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        // Criptografa a senha antes de salvar no banco
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const newUser = await db.query(
            'INSERT INTO utilizadores (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil',
            [nome, email, senha_hash, perfil.toUpperCase()]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error('Erro no registro:', error);
        // Verifica se o erro é de violação de chave única (email duplicado)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
    }
});

// Rota para login de usuário
app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const result = await db.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Usuário não encontrado
        }

        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Senha incorreta
        }

        // Gera o token JWT
        const token = jwt.sign(
            { userId: user.id, perfil: user.perfil },
            process.env.JWT_SECRET || 'seu_segredo_jwt_padrao', // Use uma variável de ambiente para o segredo!
            { expiresIn: '1h' } // Token expira em 1 hora
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


// Rota de Teste
app.get('/', (req, res) => {
  res.send('API Caipirão 2.0 está no ar!');
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
