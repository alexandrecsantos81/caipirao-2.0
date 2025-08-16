const pool = require('../db');
const { addMonths, subMonths } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Cria uma nova despesa pessoal, com lógica para recorrência e parcelamento.
 * @route   POST /api/despesas-pessoais
 * @access  Protegido (Admin)
 */
const createDespesaPessoal = async (req, res) => {
    const {
        descricao, valor, categoria, recorrente, parcelado,
        data_vencimento, // Esta é a data de vencimento da parcela atual ou da despesa única
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

        // Cenário 1: Despesa Parcelada (Financiamento)
        if (recorrente && parcelado === 'sim') {
            if (!parcela_atual || !quantidade_parcelas || Number(parcela_atual) <= 0 || Number(quantidade_parcelas) <= 0) {
                return res.status(400).json({ error: 'Para parcelamento, a parcela atual e o total de parcelas são obrigatórios e devem ser maiores que zero.' });
            }

            const parcelaId = uuidv4();
            const despesasCriadas = [];
            const numParcelaAtual = Number(parcela_atual);
            const totalParcelas = Number(quantidade_parcelas);

            // Calcula a data da 1ª parcela retroativamente para registrar as parcelas corretamente no tempo
            const mesesParaSubtrair = numParcelaAtual - 1;
            const dataPrimeiraParcela = subMonths(new Date(data_vencimento), mesesParaSubtrair);

            // Cria os registros para todas as parcelas (da 1ª à última)
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
                    utilizador_id, true, false, // 'recorrente' é true, 'pago' é false por padrão
                    parcelaId, i + 1, totalParcelas
                ];

                const novaDespesa = await client.query(query, values);
                despesasCriadas.push(novaDespesa.rows[0]);
            }
            
            await client.query('COMMIT');
            return res.status(201).json(despesasCriadas);
        }

        // Cenário 2: Despesa Única ou Recorrência Contínua (Assinatura)
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

// As outras funções (get, update, delete) permanecem as mesmas.
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

const updateDespesaPessoal = async (req, res) => {
    const { id } = req.params;
    const { pago } = req.body;

    if (pago === undefined) {
        return res.status(400).json({ error: 'O campo "pago" é obrigatório para atualização.' });
    }

    try {
        const data_pagamento = pago ? new Date() : null;
        const query = `
            UPDATE despesas_pessoais 
            SET pago = $1, data_pagamento = $2 
            WHERE id = $3 
            RETURNING *`;
        
        const resultado = await pool.query(query, [pago, data_pagamento, id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        res.status(200).json(resultado.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar despesa pessoal:', error);
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
    updateDespesaPessoal,
    deleteDespesaPessoal,
};
