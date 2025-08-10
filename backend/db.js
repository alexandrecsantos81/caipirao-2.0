const { Pool, types } = require('pg');

// Só carrega as variáveis do .env se NÃO estivermos em produção
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Converte os tipos NUMERIC (código 1700) do banco para float no JavaScript
types.setTypeParser(1700, (val) => {
  return parseFloat(val);
});

let pool;

// Lógica de conexão explícita para produção
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Lógica de conexão para desenvolvimento local
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

pool.on('connect', () => {
  console.log(`Conexão com o PostgreSQL bem-sucedida: ${new Date().toLocaleString()}`);
});

module.exports = pool;
