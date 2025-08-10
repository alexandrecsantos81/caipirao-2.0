// frontend/src/services/despesas.service.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL } );

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

/**
 * Interface genérica para respostas paginadas da API.
 * Exportada para ser reutilizada por outros hooks.
 */
export interface IPaginatedResponse<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// Interface para o objeto Despesa retornado pela API
export interface IDespesa {
  id: number;
  descricao: string;
  valor_total: number;
  data_venda: string;
  usuario_nome?: string;
}

// Interface para criar uma nova despesa
export interface ICreateDespesa {
  descricao: string;
  valor_total: number;
  data_movimentacao?: string;
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca uma lista paginada de despesas.
 */
export const getDespesas = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IDespesa>> => {
  const response = await apiClient.get('/movimentacoes/despesas', {
    params: { pagina, limite },
  });
  return response.data;
};

/**
 * @description Envia os dados de uma nova despesa para a API.
 */
export const createDespesa = async (despesaData: ICreateDespesa): Promise<IDespesa> => {
  const response = await apiClient.post('/movimentacoes/despesas', despesaData);
  return response.data;
};
