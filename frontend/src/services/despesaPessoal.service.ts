import axios from 'axios';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/despesas-pessoais` }  );

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
  data_pagamento?: string | null;
  utilizador_id: number;
  
  // Novos campos para recorrência e parcelamento
  recorrente: boolean;
  parcela_id?: string | null;
  numero_parcela?: number | null;
  total_parcelas?: number | null;
}

/**
 * @description Representa os dados do formulário a serem enviados para a API.
 */
export interface IDespesaPessoalForm {
  descricao: string;
  valor: number | string; // O formulário pode tratar como string inicialmente
  data_vencimento: string;
  categoria?: string;
  
  // --- INÍCIO DA CORREÇÃO ---
  // Campos do formulário para controlar a lógica de recorrência
  recorrente: boolean;
  parcelado?: 'sim' | 'nao';
  parcela_atual?: number | string; // <-- CAMPO ADICIONADO DE VOLTA
  quantidade_parcelas?: number | string; // <-- CAMPO ADICIONADO DE VOLTA
  // --- FIM DA CORREÇÃO ---

  // Campos usados apenas na atualização de status
  pago?: boolean;
  data_pagamento?: string | null;
}


// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista de despesas pessoais dentro de um período de datas.
 */
export const getDespesasPessoais = async (startDate: string, endDate: string): Promise<IDespesaPessoal[]> => {
  const response = await apiClient.get('/', {
    params: { startDate, endDate },
  });
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
 * @description Atualiza os dados de uma despesa pessoal existente.
 */
export const updateDespesaPessoal = async ({ id, data }: { id: number, data: Partial<IDespesaPessoalForm> }): Promise<IDespesaPessoal> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
};

/**
 * @description Alterna o status de pagamento de uma despesa.
 */
export const togglePagamentoDespesa = async (id: number, pago: boolean, data_pagamento?: string): Promise<IDespesaPessoal> => {
    const response = await apiClient.patch(`/${id}/toggle-pago`, { pago, data_pagamento });
    return response.data;
};

/**
 * @description Deleta uma despesa pessoal.
 */
export const deleteDespesaPessoal = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
};

/**
 * @description Busca a lista de despesas pessoais pendentes.
 */
export interface IDespesaPessoalPendente {
    id: number;
    valor: number;
    data_vencimento: string;
    descricao: string;
    categoria: string | null;
}

export const getDespesasPessoaisPendentes = async (): Promise<IDespesaPessoalPendente[]> => {
    const response = await apiClient.get('/pendentes');
    return response.data;
};
