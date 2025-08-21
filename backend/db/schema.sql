-- =====================================================================
--  SCRIPT COMPLETO DO BANCO DE DADOS - CAIPIRÃO 3.0
--  Versão: 2025-08-21 (com funcionalidade de Abate)
-- =====================================================================

-- Exclui as tabelas se elas já existirem, para garantir um começo limpo.
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS entradas_estoque;
DROP TABLE IF EXISTS despesas;
DROP TABLE IF EXISTS despesas_pessoais;
DROP TABLE IF EXISTS receitas_externas;
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS funcionarios; -- Adicionado para ordem correta de exclusão
DROP TABLE IF EXISTS utilizadores;
DROP TABLE IF EXISTS empresa_dados;

-- Tabela de Utilizadores
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

-- Tabela de Clientes
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

-- Tabela de Produtos
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantidade_em_estoque NUMERIC(10, 3) NOT NULL DEFAULT 0,
    custo_medio NUMERIC(10, 2) DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações (Vendas)
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
    data_pagamento DATE,
    responsavel_quitacao_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    venda_pai_id INT REFERENCES movimentacoes(id) ON DELETE SET NULL
);

-- Tabela de Fornecedores
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Funcionários Operacionais (NOVA)
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    funcao VARCHAR(100),
    status VARCHAR(10) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas
CREATE TABLE despesas (
    id SERIAL PRIMARY KEY,
    tipo_saida VARCHAR(50) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    discriminacao TEXT NOT NULL,
    data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE DEFAULT NULL,
    fornecedor_id INT REFERENCES fornecedores(id) ON DELETE SET NULL,
    responsavel_pagamento_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    despesa_pai_id INT REFERENCES despesas(id) ON DELETE SET NULL,
    funcionario_id INT REFERENCES funcionarios(id) ON DELETE SET NULL, -- NOVO
    lote_id UUID, -- NOVO
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Entradas de Estoque
CREATE TABLE entradas_estoque (
    id SERIAL PRIMARY KEY,
    produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    quantidade_adicionada NUMERIC(10, 3) NOT NULL,
    custo_total NUMERIC(10, 2) NOT NULL,
    observacao TEXT,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Receitas Externas
CREATE TABLE receitas_externas (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_recebimento DATE NOT NULL,
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    categoria VARCHAR(100),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas Pessoais
CREATE TABLE despesas_pessoais (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    categoria VARCHAR(100),
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    data_pagamento DATE,
    utilizador_id INT NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    parcela_id UUID,
    numero_parcela INT,
    total_parcelas INT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Dados da Empresa
CREATE TABLE empresa_dados (
    id INT PRIMARY KEY DEFAULT 1,
    nome_fantasia VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    inscricao_estadual VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco_completo TEXT,
    logo_url TEXT,
    data_atualizacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_row CHECK (id = 1)
);

-- Inserções e Índices
INSERT INTO utilizadores (nome, email, nickname, telefone, senha, perfil, status) VALUES
('Admin Principal', 'admin@caipirao.com', 'admin', '00000000000', '$2a$10$ExemploDeHashSeguroNaoUseIsso', 'ADMIN', 'ATIVO')
ON CONFLICT (email) DO NOTHING;

INSERT INTO empresa_dados (id, nome_fantasia)
SELECT 1, 'NOME DA SUA EMPRESA'
WHERE NOT EXISTS (SELECT 1 FROM empresa_dados WHERE id = 1);

CREATE INDEX IF NOT EXISTS idx_utilizadores_email ON utilizadores(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data_venda ON movimentacoes(data_venda);
CREATE INDEX IF NOT EXISTS idx_despesas_vencimento ON despesas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_receitas_externas_data ON receitas_externas(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_despesas_pessoais_vencimento ON despesas_pessoais(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_despesas_pessoais_parcela_id ON despesas_pessoais(parcela_id);
CREATE INDEX IF NOT EXISTS idx_despesas_funcionario_id ON despesas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_despesas_lote_id ON despesas(lote_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome);

