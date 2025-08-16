import axios from 'axios';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/despesas-pessoais` } );

// Interceptor para adicionar o token de autenticação em todas as chamadas
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- INTERFACES ---

/**
 * @description Representa a estrutura de uma despesa pessoal como ela vem do banco de dados.
 */
export interface IDespesaPessoal {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string | null;
  pago: boolean;
  data_pagamento: string | null;
  utilizador_id: number;
  recorrente: boolean;
  parcela_id?: string | null;
  numero_parcela?: number | null;
  total_parcelas?: number | null;
  data_criacao: string;
}

/**
 * @description Representa os dados do formulário a serem enviados para a API.
 * CORREÇÃO: Incluídos todos os campos condicionais do formulário.
 */
export interface IDespesaPessoalForm {
  descricao: string;
  valor: number | string;
  data_vencimento: string;
  categoria?: string | null;
  recorrente: boolean;
  parcelado?: 'sim' | 'nao';
  parcela_atual?: number | string;
  quantidade_parcelas?: number | string;
  pago?: boolean; // Usado na atualização
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista de despesas pessoais dentro de um período de datas.
 */
export const getDespesasPessoais = async (startDate?: string, endDate?: string): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.get('/', { params: { startDate, endDate } });
  return response.data;
};

/**
 * @description Cria uma ou mais despesas pessoais (lida com parcelamento no backend).
 * @returns Retorna um array de despesas criadas.
 */
export const createDespesaPessoal = async (data: IDespesaPessoalForm): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

/**
 * @description Atualiza os dados de uma despesa pessoal existente (principalmente o status 'pago').
 */
export const updateDespesaPessoal = async ({ id, data }: { id: number, data: Partial<IDespesaPessoalForm> }): Promise<IDespesaPessoal> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

/**
 * @description Deleta uma despesa pessoal ou um conjunto de parcelas.
 */
export const deleteDespesaPessoal = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};
