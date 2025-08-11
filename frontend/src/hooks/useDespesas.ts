import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
// CORREÇÃO: Importar tudo do local correto
import { getDespesas, registrarDespesa as createDespesa, IDespesa, IDespesaForm as ICreateDespesa } from '../services/despesa.service';
import { IPaginatedResponse } from '@/types/common.types'; // Importação centralizada

const DESPESAS_QUERY_KEY = ['despesas'];

/**
 * Custom Hook para buscar a lista de despesas.
 * Ele gerencia o fetching, caching, loading e estados de erro.
 */
export const useDespesas = () => { // CORREÇÃO: Removidos os parâmetros de paginação que não são mais usados aqui
  return useQuery<IDespesa[], Error>({ // CORREÇÃO: A query agora retorna um array simples de IDespesa
    queryKey: DESPESAS_QUERY_KEY,
    queryFn: getDespesas, // A função getDespesas não precisa mais de parâmetros
  });
};

/**
 * Custom Hook para criar uma nova despesa.
 * Ele gerencia o estado da mutação (criação) e atualiza a lista de despesas
 * automaticamente em caso de sucesso.
 */
export const useCreateDespesa = () => {
  const queryClient = useQueryClient();

  return useMutation<IDespesa, Error, ICreateDespesa>({
    mutationFn: createDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESPESAS_QUERY_KEY });
    },
  });
};
