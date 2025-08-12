// frontend/src/hooks/useDespesas.ts

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getDespesas, registrarDespesa, updateDespesa, deleteDespesa, IDespesa, IDespesaForm } from '../services/despesa.service';
import { IPaginatedResponse } from '@/types/common.types';

const DESPESAS_QUERY_KEY = 'despesas';

/**
 * Hook customizado para buscar a lista paginada de despesas.
 * Ele gerencia o fetching, caching, loading e estados de erro.
 * @param pagina O número da página a ser buscada.
 */
export const useDespesas = (pagina: number) => {
  return useQuery<IPaginatedResponse<IDespesa>, Error>({
    // A chave da query agora inclui a página para que cada página tenha seu próprio cache
    queryKey: [DESPESAS_QUERY_KEY, pagina],
    queryFn: () => getDespesas(pagina, 10), // Busca 10 itens por página
    placeholderData: keepPreviousData, // Mantém os dados antigos visíveis enquanto busca os novos
  });
};

/**
 * Hook customizado para criar uma nova despesa.
 */
export const useCreateDespesa = () => {
  const queryClient = useQueryClient();
  return useMutation<IDespesa, Error, IDespesaForm>({
    mutationFn: registrarDespesa,
    onSuccess: () => {
      // Invalida todas as queries de despesas para forçar a atualização
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
    },
  });
};

/**
 * Hook customizado para atualizar uma despesa.
 */
export const useUpdateDespesa = () => {
    const queryClient = useQueryClient();
    return useMutation<IDespesa, Error, { id: number; data: IDespesaForm }>({
        mutationFn: (params) => updateDespesa(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
        }
    });
};

/**
 * Hook customizado para deletar uma despesa.
 */
export const useDeleteDespesa = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, number>({
        mutationFn: deleteDespesa,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
        }
    });
};
