const { Pool, types } = require('pg');
require('dotenv').config();

// Converte os tipos NUMERIC (código 1700) do banco para float no JavaScript
types.setTypeParser(1700, (val) => {
  return parseFloat(val);
});

// Determina a string de conexão. Usa a DATABASE_URL em produção (Render)
// ou monta uma string a partir das variáveis de ambiente locais para desenvolvimento.
const connectionString = process.env.DATABASE_URL || 
                         `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: connectionString,
  // Adiciona a configuração SSL apenas se a DATABASE_URL estiver presente (ambiente de produção)
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log(`Conexão com o PostgreSQL bem-sucedida: ${new Date().toLocaleString()}`);
});

module.exports = pool;
