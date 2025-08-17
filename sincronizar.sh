#!/bin/bash

# --- SCRIPT DE SINCRONIZAÇÃO DE BANCO DE DADOS ---
# Descrição: Baixa o banco de dados da nuvem (Render) e o restaura no ambiente local.

# --- CONFIGURAÇÕES ---
# Altere estas variáveis se suas configurações mudarem no futuro.

# Configurações do Banco de Dados da NUVEM (Render)
DB_NUVEM_USER="caipirao_3_db_user"
DB_NUVEM_HOST="dpg-d2ct13vdiees7380mk70-a.oregon-postgres.render.com"
DB_NUVEM_NAME="caipirao3"

# Configurações do Banco de Dados LOCAL
DB_LOCAL_USER="postgres"
DB_LOCAL_HOST="localhost"
DB_LOCAL_NAME="caipirao-db" # <-- IMPORTANTE: Verifique se este é o nome correto do seu banco local

# Nome do arquivo de backup temporário
BACKUP_FILE="temp_backup.dump"

# --- INÍCIO DO SCRIPT ---

# Cores para as mensagens no terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${GREEN}Iniciando o script de sincronização...${NC}"
echo "-------------------------------------------"

# Etapa 1: Exportar o banco de dados da nuvem (pg_dump)
echo -e "${YELLOW}ETAPA 1: Exportando o banco da nuvem (${DB_NUVEM_NAME})...${NC}"

# Pede a senha da nuvem de forma segura
export PGPASSWORD=$(read -sp "Digite a senha do banco da NUVEM e pressione Enter: " val && echo "$val")
echo # Adiciona uma nova linha após a inserção da senha

# Executa o pg_dump
pg_dump -h "$DB_NUVEM_HOST" -U "$DB_NUVEM_USER" -d "$DB_NUVEM_NAME" -F c -b -v -f "$BACKUP_FILE"

# Verifica se o pg_dump foi bem-sucedido
if [ $? -ne 0 ]; then
    echo -e "\n${RED}ERRO: A exportação (pg_dump) falhou. Verifique a senha ou a conexão com a nuvem.${NC}"
    unset PGPASSWORD
    exit 1
fi

echo -e "\n${GREEN}Exportação concluída com sucesso! Arquivo '${BACKUP_FILE}' criado.${NC}"
echo "-------------------------------------------"

# Etapa 2: Restaurar no banco de dados local (pg_restore)
echo -e "${YELLOW}ETAPA 2: Restaurando para o banco local (${DB_LOCAL_NAME})...${NC}"
echo -e "${YELLOW}AVISO: O conteúdo do banco '${DB_LOCAL_NAME}' será substituído!${NC}"

# Pede a senha local de forma segura
export PGPASSWORD=$(read -sp "Digite a senha do banco LOCAL e pressione Enter: " val && echo "$val")
echo

# Executa o pg_restore
pg_restore --verbose --clean --no-acl --no-owner -h "$DB_LOCAL_HOST" -U "$DB_LOCAL_USER" -d "$DB_LOCAL_NAME" "$BACKUP_FILE"

# Verifica se o pg_restore foi bem-sucedido
if [ $? -ne 0 ]; then
    echo -e "\n${RED}ERRO: A restauração (pg_restore) falhou. Verifique a senha ou o nome do banco local.${NC}"
    unset PGPASSWORD
    rm "$BACKUP_FILE" # Remove o backup em caso de falha
    exit 1
fi

# Limpeza final
unset PGPASSWORD
rm "$BACKUP_FILE" # Remove o arquivo de backup temporário após o sucesso

echo -e "\n${GREEN}SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo "O banco de dados local '${DB_LOCAL_NAME}' foi atualizado."
