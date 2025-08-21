import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { 
  getSalesSummary, 
  getProductRanking,
  getClientRanking,
  getClientAnalysis,
  getSellerProductivity,
  getStockEntriesReport,
  getEmployeeProductivityReport, // <-- Importar a nova função
  IReportDateFilter,
  ISalesSummaryResponse,
  IProductRankingItem,
  IClientRankingItem,
  IClientAnalysisResponse,
  ISellerProductivityItem,
  IStockEntryReportItem,
  IEmployeeProductivityItem // <-- Importar a nova interface
} from '@/services/report.service';

const REPORTS_QUERY_KEYS = {
  salesSummary: (filters: IReportDateFilter) => ['reports', 'salesSummary', filters],
  productRanking: (filters: IReportDateFilter & { orderBy: string }) => ['reports', 'productRanking', filters],
  clientRanking: (filters: IReportDateFilter) => ['reports', 'clientRanking', filters],
  clientAnalysis: () => ['reports', 'clientAnalysis'],
  sellerProductivity: (filters: IReportDateFilter) => ['reports', 'sellerProductivity', filters],
  stockEntries: (filters: IReportDateFilter) => ['reports', 'stockEntries', filters],
  employeeProductivity: (filters: IReportDateFilter) => ['reports', 'employeeProductivity', filters], // <-- Nova chave
};

export const useSalesSummary = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<ISalesSummaryResponse, Error>({
    queryKey: REPORTS_QUERY_KEYS.salesSummary(filters),
    queryFn: () => getSalesSummary(filters),
    enabled,
    placeholderData: keepPreviousData, 
  });
};

export const useProductRanking = (filters: IReportDateFilter & { orderBy: 'valor' | 'quantidade' }, enabled: boolean = true) => {
  return useQuery<IProductRankingItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.productRanking(filters),
    queryFn: () => getProductRanking(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useClientRanking = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<IClientRankingItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.clientRanking(filters),
    queryFn: () => getClientRanking(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useClientAnalysis = (enabled: boolean = true) => {
  return useQuery<IClientAnalysisResponse, Error>({
    queryKey: REPORTS_QUERY_KEYS.clientAnalysis(),
    queryFn: getClientAnalysis,
    enabled,
    staleTime: 1000 * 60 * 15,
  });
};

export const useSellerProductivity = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<ISellerProductivityItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.sellerProductivity(filters),
    queryFn: () => getSellerProductivity(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useStockEntriesReport = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<IStockEntryReportItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.stockEntries(filters),
    queryFn: () => getStockEntriesReport(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};

// NOVO HOOK PARA PRODUTIVIDADE DE FUNCIONÁRIOS
export const useEmployeeProductivity = (filters: IReportDateFilter, enabled: boolean = true) => {
  return useQuery<IEmployeeProductivityItem[], Error>({
    queryKey: REPORTS_QUERY_KEYS.employeeProductivity(filters),
    queryFn: () => getEmployeeProductivityReport(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
};
