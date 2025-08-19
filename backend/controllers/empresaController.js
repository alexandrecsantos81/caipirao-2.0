// backend/controllers/empresaController.js

const pool = require('../db');

const getEmpresaData = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresa_dados WHERE id = 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dados da empresa não encontrados.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const updateEmpresaData = async (req, res) => {
    const { nome_fantasia, razao_social, cnpj, inscricao_estadual, telefone, endereco_completo } = req.body;
    try {
        const result = await pool.query(
            `UPDATE empresa_dados SET 
                nome_fantasia = $1, razao_social = $2, cnpj = $3, 
                inscricao_estadual = $4, telefone = $5, endereco_completo = $6,
                data_atualizacao = CURRENT_TIMESTAMP
             WHERE id = 1 RETURNING *`,
            [nome_fantasia, razao_social, cnpj, inscricao_estadual, telefone, endereco_completo]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro da empresa não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar dados da empresa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// ✅ NOVA FUNÇÃO PARA UPLOAD DO LOGO
const uploadLogo = async (req, res) => {
    // O middleware 'multer' já salvou o arquivo e adicionou 'req.file'
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo de imagem foi enviado.' });
    }

    try {
        // Constrói a URL completa para acessar a imagem
        // Ex: http://localhost:3001/public/uploads/logo-1678886400000.png
        const logoUrl = `${req.protocol}://${req.get('host' )}/public/uploads/${req.file.filename}`;

        // Atualiza a coluna 'logo_url' no banco de dados
        const result = await pool.query(
            'UPDATE empresa_dados SET logo_url = $1 WHERE id = 1 RETURNING logo_url',
            [logoUrl]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro da empresa não encontrado para atualizar o logo.' });
        }

        // Retorna a URL da nova imagem para o frontend
        res.status(200).json({
            message: 'Logo atualizado com sucesso!',
            logoUrl: result.rows[0].logo_url
        });

    } catch (error) {
        console.error('Erro ao salvar a URL do logo:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar o upload.' });
    }
};

module.exports = {
    getEmpresaData,
    updateEmpresaData,
    uploadLogo // ✅ Exporta a nova função
};
