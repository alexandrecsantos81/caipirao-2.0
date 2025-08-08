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

interface IProdutoVenda {
  produto_id: number;
  quantidade: number;
  valor_unitario: number;
  nome: string;
}

export interface IVenda {
  id: number;
  cliente_nome: string;
  usuario_nome: string;
  valor_total: number;
  data_movimentacao: string;
  produtos: IProdutoVenda[];
}

// Interface para criar uma nova venda
export interface INovaVenda {
  cliente_id: number;
  produtos: { produto_id: number; quantidade: number; valor_unitario: number }[];
  valor_total: number; // <<< CORREÇÃO: Adicionando o campo que faltava
}

export const getVendas = async (pagina = 1, limite = 10): Promise<IPaginatedResponse<IVenda>> => {
  const response = await apiClient.get('/movimentacoes/vendas', { params: { pagina, limite } });
  return response.data;
};

export const createVenda = async (novaVenda: INovaVenda): Promise<IVenda> => {
  const response = await apiClient.post('/movimentacoes/vendas', novaVenda);
  return response.data;
};
