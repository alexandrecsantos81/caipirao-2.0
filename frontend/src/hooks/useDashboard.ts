// frontend/src/hooks/useDashboard.ts (COMPLETO E CORRIGIDO)

import { useQuery } from '@tanstack/react-query';
import { 
    getKPIs, 
    getVendasPorDia, 
    getRankingProdutos,
    getRankingClientes,
    IKPIs, 
    IVendasPorDia, 
    IRankingProduto,
    IRankingCliente,
} from '../services/dashboard.service';
import { getContasAPagar, IContasAPagar } from '../services/despesa.service';

// --- INÍCIO DA CORREÇÃO ---
// Manter as chaves como constantes fora do hook é a melhor prática.
const DASHBOARD_QUERIES = {
  kpis: {
    queryKey: ['dashboardKPIs'],
    queryFn: getKPIs,
  },
  vendasPorDia: {
    queryKey: ['dashboardVendasPorDia'],
    queryFn: getVendasPorDia,
  },
  rankingProdutos: {
    queryKey: ['dashboardRankingProdutos'],
    queryFn: getRankingProdutos,
  },
  rankingClientes: {
    queryKey: ['dashboardRankingClientes'],
    queryFn: getRankingClientes,
  },
  contasAPagar: {
    queryKey: ['dashboardContasAPagar'],
    queryFn: getContasAPagar,
  },
};
// --- FIM DA CORREÇÃO ---

export const useDashboardData = () => {
  const staleTime = 1000 * 60 * 5; // 5 minutos

  const kpisQuery = useQuery<IKPIs, Error>({
    ...DASHBOARD_QUERIES.kpis, // Usa a chave e a função estáveis
    staleTime,
  });

  const vendasPorDiaQuery = useQuery<IVendasPorDia[], Error>({
    ...DASHBOARD_QUERIES.vendasPorDia, // Usa a chave e a função estáveis
    staleTime,
  });

  const rankingProdutosQuery = useQuery<IRankingProduto[], Error>({
    ...DASHBOARD_QUERIES.rankingProdutos, // Usa a chave e a função estáveis
    staleTime,
  });

  const rankingClientesQuery = useQuery<IRankingCliente[], Error>({
    ...DASHBOARD_QUERIES.rankingClientes, // Usa a chave e a função estáveis
    staleTime,
  });

  const contasAPagarQuery = useQuery<IContasAPagar[], Error>({
    ...DASHBOARD_QUERIES.contasAPagar, // Usa a chave e a função estáveis
    staleTime,
  });

  return {
    kpisQuery,
    vendasPorDiaQuery,
    rankingProdutosQuery,
    rankingClientesQuery,
    contasAPagarQuery,
  };
};
