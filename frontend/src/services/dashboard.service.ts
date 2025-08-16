// frontend/src/services/dashboard.service.ts

import axios from 'axios';

// Configuração do cliente Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiClient = axios.create({ baseURL: `${API_URL}/dashboard` } );

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

export interface IKPIs {
  totalVendasMes: number;
  totalDespesasMes: number;
  saldoMes: number;
  totalContasAReceber: number;
  totalContasAPagar: number;
  novosClientesMes: number;
}

export interface IVendasPorDia {
  dia: string;
  total: number;
}

export interface IDespesasPorCategoria {
  name: string;
  value: number;
}

export interface IRankingProduto {
  nome: string;
  total_vendido: number;
}

export interface IRankingCliente {
  nome: string;
  total_comprado: number;
}

export interface IFluxoCaixaDiario {
  dia: string;
  receitas: number;
  despesas: number;
}

// ✅ NOVA INTERFACE para os filtros
export interface IDateFilter {
  startDate: string;
  endDate: string;
}

// --- FUNÇÕES DO SERVIÇO ---

export const getKPIs = async (): Promise<IKPIs> => {
  const response = await apiClient.get('/kpis');
  return response.data;
};

export const getVendasPorDia = async (): Promise<IVendasPorDia[]> => {
  const response = await apiClient.get('/vendas-por-dia');
  return response.data;
};

export const getDespesasPorCategoria = async (): Promise<IDespesasPorCategoria[]> => {
  const response = await apiClient.get('/despesas-por-categoria');
  return response.data;
};

export const getRankingProdutos = async (): Promise<IRankingProduto[]> => {
  const response = await apiClient.get('/ranking-produtos');
  return response.data;
};

export const getRankingClientes = async (): Promise<IRankingCliente[]> => {
  const response = await apiClient.get('/ranking-clientes');
  return response.data;
};

// ✅ FUNÇÃO ATUALIZADA para aceitar filtros
export const getFluxoCaixaDiario = async (filters: IDateFilter): Promise<IFluxoCaixaDiario[]> => {
  const response = await apiClient.get('/fluxo-caixa-diario', {
    params: filters, // Envia os filtros como query params
  });
  return response.data;
};
