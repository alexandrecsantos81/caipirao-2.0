// frontend/src/services/reports.service.ts

import axios from 'axios';

// Configuração da instância do Axios
const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Verifique se esta é a URL base correta da sua API
} );

// --- INTERFACES DE DADOS ---

// Interface para o resumo financeiro (já existente)
export interface IFinancialSummary {
  receitaTotal: number;
  despesaTotal: number;
  saldo: number;
}

// Interface para os dados do nosso novo relatório de produtos
export interface IProdutoMaisVendido {
  id: number;
  nome: string;
  total_vendido: number;
}


// --- FUNÇÕES DE SERVIÇO ---

/**
 * @description Busca o resumo financeiro (receita, despesa, saldo) do backend.
 * Requer token de autenticação de um usuário ADMIN.
 * @returns Uma Promise com os dados do resumo financeiro.
 */
export const getFinancialSummary = async (): Promise<IFinancialSummary> => {
  const token = localStorage.getItem('token'); // <-- CORRIGIDO
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

/**
 * @description Busca a lista de produtos mais vendidos no backend.
 * Requer token de autenticação de um usuário ADMIN.
 * @returns Uma Promise com a lista de produtos mais vendidos.
 */
export const getProdutosMaisVendidos = async (): Promise<IProdutoMaisVendido[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token de autenticação não encontrado.');
  }

  const response = await api.get('/reports/produtos-mais-vendidos', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
