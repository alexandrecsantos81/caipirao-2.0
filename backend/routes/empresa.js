// backend/routes/empresa.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const { getEmpresaData, updateEmpresaData, uploadLogo } = require('../controllers/empresaController');
const upload = require('../middleware/uploadMiddleware'); // ✅ Importa o middleware de upload

// Todas as rotas aqui exigem um admin logado
router.use(verifyToken, checkAdmin);

// Rota para buscar e salvar os dados de texto do formulário
router.route('/')
    .get(getEmpresaData)
    .put(updateEmpresaData);

// ✅ NOVA ROTA PARA UPLOAD DO LOGO
// O 'upload.single('logo')' processa um único arquivo enviado no campo 'logo'
router.post('/upload-logo', upload.single('logo'), uploadLogo);

module.exports = router;
