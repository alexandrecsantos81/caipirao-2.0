import axios from 'axios';
import { IPaginatedResponse } from './cliente.service'; // Reutilizando a interface

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/movimentacoes';

const api = axios.create({
  baseURL: API_URL,
} );

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERFACES ---

export interface IDespesa {
  id: number;
  descricao: string;
  valor_total: number;
  data_movimentacao: string;
  usuario_nome?: string;
}

export interface ICreateDespesa {
  descricao: string;
  valor_total: number;
}

// --- FUNÇÕES DO SERVIÇO ---

export const getDespesas = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IDespesa>> => {
  const response = await api.get('/despesas', {
    params: { pagina, limite },
  });
  return response.data;
};

export const createDespesa = async (despesaData: ICreateDespesa): Promise<IDespesa> => {
  const response = await api.post('/despesas', despesaData);
  return response.data;
};
