// backend/server.js

const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Importa a configuração do banco de dados

// Importação das rotas
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const produtosRoutes = require('./routes/produtos');
const movimentacoesRoutes = require('./routes/movimentacoes'); // <-- NOVA ROTA

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Habilita o CORS para todas as origens
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// Rota de teste da API
app.get('/', (req, res) => {
  res.send('API do Caipirão 3.0 está no ar!');
});

// Registro das rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/movimentacoes', movimentacoesRoutes); // <-- REGISTRO DA NOVA ROTA

// Middleware para tratamento de erros (exemplo simples)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado no servidor!');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Testa a conexão com o banco de dados ao iniciar
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Erro ao conectar com o PostgreSQL', err);
    } else {
      console.log('Conexão com o PostgreSQL bem-sucedida:', res.rows[0].now);
    }
  });
});
