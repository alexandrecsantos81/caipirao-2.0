import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL } );

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

export type UserProfile = 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN';
export type UserStatus = 'ATIVO' | 'INATIVO';

export interface IUtilizador {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  perfil: UserProfile | 'PENDENTE';
  status: UserStatus;
}

export interface IUpdateUtilizadorForm {
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  perfil: UserProfile;
  status: UserStatus;
}

export interface ICreateUtilizadorForm {
  nome: string;
  email: string;
  telefone: string;
  nickname: string;
  senha: string;
  perfil: UserProfile;
}

export interface ISolicitacaoAcessoForm {
  nome: string;
  email: string;
  telefone: string;
}

export interface IAtivacaoResponse {
  message: string;
  utilizador: IUtilizador;
  senhaProvisoria: string;
}

// --- FUNÇÕES DO SERVIÇO ---

export const getUtilizadores = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IUtilizador>> => {
  const response = await apiClient.get('/utilizadores', {
    params: { pagina, limite }
  });
  return response.data;
};

export const createUtilizador = async (data: ICreateUtilizadorForm): Promise<IUtilizador> => {
  const response = await apiClient.post('/utilizadores', data);
  return response.data;
};

export const solicitarAcesso = async (data: ISolicitacaoAcessoForm): Promise<any> => {
  const response = await axios.post(`${API_URL}/utilizadores/solicitar-acesso`, data);
  return response.data;
};

export const ativarUtilizador = async ({ id, perfil }: { id: number, perfil: string }): Promise<IAtivacaoResponse> => {
  const response = await apiClient.put(`/utilizadores/${id}/ativar`, { perfil });
  return response.data;
};

export const updateUtilizador = async ({ id, data }: { id: number, data: IUpdateUtilizadorForm }): Promise<IUtilizador> => {
  const response = await apiClient.put(`/utilizadores/${id}`, data);
  return response.data;
};

export const deleteUtilizador = async (id: number): Promise<void> => {
  await apiClient.delete(`/utilizadores/${id}`);
};