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

// --- INTERFACES ---

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

// **INÍCIO DA CORREÇÃO**
// A interface do formulário agora inclui TODOS os campos que o formulário pode gerar.
export interface IDespesaPessoalForm {
  descricao: string;
  valor: number | string;
  data_vencimento: string;
  categoria?: string | null;
  recorrente: boolean;
  parcelado?: 'sim' | 'nao';
  parcela_atual?: number | string;
  quantidade_parcelas?: number | string;
  pago?: boolean; // Adicionado para a função de update
}
// **FIM DA CORREÇÃO**

// --- FUNÇÕES DO SERVIÇO ---

export const getDespesasPessoais = async (startDate?: string, endDate?: string): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.get('/', { params: { startDate, endDate } });
  return response.data;
};

export const createDespesaPessoal = async (data: IDespesaPessoalForm): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.post('/', data);
  return response.data;
};

export const updateDespesaPessoal = async ({ id, data }: { id: number, data: Partial<IDespesaPessoalForm> }): Promise<IDespesaPessoal> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

export const deleteDespesaPessoal = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};
