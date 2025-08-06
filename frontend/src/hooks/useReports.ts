// frontend/src/hooks/useReports.ts

import { useQuery } from '@tanstack/react-query';
import { getFinancialSummary, IFinancialSummary } from '../services/reports.service';

// Chave única para o cache desta query
const SUMMARY_QUERY_KEY = ['financialSummary'];

/**
 * Custom Hook para buscar os dados do resumo financeiro.
 * Gerencia fetching, caching, loading e estados de erro.
 */
export const useFinancialSummary = () => {
  return useQuery<IFinancialSummary, Error>({
    queryKey: SUMMARY_QUERY_KEY,
    queryFn: getFinancialSummary,
    // Opções adicionais que podem ser úteis para dados financeiros:
    staleTime: 1000 * 60 * 5, // Considera os dados "frescos" por 5 minutos
    refetchOnWindowFocus: true, // Busca os dados novamente quando o usuário volta para a aba
  });
};
