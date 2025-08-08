// backend/db.js

const { Pool, types } = require('pg'); // 1. Importe 'types' de 'pg'
require('dotenv').config();

// 2. Diga ao pg para converter os tipos NUMERIC (código 1700) para float
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

module.exports = {
  query: (text, params) => pool.query(text, params),
};
