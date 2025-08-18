const pool = require('../db');
const { addMonths, subMonths } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

// A função de criar permanece a mesma
const createDespesaPessoal = async (req, res) => {
    const {
        descricao, valor, categoria, recorrente, parcelado,
        data_vencimento, 
        parcela_atual,
        quantidade_parcelas
    } = req.body;
    const utilizador_id = req.user.id;

    if (!descricao || !valor || !data_vencimento) {
        return res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        if (recorrente && parcelado === 'sim') {
            if (!parcela_atual || !quantidade_parcelas || Number(parcela_atual) <= 0 || Number(quantidade_parcelas) <= 0) {
                return res.status(400).json({ error: 'Para parcelamento, a parcela atual e o total de parcelas são obrigatórios e devem ser maiores que zero.' });
            }

            const parcelaId = uuidv4();
            const despesasCriadas = [];
            const numParcelaAtual = Number(parcela_atual);
            const totalParcelas = Number(quantidade_parcelas);
            
            const dataVencimentoBase = new Date(data_vencimento + 'T00:00:00');

            const mesesParaSubtrair = numParcelaAtual - 1;
            const dataPrimeiraParcela = subMonths(dataVencimentoBase, mesesParaSubtrair);

            for (let i = 0; i < totalParcelas; i++) {
                const dataVencimentoParcela = addMonths(dataPrimeiraParcela, i);
                const descricaoParcela = `${descricao.trim().toUpperCase()} (${i + 1}/${totalParcelas})`;

                const query = `
                    INSERT INTO despesas_pessoais 
                    (descricao, valor, data_vencimento, categoria, utilizador_id, recorrente, pago, parcela_id, numero_parcela, total_parcelas)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *`;
                
                const values = [
                    descricaoParcela, valor, dataVencimentoParcela, categoria ? categoria.trim().toUpperCase() : null,
                    utilizador_id, true, false, 
                    parcelaId, i + 1, totalParcelas
                ];

                const novaDespesa = await client.query(query, values);
                despesasCriadas.push(novaDespesa.rows[0]);
            }
            
            await client.query('COMMIT');
            return res.status(201).json(despesasCriadas);
        }

        const query = `
            INSERT INTO despesas_pessoais (descricao, valor, data_vencimento, categoria, utilizador_id, recorrente, pago)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`;
        const values = [
            descricao.trim().toUpperCase(), valor, data_vencimento, categoria ? categoria.trim().toUpperCase() : null,
            utilizador_id, recorrente || false, false
        ];
        const novaDespesa = await client.query(query, values);
        await client.query('COMMIT');
        res.status(201).json([novaDespesa.rows[0]]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

// A função de buscar permanece a mesma
const getDespesasPessoais = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }
    try {
        const query = `
            SELECT * FROM despesas_pessoais
            WHERE 
                (pago = FALSE AND data_vencimento BETWEEN $1 AND $2)
                OR 
                (pago = TRUE AND data_pagamento BETWEEN $1 AND $2)
            ORDER BY data_vencimento ASC, data_criacao ASC
        `;
        const resultado = await pool.query(query, [startDate, endDate]);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas pessoais:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// ✅ INÍCIO DA MODIFICAÇÃO: Nova função para buscar despesas pendentes
const getDespesasPessoaisPendentes = async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                descricao,
                valor,
                data_vencimento
            FROM despesas_pessoais
            WHERE pago = FALSE
            ORDER BY data_vencimento ASC;
        `;
        
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);

    } catch (error) {
        console.error('Erro ao buscar despesas pessoais pendentes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
// ✅ FIM DA MODIFICAÇÃO

const updateDespesa = async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, data_vencimento, categoria } = req.body;

    if (!descricao || !valor || !data_vencimento) {
        return res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios.' });
    }

    try {
        const query = `
            UPDATE despesas_pessoais 
            SET descricao = $1, valor = $2, data_vencimento = $3, categoria = $4
            WHERE id = $5 AND recorrente = FALSE
            RETURNING *`;
        
        const resultado = await pool.query(query, [
            descricao.trim().toUpperCase(), 
            valor, 
            data_vencimento, 
            categoria ? categoria.trim().toUpperCase() : null, 
            id
        ]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada ou não pode ser editada (pode ser recorrente).' });
        }
        res.status(200).json(resultado.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const togglePagamentoDespesa = async (req, res) => {
    const { id } = req.params;
    const { pago, data_pagamento } = req.body; 
    if (pago === undefined) {
        return res.status(400).json({ error: 'O campo "pago" é obrigatório para atualização.' });
    }
    
    const dataFinalPagamento = pago ? (data_pagamento || new Date()) : null;
    try {
        const query = `
            UPDATE despesas_pessoais 
            SET pago = $1, data_pagamento = $2 
            WHERE id = $3 
            RETURNING *`;
        
        const resultado = await pool.query(query, [pago, dataFinalPagamento, id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        res.status(200).json(resultado.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar pagamento da despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const deleteDespesaPessoal = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const despesaResult = await client.query('SELECT parcela_id, numero_parcela FROM despesas_pessoais WHERE id = $1', [id]);

        if (despesaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }

        const { parcela_id, numero_parcela } = despesaResult.rows[0];

        if (parcela_id) {
            await client.query('DELETE FROM despesas_pessoais WHERE parcela_id = $1 AND numero_parcela >= $2', [parcela_id, numero_parcela]);
        } else {
            await client.query('DELETE FROM despesas_pessoais WHERE id = $1', [id]);
        }

        await client.query('COMMIT');
        res.status(204).send();
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

module.exports = {
    createDespesaPessoal,
    getDespesasPessoais,
    updateDespesa,
    togglePagamentoDespesa,
    deleteDespesaPessoal,
    getDespesasPessoaisPendentes, // ✅ Exportando a nova função
};
