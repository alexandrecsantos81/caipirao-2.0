// Seu código, agora com o depurador integrado. Cole no arquivo authController.js

const pool = require('../db.js');
const bcrypt = require('bcryptjs'); // Note que você usa 'bcryptjs', está correto.
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { credencial, senha } = req.body;

    // ==================================================================
    // ETAPA 1: VERIFICAR DADOS RECEBIDOS
    // ==================================================================
    console.log("\n\n--- [INÍCIO] Nova Tentativa de Login ---");
    console.log(`[ETAPA 1] Dados recebidos do frontend:`);
    console.log(`          - Credencial: ${credencial}`);
    console.log(`          - Senha (comprimento): ${senha ? senha.length : 'N/A'}`);

    if (!credencial || !senha) {
        console.log("[FALHA ❌] Credencial ou senha não foram enviadas.");
        return res.status(400).json({ error: 'Credencial e senha são obrigatórias.' });
    }

    try {
        // ==================================================================
        // ETAPA 2: BUSCAR USUÁRIO NO BANCO DE DADOS
        // ==================================================================
        console.log("\n[ETAPA 2] Buscando usuário no banco de dados...");
        const query = `
            SELECT id, nome, email, nickname, telefone, perfil, status, senha 
            FROM utilizadores 
            WHERE (email = $1 OR nickname = $1 OR telefone = $1) AND status = 'ATIVO'
        `;
        
        const resultado = await pool.query(query, [credencial]);

        if (resultado.rows.length === 0) {
            console.log("[FALHA ❌] Nenhum usuário ATIVO encontrado com essa credencial.");
            return res.status(401).json({ error: 'Credenciais inválidas ou utilizador inativo.' });
        }

        const utilizador = resultado.rows[0];
        console.log(`[SUCESSO ✅] Usuário encontrado: ${utilizador.email} (ID: ${utilizador.id})`);

        // ==================================================================
        // ETAPA 3: VERIFICAR E COMPARAR A SENHA
        // ==================================================================
        console.log("\n[ETAPA 3] Verificando e comparando a senha...");
        if (!utilizador.senha) {
            console.log(`[FALHA ❌] O usuário ${utilizador.email} NÃO POSSUI senha cadastrada (campo 'senha' é nulo).`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        console.log(`          - Hash da senha no banco: ${utilizador.senha.substring(0, 30)}...`);

        const senhaValida = await bcrypt.compare(senha, utilizador.senha);

        if (!senhaValida) {
            console.log("[FALHA ❌] A senha enviada NÃO CORRESPONDE ao hash salvo no banco.");
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        console.log("[SUCESSO ✅] A senha corresponde!");

        // ==================================================================
        // ETAPA 4: GERAR O TOKEN JWT
        // ==================================================================
        console.log("\n[ETAPA 4] Gerando o token de autenticação (JWT)...");
        const token = jwt.sign(
            { id: utilizador.id, nome: utilizador.nome, perfil: utilizador.perfil },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        console.log("[SUCESSO ✅] Token gerado com sucesso!");

        // ==================================================================
        // ETAPA 5: ENVIAR RESPOSTA FINAL
        // ==================================================================
        console.log("\n[ETAPA 5] Enviando resposta de sucesso para o frontend.");
        console.log("--- [FIM] Login bem-sucedido ---\n\n");
        
        res.json({ token });

    } catch (error) {
        console.error("\n\n--- [ERRO GERAL ❌] Ocorreu um erro inesperado no bloco try/catch ---");
        console.error('>>> ERRO CRÍTICO DURANTE O LOGIN:', error);
        console.error("--- FIM DO ERRO ---\n\n");
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
};

module.exports = {
    loginUser,
};
