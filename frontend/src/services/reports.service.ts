// frontend/src/services/reports.service.ts

// 1. Importar o Axios diretamente da biblioteca. Nenhuma outra importação local é necessária.
import axios from 'axios';

// 2. Configurar a instância do Axios AQUI MESMO.
const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Verifique se esta é a URL base correta da sua API
} );

// --- O RESTANTE DO CÓDIGO ---

// Interface para definir a estrutura dos dados do resumo financeiro
export interface IFinancialSummary {
  receitaTotal: number;
  despesaTotal: number;
  saldo: number;
}

/**
 * @description Busca o resumo financeiro (receita, despesa, saldo) do backend.
 * Requer token de autenticação de um usuário ADMIN.
 * @returns Uma Promise com os dados do resumo financeiro.
 */
export const getFinancialSummary = async (): Promise<IFinancialSummary> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Token de autenticação não encontrado.');
  }

  const response = await api.get('/reports/summary', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
