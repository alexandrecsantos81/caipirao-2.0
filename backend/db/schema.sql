-- Exclui as tabelas se elas já existirem, para garantir um começo limpo.
-- A ordem é importante por causa das chaves estrangeiras.
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS utilizadores;

-- Tabela de Utilizadores: armazena os dados de login e perfis de acesso.
CREATE TABLE utilizadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(10) NOT NULL DEFAULT 'USER' CHECK (perfil IN ('ADMIN', 'USER')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes: armazena as informações dos clientes.
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefone VARCHAR(20),
    coordenada_x NUMERIC,
    coordenada_y NUMERIC,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos: armazena informações sobre os produtos à venda.
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações: registra todas as transações financeiras (vendas e despesas).
CREATE TABLE movimentacoes (
CREATE TABLE movimentacoes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valor_total NUMERIC(10, 2) NOT NULL,
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
    descricao TEXT, -- <<< COLUNA IMPORTANTE PARA DESPESAS
    produtos JSONB
);

-- Índices são criados para otimizar a velocidade de consultas futuras
-- que filtram ou ordenam por estas colunas.
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_produtos_nome ON produtos(nome);

-- Inserir um usuário ADMIN padrão para o primeiro login
-- Senha é 'admin' (será criptografada pela aplicação ao registrar)
-- Lembre-se de registrar este usuário pela API ou trocar a senha criptografada aqui.
-- Exemplo com senha 'admin' criptografada (gerada com bcrypt, custo 10):
-- A senha real deve ser gerada pela sua rota /register.
INSERT INTO utilizadores (nome, email, senha, perfil) VALUES 
('Admin Padrão', 'admin@caipirao.com', '$2b$10$f/U.G2L9a.N/aQ.r9gH3..Tj5.YgI/dG.G/g.f/g.f/g.f/g.f', 'ADMIN');

