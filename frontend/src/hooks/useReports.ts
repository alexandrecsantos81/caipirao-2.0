// src/hooks/useReports.ts

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { 
  getSalesSummary, 
  getProductRanking,
  getClientRanking,
  getClientAnalysis,
  getSellerProductivity, // Importar a nova função
  IReportDateFilter,
  ISalesSummaryResponse,
  IProductRankingItem,
  IClientRankingItem,
  IClientAnalysisResponse,
  ISellerProductivityItem // Importar a nova interface
} from '@/services/report.service';

const REPORTS_QUERY_KEYS = {
  salesSummary: (filters: IReportDateFilter) => ['reports', 'salesSummary', filters],
  productRanking: (filters: IReportDateFilter & { orderBy: string }) => ['reports', 'productRanking', filters],
  clientRanking: (filters: IReportDateFilter) => ['reports', 'clientRanking', filters],
  clientAnalysis: () => ['reports', 'clientAnalysis'],
  // Adicionar a nova chave de query para a produtividade
  sellerProductivity: (filters: IReportDateFilter) => ['reports', 'sellerProductivity', filters],
};

/**
 * Hook customizado para buscar os dados do resumo de vendas.
 */
export const useSalesSummary = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<ISalesSummaryResponse, Error>({
    queryKey: REPORTS_QUERY_KEYS.salesSummary(filters),
    queryFn: () => getSalesSummary(filters),
    enabled,
    placeholderData: keepPreviousData, 
  });
};

/**
 * Hook customizado para buscar os dados do ranking de produtos.
 */
export const useProductRanking = (filters: IReportDateFilter & { orderBy: 'valor' | 'quantidade' }, enabled: boolean = true) => {
  return useQuery<IProductRankingItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.productRanking(filters),
    queryFn: () => getProductRanking(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook customizado para buscar os dados do ranking de clientes.
 */
export const useClientRanking = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<IClientRankingItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.clientRanking(filters),
    queryFn: () => getClientRanking(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook customizado para buscar a lista de clientes ativos e inativos.
 */
export const useClientAnalysis = (enabled: boolean = true) => {
  return useQuery<IClientAnalysisResponse, Error>({
    queryKey: REPORTS_QUERY_KEYS.clientAnalysis(),
    queryFn: getClientAnalysis,
    enabled,
    staleTime: 1000 * 60 * 15,
  });
};

/**
 * Hook customizado para buscar os dados de produtividade dos vendedores.
 * @param filters - Objeto com startDate e endDate.
 * @param enabled - Booleano para controlar se a query deve ser executada.
 */
export const useSellerProductivity = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<ISellerProductivityItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.sellerProductivity(filters),
    queryFn: () => getSellerProductivity(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};
