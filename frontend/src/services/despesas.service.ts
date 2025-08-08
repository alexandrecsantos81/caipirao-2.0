// frontend/src/services/despesas.service.ts

import axios from 'axios';
import { IPaginatedResponse } from './cliente.service'; // Reutilizando a interface de paginação

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

// Interface para o objeto Despesa retornado pela API
export interface IDespesa {
  id: number;
  descricao: string;
  valor_total: number;
  // CORREÇÃO: Alterado de 'data_movimentacao' para 'data_venda' para corresponder ao backend.
  data_venda: string; 
  usuario_nome?: string;
}

// Interface para criar uma nova despesa
export interface ICreateDespesa {
  descricao: string;
  valor_total: number;
  data_movimentacao?: string; // Opcional, para consistência
}

// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca uma lista paginada de despesas.
 */
export const getDespesas = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IDespesa>> => {
  // A rota no backend é /movimentacoes/despesas
  const response = await apiClient.get('/movimentacoes/despesas', {
    params: { pagina, limite },
  });
  return response.data;
};

/**
 * @description Envia os dados de uma nova despesa para a API.
 */
export const createDespesa = async (despesaData: ICreateDespesa): Promise<IDespesa> => {
  // A rota no backend é /movimentacoes/despesas
  const response = await apiClient.post('/movimentacoes/despesas', despesaData);
  return response.data;
};
