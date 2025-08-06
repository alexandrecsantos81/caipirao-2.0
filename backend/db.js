// Importa o pacote 'pg' e extrai a classe Pool
const { Pool } = require('pg');
// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Cria uma nova instância do Pool com as configurações do banco de dados
// As configurações são lidas a partir das variáveis de ambiente
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exporta um objeto com um método 'query'
// Este método permite executar consultas no banco de dados usando uma conexão do pool
module.exports = {
  query: (text, params) => pool.query(text, params),
};
