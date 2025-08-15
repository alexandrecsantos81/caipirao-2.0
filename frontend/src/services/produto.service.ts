import axios from 'axios';
import { IPaginatedResponse } from '@/types/common.types';

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

// Interface para a estrutura de um produto
export interface IProduto {
  id: number;
  nome: string;
  unidade_medida: string;
  price: number;
  quantidade_em_estoque: number;
  custo_medio?: number;
  data_criacao?: string; // ✅ Renomeado de 'criado_em' para 'data_criacao' para consistência
}

// Interface para o formulário de criação/edição de produto
export type IProdutoForm = Omit<IProduto, 'id' | 'quantidade_em_estoque' | 'custo_medio' | 'data_criacao'>;

// Interface para o formulário de entrada de estoque
export interface IEntradaEstoqueForm {
  data_entrada: string;
  quantidade_adicionada: number;
  custo_total: number;
  observacao?: string;
}

// --- FUNÇÕES DO SERVIÇO ---

export const getProdutos = async (pagina = 1, limite = 50): Promise<IPaginatedResponse<IProduto>> => { // ✅ Limite padrão atualizado para 50
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

export const registrarEntradaEstoque = async ({ id, data }: { id: number; data: IEntradaEstoqueForm }): Promise<IProduto> => {
  const response = await apiClient.post(`/produtos/${id}/entradas-estoque`, data);
  return response.data;
};
