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
const receitaExternaRoutes = require('./routes/receitaExternaRoutes');
const financasRoutes = require('./routes/financasRoutes');
// >>> IMPORTAÇÃO DA NOVA ROTA <<<
const despesaPessoalRoutes = require('./routes/despesaPessoalRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Configuração de CORS
const allowedOrigins = [
  'https://syscaipirao.netlify.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: (origin, callback ) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Rota Pública de Teste
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
app.use('/api/receitas-externas', receitaExternaRoutes);
app.use('/api/financas', financasRoutes);
// >>> REGISTRO DA NOVA ROTA <<<
app.use('/api/despesas-pessoais', despesaPessoalRoutes);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
