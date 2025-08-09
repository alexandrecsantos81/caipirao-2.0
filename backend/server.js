const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importação das rotas
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const produtoRoutes = require('./routes/produtos');
const movimentacaoRoutes = require('./routes/movimentacoes');
const reportRoutes = require('./routes/reports');
const utilizadorRoutes = require('./routes/utilizadores');
const fornecedorRoutes = require('./routes/fornecedorRoutes'); // <-- CORREÇÃO AQUI
const despesaRoutes = require('./routes/despesaRoutes');       // <-- CORREÇÃO AQUI

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas Públicas
app.get('/', (req, res) => {
  res.send('API Caipirão 3.0 no ar!');
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/utilizadores', utilizadorRoutes);
app.use('/api/fornecedores', fornecedorRoutes); // <--- NOVO
app.use('/api/despesas', despesaRoutes);       // <--- NOVO
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/movimentacoes', movimentacaoRoutes);
app.use('/api/reports', reportRoutes);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
