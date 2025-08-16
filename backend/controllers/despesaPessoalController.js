// backend/controllers/despesaPessoalController.js

const pool = require('../db');
const { addMonths } = require('date-fns');
const { v4: uuidv4 } = require('uuid'); // Biblioteca para gerar IDs únicos para as parcelas

/**
 * @desc    Cria uma nova despesa pessoal, com lógica para recorrência e parcelamento.
 * @route   POST /api/despesas-pessoais
 * @access  Protegido (Admin)
 */
const createDespesaPessoal = async (req, res) => {
    const {
        descricao, valor, data_vencimento, categoria,
        recorrente, parcelado, quantidade_parcelas
    } = req.body;
    const utilizador_id = req.user.id;

    if (!descricao || !valor || !data_vencimento) {
        return res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios.' });
    }

    const client = await pool.connect();

    try {
        // Inicia a transação
        await client.query('BEGIN');

        // Cenário 1: Despesa Parcelada (Recorrente com quantidade definida)
        if (recorrente && parcelado === 'sim' && quantidade_parcelas && quantidade_parcelas > 1) {
            const parcela_id = uuidv4(); // Gera um ID único para agrupar todas as parcelas da mesma compra
            const despesasCriadas = [];

            for (let i = 0; i < quantidade_parcelas; i++) {
                // Calcula a data de vencimento para a parcela atual
                const dataVencimentoParcela = addMonths(new Date(data_vencimento), i);
                // Adiciona o indicador de parcela na descrição (ex: "NETFLIX (1/12)")
                const descricaoParcela = `${descricao.toUpperCase()} (${i + 1}/${quantidade_parcelas})`;

                const query = `
                    INSERT INTO despesas_pessoais 
                    (descricao, valor, data_vencimento, categoria, utilizador_id, recorrente, pago, parcela_id, numero_parcela, total_parcelas)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *`;
                
                const values = [
                    descricaoParcela,
                    valor,
                    dataVencimentoParcela,
                    categoria ? categoria.toUpperCase() : null,
                    utilizador_id,
                    true, // É recorrente
                    false, // Inicia como não paga
                    parcela_id,
                    i + 1, // numero_parcela
                    quantidade_parcelas // total_parcelas
                ];

                const novaDespesa = await client.query(query, values);
                despesasCriadas.push(novaDespesa.rows[0]);
            }
            
            // Se tudo deu certo, confirma a transação
            await client.query('COMMIT');
            return res.status(201).json(despesasCriadas);
        }

        // Cenário 2: Despesa Única ou Recorrência Contínua
        // A lógica para criar o primeiro registro é a mesma. A diferença está no valor do campo 'recorrente'.
        const query = `
            INSERT INTO despesas_pessoais 
            (descricao, valor, data_vencimento, categoria, utilizador_id, recorrente, pago)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`;
        
        const values = [
            descricao.toUpperCase(),
            valor,
            data_vencimento,
            categoria ? categoria.toUpperCase() : null,
            utilizador_id,
            recorrente || false, // Se for recorrência contínua, será true. Se for única, será false.
            false // Inicia como não paga
        ];

        const novaDespesa = await client.query(query, values);
        
        // Confirma a transação
        await client.query('COMMIT');
        res.status(201).json([novaDespesa.rows[0]]);

    } catch (error) {
        // Em caso de qualquer erro, desfaz a transação
        await client.query('ROLLBACK');
        console.error('Erro ao criar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar a despesa.' });
    } finally {
        // Libera o cliente de volta para o pool de conexões
        client.release();
    }
};

/**
 * @desc    Busca todas as despesas pessoais dentro de um período.
 * @route   GET /api/despesas-pessoais
 * @access  Protegido (Admin)
 */
const getDespesasPessoais = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }
    try {
        const query = `
            SELECT * FROM despesas_pessoais
            WHERE data_vencimento BETWEEN $1 AND $2
            ORDER BY data_vencimento ASC, data_criacao ASC
        `;
        const resultado = await pool.query(query, [startDate, endDate]);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas pessoais:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Atualiza uma despesa pessoal.
 * @route   PUT /api/despesas-pessoais/:id
 * @access  Protegido (Admin)
 */
const updateDespesaPessoal = async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, data_vencimento, categoria, pago, data_pagamento } = req.body;

    // Validação básica
    if (descricao === undefined && valor === undefined && data_vencimento === undefined && categoria === undefined && pago === undefined) {
        return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
    }

    try {
        // Busca o estado atual da despesa
        const currentState = await pool.query('SELECT * FROM despesas_pessoais WHERE id = $1', [id]);
        if (currentState.rows.length === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        const despesa = currentState.rows[0];

        // Constrói a query de atualização dinamicamente
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (descricao !== undefined) { fields.push(`descricao = $${paramIndex++}`); values.push(descricao.toUpperCase()); }
        if (valor !== undefined) { fields.push(`valor = $${paramIndex++}`); values.push(valor); }
        if (data_vencimento !== undefined) { fields.push(`data_vencimento = $${paramIndex++}`); values.push(data_vencimento); }
        if (categoria !== undefined) { fields.push(`categoria = $${paramIndex++}`); values.push(categoria ? categoria.toUpperCase() : null); }
        if (pago !== undefined) {
            fields.push(`pago = $${paramIndex++}`);
            values.push(pago);
            // Atualiza a data de pagamento com base no status de 'pago'
            fields.push(`data_pagamento = $${paramIndex++}`);
            values.push(pago ? (data_pagamento || new Date()) : null);
        }
        
        values.push(id); // Adiciona o ID como último parâmetro

        const query = `UPDATE despesas_pessoais SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        const resultado = await pool.query(query, values);
        res.status(200).json(resultado.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Deleta uma despesa pessoal.
 * @route   DELETE /api/despesas-pessoais/:id
 * @access  Protegido (Admin)
 */
const deleteDespesaPessoal = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM despesas_pessoais WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error('Erro ao deletar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


module.exports = {
    createDespesaPessoal,
    getDespesasPessoais,
    updateDespesaPessoal,
    deleteDespesaPessoal,
};
