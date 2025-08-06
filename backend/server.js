// backend/server.js

// 1. Importações de Módulos
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Para carregar variáveis de ambiente do arquivo .env

// 2. Importação da Configuração do Banco de Dados
// Certifique-se que o caminho para seu arquivo db.js está correto.
// Se ele estiver na raiz do backend, o caminho é './db.js'.
// Se estiver em 'backend/config', o caminho é './config/db'.
const pool = require('./db'); 

// 3. Importação das Rotas da Aplicação
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const produtosRoutes = require('./routes/produtos'); // Rota da Etapa 3

// 4. Inicialização do Express
const app = express();

// 5. Middlewares Essenciais
// Habilita o CORS para permitir que o frontend acesse a API
app.use(cors()); 
// Habilita o parsing de JSON no corpo das requisições
app.use(express.json()); 

// 6. Definição das Rotas da API
// As requisições para /api/auth serão gerenciadas pelo authRoutes
app.use('/api/auth', authRoutes);
// As requisições para /api/clientes serão gerenciadas pelo clientesRoutes
app.use('/api/clientes', clientesRoutes);
// As requisições para /api/produtos serão gerenciadas pelo produtosRoutes
app.use('/api/produtos', produtosRoutes);

// 7. Rota Raiz para Teste
// Uma rota simples para verificar se o servidor está online
app.get('/', (req, res) => {
    res.send('API Caipirão 2.0 está funcionando!');
});

// 8. Definição da Porta e Inicialização do Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor conectado ao banco de dados e rodando na porta ${PORT}`);
});

// Opcional: Teste de conexão com o banco de dados na inicialização
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar com o PostgreSQL', err.stack);
  } else {
    console.log('Conexão com o PostgreSQL bem-sucedida:', res.rows[0].now);
  }
});
