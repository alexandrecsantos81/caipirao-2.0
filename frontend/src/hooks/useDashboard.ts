import { useQuery } from '@tanstack/react-query';
import { 
    getKPIs, 
    getVendasPorDia, 
    getRankingProdutos,
    getRankingClientes, // A importação agora funciona
    IKPIs, 
    IVendasPorDia, 
    IRankingProduto,
    IRankingCliente,
} from '../services/dashboard.service';
import { getContasAPagar, IContasAPagar } from '../services/despesa.service';

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

export const useDashboardData = () => {
  const staleTime = 1000 * 60 * 5; // 5 minutos

  const kpisQuery = useQuery<IKPIs, Error>({
    ...DASHBOARD_QUERIES.kpis,
    staleTime,
  });

  const vendasPorDiaQuery = useQuery<IVendasPorDia[], Error>({
    ...DASHBOARD_QUERIES.vendasPorDia,
    staleTime,
  });

  const rankingProdutosQuery = useQuery<IRankingProduto[], Error>({
    ...DASHBOARD_QUERIES.rankingProdutos,
    staleTime,
  });

  const rankingClientesQuery = useQuery<IRankingCliente[], Error>({
    ...DASHBOARD_QUERIES.rankingClientes,
    staleTime,
  });

  const contasAPagarQuery = useQuery<IContasAPagar[], Error>({
    ...DASHBOARD_QUERIES.contasAPagar,
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
