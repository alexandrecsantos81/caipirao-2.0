import axios from 'axios';
import { IPaginatedResponse } from './cliente.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: API_URL } );

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interface atualizada para refletir a estrutura CORRETA do banco de dados
export interface IProduto {
  id: number;
  nome: string;
  unidade_medida: string;
  price: number; // <<< CORREÇÃO PRINCIPAL: de 'preco' para 'price'
  quantidade_em_estoque: number;
  criado_em?: string;
}

export type IProdutoForm = Omit<IProduto, 'id' | 'quantidade_em_estoque' | 'criado_em'>;

// Funções do serviço (sem alterações na lógica, apenas nos tipos)
export const getProdutos = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IProduto>> => {
  const response = await apiClient.get('/produtos', { params: { pagina, limite } });
  return response.data;
};
export const createProduto = async (produtoData: IProdutoForm): Promise<IProduto> => {
  const response = await apiClient.post('/produtos', produtoData);
  return response.data;
};
export const updateProduto = async (id: number, produtoData: IProdutoForm): Promise<IProduto> => {
  const response = await apiClient.put(`/produtos/${id}`, produtoData);
  return response.data;
};
export const deleteProduto = async (id: number): Promise<void> => {
  await apiClient.delete(`/produtos/${id}`);
};
export const addEstoqueProduto = async ({ id, quantidade }: { id: number; quantidade: number }): Promise<IProduto> => {
  const response = await apiClient.post(`/produtos/${id}/adicionar-estoque`, { quantidade });
  return response.data;
};
