// backend/db.js

const { Pool, types } = require('pg');
require('dotenv').config();

// Converte os tipos NUMERIC (código 1700) do banco para float no JavaScript
types.setTypeParser(1700, (val) => {
  return parseFloat(val);
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log(`Conexão com o PostgreSQL bem-sucedida: ${new Date().toLocaleString()}`);
});

// CORREÇÃO: Exportar a instância completa do pool, não apenas a função query.
module.exports = pool;
