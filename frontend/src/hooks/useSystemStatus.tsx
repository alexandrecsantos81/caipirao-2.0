// frontend/src/hooks/useSystemStatus.tsx

import { useQuery } from '@tanstack/react-query';
import { getStatusSistema, IStatusSistema } from '@/services/sistema.service';

export const useSystemStatus = () => {
  const { data, isLoading, isError } = useQuery<IStatusSistema>({
    queryKey: ['statusSistema'],
    queryFn: getStatusSistema,
    // Configurações importantes:
    refetchOnWindowFocus: true, // Re-verifica quando o usuário volta para a aba
    staleTime: 1000 * 60, // Considera o dado "fresco" por 1 minuto
    refetchInterval: 1000 * 60 * 5, // Re-verifica a cada 5 minutos em background
  });

  return {
    emManutencao: data?.emManutencao ?? false,
    isLoadingStatus: isLoading,
    isErrorStatus: isError,
  };
};
