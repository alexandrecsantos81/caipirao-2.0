import { useQuery } from '@tanstack/react-query';
import { getKPIs, getVendasPorDia, IKPIs, IVendasPorDia } from '../services/dashboard.service';
import { getContasAPagar, IContasAPagar } from '../services/despesa.service';

const DASHBOARD_KPI_QUERY_KEY = ['dashboardKPIs'];
const DASHBOARD_VENDAS_DIA_QUERY_KEY = ['dashboardVendasPorDia'];
const DASHBOARD_CONTAS_PAGAR_QUERY_KEY = ['dashboardContasAPagar'];

export const useDashboardData = () => {
  const kpisQuery = useQuery<IKPIs, Error>({
    queryKey: DASHBOARD_KPI_QUERY_KEY,
    queryFn: getKPIs,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const vendasPorDiaQuery = useQuery<IVendasPorDia[], Error>({
    queryKey: DASHBOARD_VENDAS_DIA_QUERY_KEY,
    queryFn: getVendasPorDia,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // A função getContasAPagar busca um array simples, então a tipagem aqui é IContasAPagar[]
  const contasAPagarQuery = useQuery<IContasAPagar[], Error>({
    queryKey: DASHBOARD_CONTAS_PAGAR_QUERY_KEY,
    queryFn: getContasAPagar,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    kpisQuery,
    vendasPorDiaQuery,
    contasAPagarQuery,
  };
};//marcação para commit gemini