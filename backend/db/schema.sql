-- backend/database.sql

-- Exclui as tabelas se elas já existirem, para garantir um começo limpo.
-- A ordem é importante por causa das chaves estrangeiras.
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS utilizadores;

-- Tabela de Utilizadores: armazena os dados de login, perfis e status.
CREATE TABLE utilizadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) UNIQUE, -- Adicionado para login e contato
    nickname VARCHAR(50) UNIQUE, -- Adicionado para login
    senha VARCHAR(255), -- Senha pode ser nula para solicitações pendentes
    
    -- Perfil agora é um ENUM para garantir a consistência dos dados
    perfil VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' 
        CHECK (perfil IN ('VENDEDOR', 'GERENTE', 'ADMINISTRATIVO', 'ADMIN', 'PENDENTE')),
        
    -- Status para controlar o fluxo de ativação do utilizador
    status VARCHAR(10) NOT NULL DEFAULT 'INATIVO'
        CHECK (status IN ('ATIVO', 'INATIVO')),

    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes (sem alterações nesta fase)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefone VARCHAR(20),
    endereco TEXT,
    responsavel VARCHAR(100),
    tem_whatsapp BOOLEAN DEFAULT FALSE,
    coordenada_x NUMERIC,
    coordenada_y NUMERIC,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos (sem alterações nesta fase)
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantidade_em_estoque NUMERIC(10, 3) NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações (sem alterações nesta fase)
CREATE TABLE movimentacoes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    valor_total NUMERIC(10, 2) NOT NULL,
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
    produtos JSONB,
    descricao TEXT,
    data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
    opcao_pagamento VARCHAR(10) CHECK (opcao_pagamento IN ('À VISTA', 'A PRAZO')),
    data_vencimento DATE,
    data_pagamento DATE
);

-- Índices para otimizar consultas
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_data_venda ON movimentacoes(data_venda);
CREATE INDEX idx_movimentacoes_data_vencimento ON movimentacoes(data_vencimento);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_utilizadores_email ON utilizadores(email);
CREATE INDEX idx_utilizadores_telefone ON utilizadores(telefone);
CREATE INDEX idx_utilizadores_nickname ON utilizadores(nickname);
CREATE INDEX idx_utilizadores_status ON utilizadores(status);

-- Inserir um utilizador ADMIN padrão para o primeiro login
-- A senha 'admin' deve ser registrada pela API para ser criptografada corretamente.
INSERT INTO utilizadores (nome, email, nickname, telefone, senha, perfil, status) VALUES 
('Admin Principal', 'admin@caipirao.com', 'admin', '00000000000', '$2a$10$ExemploDeHashSeguroNaoUseIsso', 'ADMIN', 'ATIVO');

