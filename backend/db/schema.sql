-- =====================================================================
--  SCRIPT COMPLETO DO BANCO DE DADOS - CAIPIRÃO 3.0
--  Este script apaga as tabelas existentes para garantir uma
--  recriação limpa. Ideal para ambientes de desenvolvimento e
--  para configurar o banco de dados pela primeira vez.
--  NÃO EXECUTE EM PRODUÇÃO SE QUISER MANTER OS DADOS EXISTENTES.
-- =====================================================================


-- =====================================================================
--  FASE 1: GESTÃO DE UTILIZADORES, CLIENTES, PRODUTOS E MOVIMENTAÇÕES
-- =====================================================================

-- Exclui as tabelas se elas já existirem, para garantir um começo limpo.
-- A ordem é importante por causa das chaves estrangeiras.
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS entradas_estoque; -- Adicionado para garantir a ordem correta de exclusão
DROP TABLE IF EXISTS despesas; -- Adicionado para garantir a ordem correta de exclusão
DROP TABLE IF EXISTS fornecedores; -- Adicionado para garantir a ordem correta de exclusão
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

-- Tabela de Movimentações (Vendas/Entradas)
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


-- =====================================================================
--  FASE 2: GESTÃO DE DESPESAS, FORNECEDORES E ESTOQUE
-- =====================================================================

-- Tabela para Fornecedores/Credores
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas (Saídas detalhadas)
CREATE TABLE despesas (
    id SERIAL PRIMARY KEY,
    
    -- Detalhes da Despesa
    tipo_saida VARCHAR(50) NOT NULL CHECK (tipo_saida IN (
        'Insumos de Produção', 'Mão de Obra', 'Materiais e Embalagens', 
        'Despesas Operacionais', 'Encargos e Tributos', 'Despesas Administrativas', 
        'Financeiras', 'Remuneração de Sócios', 'Outros'
    )),
    valor NUMERIC(10, 2) NOT NULL,
    discriminacao TEXT NOT NULL,
    
    -- Datas e Status
    data_compra DATE NOT NULL DEFAULT CURRENT_DATE, -- <<< NOVO CAMPO ADICIONADO AQUI
    data_vencimento DATE NOT NULL,
    data_pagamento DATE, -- Fica nulo até a despesa ser quitada
    
    -- Chaves Estrangeiras
    fornecedor_id INT REFERENCES fornecedores(id) ON DELETE SET NULL,
    responsavel_pagamento_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Entradas de Estoque
CREATE TABLE entradas_estoque (
    id SERIAL PRIMARY KEY,
    produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    utilizador_id INT REFERENCES utilizadores(id) ON DELETE SET NULL,
    quantidade_adicionada NUMERIC(10, 3) NOT NULL,
    custo_total NUMERIC(10, 2) NOT NULL,
    observacao TEXT,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
--  ÍNDICES E DADOS INICIAIS
-- =====================================================================

-- Índices para otimizar consultas
CREATE INDEX idx_utilizadores_email ON utilizadores(email);
CREATE INDEX idx_utilizadores_telefone ON utilizadores(telefone);
CREATE INDEX idx_utilizadores_nickname ON utilizadores(nickname);
CREATE INDEX idx_utilizadores_status ON utilizadores(status);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_data_venda ON movimentacoes(data_venda);
CREATE INDEX idx_movimentacoes_data_vencimento ON movimentacoes(data_vencimento);
CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_despesas_vencimento ON despesas(data_vencimento);
CREATE INDEX idx_despesas_compra ON despesas(data_compra); -- <<< ÍNDICE PARA O NOVO CAMPO
CREATE INDEX idx_despesas_pagamento ON despesas(data_pagamento);
CREATE INDEX idx_despesas_fornecedor_id ON despesas(fornecedor_id);
CREATE INDEX idx_entradas_estoque_produto_id ON entradas_estoque(produto_id);
CREATE INDEX idx_entradas_estoque_data_entrada ON entradas_estoque(data_entrada);

-- Inserir um utilizador ADMIN padrão para o primeiro login
-- A senha 'admin' deve ser registrada pela API para ser criptografada corretamente.
-- Este hash é apenas um exemplo e não corresponde a uma senha real.
INSERT INTO utilizadores (nome, email, nickname, telefone, senha, perfil, status) VALUES 
('Admin Principal', 'admin@caipirao.com', 'admin', '00000000000', '$2a$10$ExemploDeHashSeguroNaoUseIsso', 'ADMIN', 'ATIVO');
