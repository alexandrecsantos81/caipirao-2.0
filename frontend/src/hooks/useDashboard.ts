import { useQuery } from '@tanstack/react-query';
import { 
    getKPIs, 
    getVendasPorDia, 
    getRankingProdutos,
    getRankingClientes,
    IKPIs, 
    IVendasPorDia, 
    IRankingProduto,
    IRankingCliente
} from '../services/dashboard.service';
// GARANTIR QUE ESTES IMPORTS EXISTEM
import { getContasAPagar, IContasAPagar } from '../services/despesa.service';

const DASHBOARD_KPI_QUERY_KEY = ['dashboardKPIs'];
const DASHBOARD_VENDAS_DIA_QUERY_KEY = ['dashboardVendasPorDia'];
const DASHBOARD_RANKING_PRODUTOS_QUERY_KEY = ['dashboardRankingProdutos'];
const DASHBOARD_RANKING_CLIENTES_QUERY_KEY = ['dashboardRankingClientes'];
// GARANTIR QUE ESTA CHAVE EXISTE
const DASHBOARD_CONTAS_PAGAR_QUERY_KEY = ['dashboardContasAPagar'];

export const useDashboardData = () => {
  const kpisQuery = useQuery<IKPIs, Error>({
    queryKey: DASHBOARD_KPI_QUERY_KEY,
    queryFn: getKPIs,
    staleTime: 1000 * 60 * 5,
  });

  const vendasPorDiaQuery = useQuery<IVendasPorDia[], Error>({
    queryKey: DASHBOARD_VENDAS_DIA_QUERY_KEY,
    queryFn: getVendasPorDia,
    staleTime: 1000 * 60 * 5,
  });

  const rankingProdutosQuery = useQuery<IRankingProduto[], Error>({
    queryKey: DASHBOARD_RANKING_PRODUTOS_QUERY_KEY,
    queryFn: getRankingProdutos,
    staleTime: 1000 * 60 * 5,
  });

  const rankingClientesQuery = useQuery<IRankingCliente[], Error>({
    queryKey: DASHBOARD_RANKING_CLIENTES_QUERY_KEY,
    queryFn: getRankingClientes,
    staleTime: 1000 * 60 * 5,
  });

  // GARANTIR QUE ESTA QUERY ESTÁ PRESENTE
  const contasAPagarQuery = useQuery<IContasAPagar[], Error>({
    queryKey: DASHBOARD_CONTAS_PAGAR_QUERY_KEY,
    queryFn: getContasAPagar,
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpisQuery,
    vendasPorDiaQuery,
    rankingProdutosQuery,
    rankingClientesQuery,
    contasAPagarQuery, // <-- GARANTIR QUE ESTÁ SENDO EXPORTADA
  };
};
