import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types'; // Reutilizaremos a interface de paginação

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/receitas-externas` } );

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

export interface IReceitaExterna {
  id: number;
  descricao: string;
  valor: number;
  data_recebimento: string;
  categoria?: string | null;
  utilizador_id: number;
  data_criacao: string;
}

export type IReceitaExternaForm = Omit<IReceitaExterna, 'id' | 'utilizador_id' | 'data_criacao'>;


// --- FUNÇÕES DO SERVIÇO ---

/**
 * @description Busca a lista de receitas externas, com filtro opcional de data.
 */
export const getReceitasExternas = async (startDate?: string, endDate?: string): Promise<IReceitaExterna[]> => {
  const response = await apiClient.get('/', {
    params: { startDate, endDate },
  });
  return response.data;
};

/**
 * @description Cria uma nova receita externa.
 */
export const createReceitaExterna = async (data: IReceitaExternaForm): Promise<IReceitaExterna> => {
  const response = await apiClient.post('/', data);
  return response.data;
}

/**
 * @description Atualiza os dados de uma receita externa existente.
 */
export const updateReceitaExterna = async ({ id, data }: { id: number, data: IReceitaExternaForm }): Promise<IReceitaExterna> => {
  const response = await apiClient.put(`/${id}`, data);
  return response.data;
}

/**
 * @description Deleta uma receita externa.
 */
export const deleteReceitaExterna = async (id: number): Promise<void> => {
  await apiClient.delete(`/${id}`);
}
