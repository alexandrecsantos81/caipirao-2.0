// backend/middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');

// Define o local de armazenamento dos arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Os arquivos serão salvos na pasta 'public/uploads' na raiz do seu backend.
    // Lembre-se de criar essas pastas!
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Cria um nome de arquivo único para evitar conflitos: logo-[timestamp].[extensão]
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado! Apenas imagens são permitidas.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB por arquivo
  }
});

module.exports = upload;
