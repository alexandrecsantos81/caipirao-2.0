// backend/server.js

// --- Importações dos Módulos ---
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

// --- Importações Locais (Nossos Módulos) ---
const { verifyToken } = require('./middleware/authMiddleware'); // Nosso middleware de segurança
const authRoutes = require('./routes/auth'); // Nossas rotas de autenticação
const clientesRoutes = require('./routes/clientes'); // Nossas rotas de clientes

// --- Inicialização da Aplicação ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares Globais ---
app.use(cors()); // Habilita CORS para todas as rotas
app.use(express.json()); // Habilita o parsing de JSON

// --- Definição das Rotas ---
// Rota de Teste
app.get('/', (req, res) => {
  res.send('API Caipirão 2.0 está no ar!');
});

// Rotas de Autenticação (Públicas)
// O prefixo /api/auth será adicionado a todas as rotas de auth.js
// Ex: /register vira /api/auth/register
app.use('/api/auth', authRoutes);

// Rotas de Clientes (Protegidas)
// O prefixo /api/clientes será adicionado e a rota será protegida pelo verifyToken
app.use('/api/clientes', verifyToken, clientesRoutes);


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor "Caipirão 2.0" rodando na porta ${PORT}`);
});
