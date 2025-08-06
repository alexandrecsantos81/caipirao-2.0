// frontend/src/hooks/useDespesas.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDespesas, createDespesa, ICreateDespesa, IDespesa } from '../services/despesas.service';

// A "chave" que o React Query usará para identificar e cachear os dados de despesas.
const DESPESAS_QUERY_KEY = ['despesas'];

/**
 * Custom Hook para buscar a lista de despesas.
 * Ele gerencia o fetching, caching, loading e estados de erro.
 */
export const useDespesas = () => {
  return useQuery<IDespesa[], Error>({
    queryKey: DESPESAS_QUERY_KEY,
    queryFn: getDespesas, // A função que realmente busca os dados
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
    mutationFn: createDespesa, // A função que envia os dados para a API
    
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
