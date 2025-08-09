// backend/db.js

const { Pool, types } = require('pg');
require('dotenv').config();

// Converte os tipos NUMERIC (código 1700) do banco para float no JavaScript
types.setTypeParser(1700, (val) => {
  return parseFloat(val);
});

// Configuração para produção (Render) e desenvolvimento (local)
const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  connectionString: process.env.DATABASE_URL, // URL fornecida pela Render
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(connectionConfig);

pool.on('connect', () => {
  console.log(`Conexão com o PostgreSQL bem-sucedida: ${new Date().toLocaleString()}`);
});

module.exports = pool;
