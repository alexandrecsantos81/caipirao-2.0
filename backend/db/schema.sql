-- backend/database.sql

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
    endereco TEXT, -- Alterado para TEXT para acomodar endereços mais longos
    responsavel VARCHAR(100),
    tem_whatsapp BOOLEAN DEFAULT FALSE,
    coordenada_x NUMERIC,
    coordenada_y NUMERIC,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos: armazena informações sobre os produtos à venda.
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    -- A coluna de preço foi confirmada como 'price'
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantidade_em_estoque NUMERIC(10, 3) NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações: registra todas as transações financeiras (vendas e despesas).
-- Esta é a tabela com as maiores atualizações.
CREATE TABLE movimentacoes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    valor_total NUMERIC(10, 2) NOT NULL,
    
    -- Chaves Estrangeiras
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
    
    -- Campos para Vendas e Despesas
    produtos JSONB, -- Para detalhes dos produtos na venda
    descricao TEXT,  -- Para descrição da despesa

    -- NOVAS COLUNAS PARA CONTROLE FINANCEIRO
    data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
    opcao_pagamento VARCHAR(10) CHECK (opcao_pagamento IN ('À VISTA', 'A PRAZO')),
    data_vencimento DATE,
    data_pagamento DATE
);

-- Índices para otimizar consultas futuras
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_data_venda ON movimentacoes(data_venda);
CREATE INDEX idx_movimentacoes_data_vencimento ON movimentacoes(data_vencimento);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_produtos_nome ON produtos(nome);

-- Inserir um usuário ADMIN padrão para o primeiro login
-- A senha 'admin' deve ser registrada pela API para ser criptografada corretamente.
-- Este INSERT é apenas um placeholder.
INSERT INTO utilizadores (nome, email, senha, perfil) VALUES 
('Admin Principal', 'admin@caipirao.com', 'senha_criptografada_pela_api', 'ADMIN');

