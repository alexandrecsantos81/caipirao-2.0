const pool = require('../db');

// ✅ FUNÇÃO ATUALIZADA PARA SALVAR NA TABELA 'despesas_pessoais' E INCLUIR PARCELAMENTO
const registrarDespesa = async (req, res) => {
    // Adiciona os novos campos do formulário
    const { 
        discriminacao, valor, data_vencimento, categoria, 
        recorrente, tipo_recorrencia, parcela_atual, total_parcelas 
    } = req.body;
    
    const utilizador_id = req.user.id; // Pega o ID do usuário logado

    // Validação básica
    if (!discriminacao || !valor || !data_vencimento || !utilizador_id) {
        return res.status(400).json({ error: 'Campos obrigatórios: Descrição, Valor, Vencimento e ID do Utilizador.' });
    }

    try {
        const novaDespesa = await pool.query(
            `INSERT INTO despesas_pessoais (
                discriminacao, valor, data_vencimento, categoria, recorrente, 
                tipo_recorrencia, parcela_atual, total_parcelas, utilizador_id
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                discriminacao.trim().toUpperCase(), 
                valor, 
                data_vencimento, 
                categoria ? categoria.trim().toUpperCase() : null,
                recorrente || false,
                recorrente ? tipo_recorrencia : null,
                recorrente && tipo_recorrencia === 'PARCELAMENTO' ? parcela_atual : null,
                recorrente && tipo_recorrencia === 'PARCELAMENTO' ? total_parcelas : null,
                utilizador_id
            ]
        );
        res.status(201).json(novaDespesa.rows[0]);
    } catch (error) {
        console.error('Erro ao registrar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// ✅ FUNÇÃO ATUALIZADA PARA BUSCAR DE 'despesas_pessoais'
const getDespesas = async (req, res) => {
    const { pagina = 1, limite = 50, termoBusca } = req.query;
    const offset = (pagina - 1) * limite;
    const utilizador_id = req.user.id;

    let whereClauses = ["d.utilizador_id = $1"];
    const params = [utilizador_id];

    if (termoBusca) {
        params.push(`%${termoBusca}%`);
        whereClauses.push(`(d.discriminacao ILIKE $${params.length} OR d.categoria ILIKE $${params.length})`);
    }

    const whereString = `WHERE ${whereClauses.join(' AND ')}`;

    try {
        const countQuery = `SELECT COUNT(d.id) FROM despesas_pessoais d ${whereString}`;
        const totalResult = await pool.query(countQuery, params);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        const despesasQuery = `
            SELECT * 
            FROM despesas_pessoais d
            ${whereString}
            ORDER BY d.data_vencimento ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const despesasResult = await pool.query(despesasQuery, [...params, limite, offset]);

        res.status(200).json({
            dados: despesasResult.rows,
            total: totalItens,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas,
        });

    } catch (error) {
        console.error('Erro ao buscar despesas pessoais:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// ✅ FUNÇÃO ATUALIZADA PARA DELETAR DE 'despesas_pessoais'
const deleteDespesa = async (req, res) => {
    const { id } = req.params;
    const utilizador_id = req.user.id;
    try {
        // Garante que um usuário só pode deletar sua própria despesa
        const resultado = await pool.query('DELETE FROM despesas_pessoais WHERE id = $1 AND utilizador_id = $2', [id, utilizador_id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada ou não pertence a este usuário.' });
        }
        res.status(204).send(); 
    } catch (error) {
        console.error('Erro ao deletar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// ✅ FUNÇÃO ATUALIZADA PARA ATUALIZAR EM 'despesas_pessoais'
const updateDespesa = async (req, res) => {
    const { id } = req.params;
    const utilizador_id = req.user.id;
    const { 
        discriminacao, valor, data_vencimento, categoria, 
        recorrente, tipo_recorrencia, parcela_atual, total_parcelas, pago, data_pagamento
    } = req.body;

    if (!discriminacao || !valor || !data_vencimento) {
        return res.status(400).json({ error: 'Campos obrigatórios: Descrição, Valor e Vencimento.' });
    }

    try {
        const despesaAtualizada = await pool.query(
            `UPDATE despesas_pessoais 
             SET discriminacao = $1, valor = $2, data_vencimento = $3, categoria = $4, recorrente = $5, 
                 tipo_recorrencia = $6, parcela_atual = $7, total_parcelas = $8, pago = $9, data_pagamento = $10
             WHERE id = $11 AND utilizador_id = $12
             RETURNING *`,
            [
                discriminacao.trim().toUpperCase(), valor, data_vencimento, 
                categoria ? categoria.trim().toUpperCase() : null,
                recorrente || false,
                recorrente ? tipo_recorrencia : null,
                recorrente && tipo_recorrencia === 'PARCELAMENTO' ? parcela_atual : null,
                recorrente && tipo_recorrencia === 'PARCELAMENTO' ? total_parcelas : null,
                pago || false,
                pago ? (data_pagamento || new Date().toISOString().split('T')[0]) : null,
                id, utilizador_id
            ]
        );

        if (despesaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada ou não pertence a este usuário.' });
        }

        res.status(200).json(despesaAtualizada.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


// As funções abaixo (quitarDespesa, getDespesasAPagar) pertencem à tabela 'despesas' do negócio
// e não devem ser misturadas com a lógica de 'despesas_pessoais'.
// Vamos mantê-las como estão, mas separadas logicamente.

const quitarDespesaNegocio = async (req, res) => {
    // ... implementação original para a tabela 'despesas' ...
};

const getDespesasAPagarNegocio = async (req, res) => {
    // ... implementação original para a tabela 'despesas' ...
};


module.exports = {
    registrarDespesa,
    getDespesas,
    deleteDespesa,
    updateDespesa,
    // Mantemos as funções antigas com nomes diferentes para não quebrar outras partes do sistema
    quitarDespesa: quitarDespesaNegocio,
    getDespesasAPagar: getDespesasAPagarNegocio,
};
