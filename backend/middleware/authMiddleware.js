// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar o token JWT enviado no cabeçalho da requisição.
 * Se o token for válido, adiciona os dados do usuário (payload) ao objeto `req`
 * e passa a requisição para a próxima função (a rota).
 */
const verifyToken = (req, res, next) => {
  // Pega o token do cabeçalho 'Authorization', que geralmente vem no formato "Bearer TOKEN"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extrai apenas o token

  if (!token) {
    // 401 Unauthorized: o cliente não forneceu um token.
    return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    // Tenta verificar se o token é válido usando o segredo do nosso .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Se o token for válido, o payload decodificado (com userId e perfil)
    // é adicionado ao objeto da requisição (req).
    req.user = decoded;
    
    // Chama a próxima função no ciclo da requisição (a rota que queremos proteger).
    next();
  } catch (error) {
    // 403 Forbidden: o token fornecido é inválido, expirou ou foi adulterado.
    res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};

/**
 * Middleware para verificar se o usuário autenticado tem o perfil de 'ADMIN'.
 * IMPORTANTE: Este middleware deve ser usado SEMPRE DEPOIS do 'verifyToken',
 * pois ele depende do `req.user` que o 'verifyToken' cria.
 */
const checkAdmin = (req, res, next) => {
  // Verifica se o objeto 'user' existe e se o perfil é 'ADMIN'
  if (req.user && req.user.perfil === 'ADMIN') {
    // Se for Admin, permite que a requisição continue para a rota final.
    next();
  } else {
    // 403 Forbidden: o usuário está autenticado, mas não tem permissão para este recurso.
    res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
  }
};

// Exporta as funções para que possam ser usadas em outros arquivos (como no server.js)
module.exports = { 
  verifyToken, 
  checkAdmin 
};
