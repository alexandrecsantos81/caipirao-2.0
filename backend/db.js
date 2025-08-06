// backend/db.js

// Importa o pacote 'pg' e extrai a classe Pool
const { Pool } = require('pg');
// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Cria uma nova instância do Pool com as configurações do banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE, // Volte para esta linha
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Adiciona um listener para o evento de 'connect', que é disparado
// sempre que uma nova conexão é estabelecida com sucesso.
pool.on('connect', () => {
  console.log(`Conexão com o PostgreSQL bem-sucedida: ${new Date().toLocaleString()}`);
});

// Exporta um objeto com um método 'query'
// Este método permite executar consultas no banco de dados usando uma conexão do pool
module.exports = {
  query: (text, params) => pool.query(text, params),
};
