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
  data_vencimento: string;
  categoria?: string;
  recorrente: boolean;
  parcelado?: 'sim' | 'nao';
  quantidade_parcelas?: number;
  pago?: boolean;
  data_pagamento?: string | null;
}

// ✅ INÍCIO DA MODIFICAÇÃO: Nova interface para o card de pendências
export interface IDespesaPessoalPendente {
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
}
// ✅ FIM DA MODIFICAÇÃO

// --- FUNÇÕES DO SERVIÇO ---

export const getDespesasPessoais = async (startDate: string, endDate: string): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.get('/', {
    params: { startDate, endDate },
  });
  return response.data;
};

// ✅ INÍCIO DA MODIFICAÇÃO: Nova função para buscar despesas pendentes
export const getDespesasPessoaisPendentes = async (): Promise<IDespesaPessoalPendente[]> => {
    const response = await apiClient.get('/pendentes');
    return response.data;
};
// ✅ FIM DA MODIFICAÇÃO

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

// A função togglePagamentoDespesa já existe e será usada pelo novo card
export const togglePagamentoDespesa = async (id: number, pago: boolean, data_pagamento?: string): Promise<IDespesaPessoal> => {
    const response = await apiClient.patch(`/${id}/toggle-pago`, { pago, data_pagamento });
    return response.data;
};
