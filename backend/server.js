// backend/src/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importação das rotas
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const produtoRoutes = require('./routes/produtos');
const movimentacaoRoutes = require('./routes/movimentacoes');
const utilizadorRoutes = require('./routes/utilizadores');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const despesaRoutes = require('./routes/despesaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reports');

const app = express();
const port = process.env.PORT || 3001;

// --- INÍCIO DA CORREÇÃO DE CORS ---

// Lista de origens permitidas. Adicione outras se necessário (ex: http://localhost:5173 para dev )
const allowedOrigins = [
  'https://syscaipirao.netlify.app',
  'http://localhost:5173' // Adicione a URL de desenvolvimento local
];

const corsOptions = {
  origin: (origin, callback ) => {
    // Permite requisições sem 'origin' (como apps mobile ou Postman) ou se a origem estiver na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Permite todos os métodos HTTP comuns
  credentials: true, // Permite o envio de cookies/credenciais
  optionsSuccessStatus: 204 // Necessário para algumas versões de navegadores
};

// Middleware
app.use(cors(corsOptions)); // <-- APLICA A NOVA CONFIGURAÇÃO DE CORS
app.use(express.json());

// --- FIM DA CORREÇÃO DE CORS ---


// Rotas Públicas
app.get('/', (req, res) => {
  res.send('API Caipirão 3.0 no ar!');
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/utilizadores', utilizadorRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/despesas', despesaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/movimentacoes', movimentacaoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
