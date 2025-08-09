import { useQuery } from '@tanstack/react-query';
import { getKPIs, getVendasPorDia, IKPIs, IVendasPorDia } from '../services/dashboard.service';

// Chaves de query para o cache do React Query
const DASHBOARD_KPI_QUERY_KEY = ['dashboardKPIs'];
const DASHBOARD_VENDAS_DIA_QUERY_KEY = ['dashboardVendasPorDia'];

/**
 * Hook customizado para buscar todos os dados necessários para o Dashboard.
 * Ele retorna duas queries separadas, uma para os KPIs e outra para os dados do gráfico.
 * Isso permite que cada parte da UI reaja independentemente ao seu próprio estado de dados.
 */
export const useDashboardData = () => {
  
  // Query para buscar os dados dos cards (KPIs)
  const kpisQuery = useQuery<IKPIs, Error>({
    queryKey: DASHBOARD_KPI_QUERY_KEY,
    queryFn: getKPIs,
    staleTime: 1000 * 60 * 5, // Considera os dados "frescos" por 5 minutos
  });

  // Query para buscar os dados do gráfico de vendas
  const vendasPorDiaQuery = useQuery<IVendasPorDia[], Error>({
    queryKey: DASHBOARD_VENDAS_DIA_QUERY_KEY,
    queryFn: getVendasPorDia,
    staleTime: 1000 * 60 * 5, // Também considera os dados frescos por 5 minutos
  });

  return {
    kpisQuery,
    vendasPorDiaQuery,
  };
};
