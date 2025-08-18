const { Pool, types } = require('pg');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

types.setTypeParser(1700, (val) => {
  return parseFloat(val);
});

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

// --- MODIFICAÇÃO PARA TESTE DE CONEXÃO ---
// Vamos tentar conectar e verificar a versão imediatamente.
// Se falhar, o processo do Node.js irá parar com um erro claro.
pool.query('SELECT version()', (err, res) => {
  if (err) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! ERRO CRÍTICO AO CONECTAR COM O BANCO DE DADOS !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Verifique se o serviço do PostgreSQL está rodando e se as credenciais no arquivo .env estão corretas.');
    console.error('Erro original:', err);
    // Encerra o processo se não conseguir conectar
    process.exit(1); 
  } else {
    console.log('✅ Conexão com o PostgreSQL bem-sucedida.');
    console.log('✅ Versão do Servidor:', res.rows[0].version);
  }
});

module.exports = pool;
