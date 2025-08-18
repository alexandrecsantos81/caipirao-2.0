// backend/controllers/empresaController.js

const pool = require('../db'); // Certifique-se de que o caminho para seu pool de conexão está correto.

/**
 * @desc    Buscar os dados da empresa.
 * @route   GET /api/empresa
 * @access  Protegido (Admin)
 */
const getEmpresaDados = async (req, res) => {
    try {
        // A tabela sempre terá a linha com id = 1, conforme definido no schema.
        const result = await pool.query('SELECT * FROM empresa_dados WHERE id = 1');

        if (result.rows.length === 0) {
            // Este erro não deve ocorrer se o schema.sql for executado,
            // mas é uma proteção importante caso a linha padrão não seja inserida.
            return res.status(404).json({ error: 'Dados da empresa ainda não foram configurados.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar dados da empresa.' });
    }
};

/**
 * @desc    Salvar ou atualizar (Upsert) os dados da empresa.
 * @route   PUT /api/empresa
 * @access  Protegido (Admin)
 */
const upsertEmpresaDados = async (req, res) => {
    const {
        nome_fantasia,
        razao_social,
        cnpj,
        inscricao_estadual,
        telefone,
        email,
        endereco_completo,
        logo_url
    } = req.body;

    if (!nome_fantasia || nome_fantasia.trim() === '') {
        return res.status(400).json({ error: 'O campo "Nome Fantasia" é obrigatório.' });
    }

    try {
        // A cláusula ON CONFLICT (id) DO UPDATE é a chave para a operação "Upsert".
        // Ela tenta inserir uma nova linha com id=1. Se já existir, ela atualiza os campos.
        const query = `
            INSERT INTO empresa_dados (
                id, nome_fantasia, razao_social, cnpj, inscricao_estadual,
                telefone, email, endereco_completo, logo_url, data_atualizacao
            )
            VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                nome_fantasia = EXCLUDED.nome_fantasia,
                razao_social = EXCLUDED.razao_social,
                cnpj = EXCLUDED.cnpj,
                inscricao_estadual = EXCLUDED.inscricao_estadual,
                telefone = EXCLUDED.telefone,
                email = EXCLUDED.email,
                endereco_completo = EXCLUDED.endereco_completo,
                logo_url = EXCLUDED.logo_url,
                data_atualizacao = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const params = [
            nome_fantasia,
            razao_social || null,
            cnpj || null,
            inscricao_estadual || null,
            telefone || null,
            email || null,
            endereco_completo || null,
            logo_url || null
        ];

        const result = await pool.query(query, params);

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao salvar dados da empresa:', error);
        // Trata o erro específico de violação de constraint única (ex: CNPJ duplicado)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'O CNPJ informado já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao salvar os dados da empresa.' });
    }
};

module.exports = {
    getEmpresaDados,
    upsertEmpresaDados,
};
