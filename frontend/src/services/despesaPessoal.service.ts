// frontend/src/services/despesaPessoal.service.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/despesas-pessoais` } );

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

export interface IDespesaPessoal {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string | null;
  pago: boolean;
  data_pagamento?: string | null;
  utilizador_id: number;
  recorrente: boolean;
  parcela_id?: string | null;
  numero_parcela?: number | null;
  total_parcelas?: number | null;
}

export interface IDespesaPessoalForm {
  descricao: string;
  valor: number | string;
  categoria?: string;
  recorrente: boolean;
  parcelado?: 'sim' | 'nao';
  data_vencimento: string;
  parcela_atual?: number;
  quantidade_parcelas?: number;
  // CORREÇÃO: Adicionando os campos opcionais para a atualização de status
  pago?: boolean;
  data_pagamento?: string | null;
}

export const getDespesasPessoais = async (startDate: string, endDate: string): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.get('/', { params: { startDate, endDate } });
  return response.data;
};

export const createDespesaPessoal = async (data: IDespesaPessoalForm): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

// A função de update já aceita um Partial, então está correta.
export const updateDespesaPessoal = async ({ id, data }: { id: number, data: Partial<IDespesaPessoalForm> }): Promise<IDespesaPessoal> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

export const deleteDespesaPessoal = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};
