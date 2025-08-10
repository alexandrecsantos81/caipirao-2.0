const { Pool, types } = require('pg');
require('dotenv').config();

// Converte os tipos NUMERIC (código 1700) do banco para float no JavaScript
types.setTypeParser(1700, (val) => {
  return parseFloat(val);
});

// 1. CRIAR UM OBJETO DE CONFIGURAÇÃO VAZIO
const config = {};

// 2. LÓGICA CONDICIONAL PARA PRODUÇÃO VS. DESENVOLVIMENTO
if (process.env.DATABASE_URL) {
  // Ambiente de Produção (Render)
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = {
    rejectUnauthorized: false // Necessário para conexões SSL no Render
  };
} else {
  // Ambiente de Desenvolvimento (Local)
  config.user = process.env.DB_USER;
  config.host = process.env.DB_HOST;
  config.database = process.env.DB_DATABASE;
  config.password = process.env.DB_PASSWORD;
  config.port = process.env.DB_PORT;
}

// 3. CRIAR O POOL USANDO O OBJETO DE CONFIGURAÇÃO
const pool = new Pool(config);

pool.on('connect', () => {
  console.log(`Conexão com o PostgreSQL bem-sucedida: ${new Date().toLocaleString()}`);
});

// Exportar a instância completa do pool
module.exports = pool;
