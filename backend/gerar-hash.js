// backend/gerar-hash.js
const bcrypt = require('bcrypt');

const senhaPlana = 'admin123'; // A senha que você quer usar
const saltRounds = 10;

console.log(`Gerando hash para a senha: "${senhaPlana}"`);

bcrypt.hash(senhaPlana, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar o hash:', err);
    return;
  }
  console.log('\n✅ HASH GERADO! Copie a linha abaixo:\n');
  console.log(hash); // <--- COPIE ESTA LINHA
  console.log('\nCole este hash na coluna "senha" do seu usuário no DBeaver.');
});
