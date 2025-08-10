// frontend/src/hooks/useDespesas.ts

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getDespesas, createDespesa, IDespesa, ICreateDespesa, IPaginatedResponse } from '../services/despesas.service';

// A "chave" que o React Query usará para identificar e cachear os dados de despesas.
const DESPESAS_QUERY_KEY = ['despesas'];

/**
 * Custom Hook para buscar a lista de despesas.
 * Ele gerencia o fetching, caching, loading e estados de erro.
 */
export const useDespesas = (pagina: number, limite: number) => {
  return useQuery<IPaginatedResponse<IDespesa>, Error>({
    // A chave da query agora inclui a página e o limite para cachear cada página individualmente
    queryKey: ['despesas', pagina, limite],
    
    // A queryFn agora usa o contexto para pegar os parâmetros da queryKey
    queryFn: ({ queryKey }) => {
      const [, page, limit] = queryKey;
      return getDespesas(page as number, limit as number);
    },
    
    // Mantém os dados da página anterior visíveis enquanto a nova página carrega
    placeholderData: keepPreviousData,
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
    mutationFn: createDespesa, // A função que realmente faz a chamada à API
    
    // Em caso de sucesso na criação...
    onSuccess: () => {
      // Invalida a query de 'despesas'. Isso diz ao React Query:
      // "Os dados que você tem em cache para 'despesas' estão desatualizados.
      // Busque-os novamente na próxima vez que forem necessários."
      // Isso garante que nossa tabela de despesas seja atualizada automaticamente.
      queryClient.invalidateQueries({ queryKey: DESPESAS_QUERY_KEY });
    },
  });
};
