-- =====================================================================
--  SCRIPT COMPLETO DO BANCO DE DADOS - CAIPIRÃO 3.0 (VERSÃO CORRIGIDA)
--  Este script reflete a estrutura com as tabelas personalizadas
--  'despesas_pessoais' e 'receitas_externas'.
-- =====================================================================

-- Exclui as tabelas na ordem correta de dependência para uma recriação limpa.
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS entradas_estoque;
DROP TABLE IF EXISTS despesas;
DROP TABLE IF EXISTS despesas_pessoais; -- Adicionado
DROP TABLE IF EXISTS receitas_externas; -- Adicionado
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS utilizadores;

-- Tabela de Utilizadores (sem alterações)
CREATE TABLE utilizadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) UNIQUE,
    nickname VARCHAR(50) UNIQUE,
    senha VARCHAR(255),
    perfil VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (perfil IN ('VENDEDOR', 'GERENTE', 'ADMINISTRATIVO', 'ADMIN', 'PENDENTE')),
    status VARCHAR(10) NOT NULL DEFAULT 'INATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes (sem alterações)
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

-- Tabela de Produtos (sem alterações)
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantidade_em_estoque NUMERIC(10, 3) NOT NULL DEFAULT 0,
    custo_medio NUMERIC(10, 2) DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações (Vendas/Entradas) (sem alterações)
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

-- Tabela de Fornecedores (sem alterações)
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas do Negócio (sem alterações)
CREATE TABLE despesas (
    id SERIAL PRIMARY KEY,
    tipo_saida VARCHAR(50) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    discriminacao TEXT NOT NULL,
    parcela_atual INT,
    total_parcelas INT,
    data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE DEFAULT NULL,
    fornecedor_id INT REFERENCES fornecedores(id) ON DELETE SET NULL,
    responsavel_pagamento_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Entradas de Estoque (sem alterações)
CREATE TABLE entradas_estoque (
    id SERIAL PRIMARY KEY,
    produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    quantidade_adicionada NUMERIC(10, 3) NOT NULL,
    custo_total NUMERIC(10, 2) NOT NULL,
    observacao TEXT,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ✅ NOVA TABELA: Despesas Pessoais
CREATE TABLE despesas_pessoais (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    categoria VARCHAR(100),
    pago BOOLEAN DEFAULT FALSE,
    data_pagamento DATE,
    recorrente BOOLEAN DEFAULT FALSE,
    tipo_recorrencia VARCHAR(20) CHECK (tipo_recorrencia IN ('PARCELAMENTO', 'ASSINATURA')),
    parcela_atual INT,
    total_parcelas INT,
    utilizador_id INT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ✅ NOVA TABELA: Receitas Externas
CREATE TABLE receitas_externas (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_recebimento DATE NOT NULL,
    categoria VARCHAR(100),
    utilizador_id INT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
--  ÍNDICES E DADOS INICIAIS
-- =====================================================================

-- Índices para otimizar consultas
CREATE INDEX idx_utilizadores_email ON utilizadores(email);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_movimentacoes_data_venda ON movimentacoes(data_venda);
CREATE INDEX idx_despesas_vencimento ON despesas(data_vencimento);
CREATE INDEX idx_despesas_pessoais_vencimento ON despesas_pessoais(data_vencimento);
CREATE INDEX idx_despesas_pessoais_utilizador_id ON despesas_pessoais(utilizador_id);
CREATE INDEX idx_receitas_externas_data_recebimento ON receitas_externas(data_recebimento);
CREATE INDEX idx_receitas_externas_utilizador_id ON receitas_externas(utilizador_id);

-- Inserir um utilizador ADMIN padrão
INSERT INTO utilizadores (nome, email, nickname, telefone, senha, perfil, status) VALUES 
('Admin Principal', 'admin@caipirao.com', 'admin', '00000000000', '$2a$10$ExemploDeHashSeguroNaoUseIsso', 'ADMIN', 'ATIVO');
