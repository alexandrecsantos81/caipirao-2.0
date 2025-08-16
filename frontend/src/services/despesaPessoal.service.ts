import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/despesas-pessoais` } );

// Interceptor para adicionar o token de autenticação
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

export interface IDespesaPessoal {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string | null;
  pago: boolean;
  data_pagamento?: string | null;
  utilizador_id: number;
  data_criacao: string;
}

export interface IDespesaPessoalForm {
  descricao: string;
  valor: number | string;
  data_vencimento: string;
  categoria?: string;
  recorrencia: boolean;
  mesesRecorrencia?: number;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista de despesas pessoais com filtro opcional de data.
 */
export const getDespesasPessoais = async (startDate?: string, endDate?: string): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.get('/', {
    params: { startDate, endDate },
  });
  return response.data;
};

/**
 * @description Cria uma ou mais despesas pessoais (com base na recorrência).
 */
export const createDespesaPessoal = async (data: IDespesaPessoalForm): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

/**
 * @description Atualiza os dados de uma despesa pessoal existente.
 */
export const updateDespesaPessoal = async ({ id, data }: { id: number, data: Partial<IDespesaPessoal> }): Promise<IDespesaPessoal> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

/**
 * @description Deleta uma despesa pessoal.
 */
export const deleteDespesaPessoal = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};
