const pool = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * @desc    Admin cria um novo utilizador diretamente.
 * @route   POST /api/utilizadores
 * @access  Admin
 */
const createUtilizador = async (req, res) => {
    const { nome, email, telefone, nickname, senha, perfil } = req.body;

    if (!nome || !email || !nickname || !senha || !perfil) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios: nome, email, nickname, senha e perfil.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUtilizador = await pool.query(
            `INSERT INTO utilizadores (nome, email, telefone, nickname, senha, perfil, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'ATIVO')
             RETURNING id, nome, email, telefone, nickname, perfil, status`,
            [nome, email, telefone, nickname, senhaCriptografada, perfil]
        );

        res.status(201).json(novoUtilizador.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Violação de chave única
            return res.status(409).json({ error: 'Email, telefone ou nickname já cadastrado.' });
        }
        console.error('Erro ao criar utilizador:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Utilizador não autenticado solicita acesso ao sistema.
 * @route   POST /api/utilizadores/solicitar-acesso
 * @access  Público
 */
const solicitarAcesso = async (req, res) => {
    const { nome, email, telefone } = req.body;

    if (!nome || !email || !telefone) {
        return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios.' });
    }

    try {
        // Insere o utilizador com perfil PENDENTE e status INATIVO
        const novaSolicitacao = await pool.query(
            `INSERT INTO utilizadores (nome, email, telefone, perfil, status)
             VALUES ($1, $2, $3, 'PENDENTE', 'INATIVO')
             RETURNING id, nome, email, status`,
            [nome, email, telefone]
        );

        res.status(201).json({ 
            message: 'Solicitação de acesso enviada com sucesso! Um administrador irá revisar seus dados.',
            solicitacao: novaSolicitacao.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email ou telefone já possui um cadastro ou uma solicitação pendente.' });
        }
        console.error('Erro ao solicitar acesso:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Admin ativa um utilizador pendente.
 * @route   PUT /api/utilizadores/:id/ativar
 * @access  Admin
 */
const ativarUtilizador = async (req, res) => {
    const { id } = req.params;
    const { perfil } = req.body;

    if (!perfil) {
        return res.status(400).json({ error: 'É necessário definir um perfil para ativar o utilizador.' });
    }

    try {
        const senhaProvisoria = crypto.randomBytes(4).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senhaProvisoria, salt);

        const resultado = await pool.query(
            `UPDATE utilizadores
             SET status = 'ATIVO', perfil = $1, senha = $2
             WHERE id = $3 AND status = 'INATIVO'
             RETURNING id, nome, email, telefone, perfil, status`,
            [perfil, senhaCriptografada, id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado ou já está ativo.' });
        }

        const utilizadorAtivado = resultado.rows[0];
        res.status(200).json({
            message: 'Utilizador ativado com sucesso!',
            utilizador: utilizadorAtivado,
            senhaProvisoria: senhaProvisoria
        });

    } catch (error) {
        console.error('Erro ao ativar utilizador:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Admin busca todos os utilizadores.
 * @route   GET /api/utilizadores
 * @access  Admin
 */
const getUtilizadores = async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, nome, email, telefone, nickname, perfil, status 
             FROM utilizadores 
             ORDER BY nome ASC`
        );
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar utilizadores:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Admin atualiza os dados de um utilizador (incluindo status e perfil).
 * @route   PUT /api/utilizadores/:id
 * @access  Admin
 */
const updateUtilizador = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, nickname, perfil, status } = req.body;

    if (!nome || !email || !perfil || !status) {
        return res.status(400).json({ error: 'Nome, email, perfil e status são obrigatórios.' });
    }

    try {
        const utilizadorAtualizado = await pool.query(
            `UPDATE utilizadores 
             SET nome = $1, email = $2, telefone = $3, nickname = $4, perfil = $5, status = $6
             WHERE id = $7 RETURNING id, nome, email, telefone, nickname, perfil, status`,
            [nome, email, telefone, nickname, perfil, status, id]
        );

        if (utilizadorAtualizado.rowCount === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado.' });
        }

        res.status(200).json(utilizadorAtualizado.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Violação de chave única
            return res.status(409).json({ error: 'Email, telefone ou nickname já cadastrado em outro utilizador.' });
        }
        console.error('Erro ao atualizar utilizador:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Admin deleta um utilizador.
 * @route   DELETE /api/utilizadores/:id
 * @access  Admin
 */
const deleteUtilizador = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    if (Number(id) === Number(adminId)) {
        return res.status(403).json({ error: 'Não é permitido excluir o seu próprio utilizador.' });
    }

    try {
        const resultado = await pool.query('DELETE FROM utilizadores WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Utilizador não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar utilizador:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    createUtilizador,
    solicitarAcesso,
    ativarUtilizador,
    getUtilizadores,
    updateUtilizador,
    deleteUtilizador,
};
