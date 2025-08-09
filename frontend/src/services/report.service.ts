// src/services/report.service.ts

import axios from 'axios';

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

export interface IReportDateFilter {
  startDate: string;
  endDate: string;
}

export interface ISalesSummaryKPIs {
  faturamentoTotal: number;
  pesoTotalVendido: number;
  totalTransacoes: number;
}

export interface ISalesEvolution {
  data: string;
  faturamento: number;
}

export interface ISalesSummaryResponse {
  kpis: ISalesSummaryKPIs;
  evolucaoVendas: ISalesEvolution[];
}

export interface IProductRankingItem {
  produtoId: number;
  nome: string;
  valorTotal: number;
  quantidadeTotal: number;
}

export interface IClientRankingItem {
  clienteId: number;
  nome: string;
  telefone: string;
  totalCompras: number;
  valorTotalGasto: number;
}

export interface IClientAnalysisItem {
  clienteId: number;
  nome: string;
  telefone: string;
  data_ultima_compra: string | null;
  status: 'Ativo' | 'Inativo';
}

export interface IClientAnalysisResponse {
  ativos: IClientAnalysisItem[];
  inativos: IClientAnalysisItem[];
}

// NOVA INTERFACE PARA A PRODUTIVIDADE DO VENDEDOR
export interface ISellerProductivityItem {
  vendedorId: number;
  nome: string;
  numeroDeVendas: number;
  valorTotalVendido: number;
}


// --- FUNÇÕES DO SERVIÇO ---

export const getSalesSummary = async (filter: IReportDateFilter): Promise<ISalesSummaryResponse> => {
  const response = await apiClient.get('/reports/sales-summary', {
    params: filter,
  });
  return response.data;
};

export const getProductRanking = async (filter: IReportDateFilter & { orderBy: 'valor' | 'quantidade' }): Promise<IProductRankingItem[]> => {
  const response = await apiClient.get('/reports/product-ranking', {
    params: filter,
  });
  return response.data;
};

export const getClientRanking = async (filter: IReportDateFilter): Promise<IClientRankingItem[]> => {
  const response = await apiClient.get('/reports/client-ranking', {
    params: filter,
  });
  return response.data;
};

export const getClientAnalysis = async (): Promise<IClientAnalysisResponse> => {
  const response = await apiClient.get('/reports/client-analysis');
  return response.data;
};

// NOVA FUNÇÃO PARA BUSCAR A PRODUTIVIDADE DOS VENDEDORES
/**
 * @description Busca o ranking de produtividade dos vendedores.
 * @param filter - Objeto com as datas de início e fim.
 */
export const getSellerProductivity = async (filter: IReportDateFilter): Promise<ISellerProductivityItem[]> => {
  const response = await apiClient.get('/reports/seller-productivity', {
    params: filter,
  });
  return response.data;
};
