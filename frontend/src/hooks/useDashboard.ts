import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
    getDespesas, 
    registrarDespesa as createDespesa, 
    IDespesa, 
    IDespesaForm as ICreateDespesa 
} from '../services/despesa.service';
import { IPaginatedResponse } from '@/types/common.types';

const DESPESAS_QUERY_KEY = 'despesas';

/**
 * Custom Hook para buscar a lista PAGINADA de despesas.
 * Ele gerencia o fetching, caching, loading e estados de erro.
 * @param pagina O número da página a ser buscada.
 */
export const useDespesas = (pagina: number) => {
  return useQuery<IPaginatedResponse<IDespesa>, Error>({
    // A query key agora inclui a página para que o cache funcione corretamente por página
    queryKey: [DESPESAS_QUERY_KEY, pagina],
    // A queryFn agora chama getDespesas com os parâmetros de paginação
    queryFn: () => getDespesas(pagina, 10),
    // Mantém os dados antigos visíveis enquanto a nova página carrega, evitando piscar a tela
    placeholderData: keepPreviousData,
  });
};

/**
 * Custom Hook para criar uma nova despesa.
 * Ele invalida a query de despesas para forçar a atualização da lista após a criação.
 */
export const useCreateDespesa = () => {
  const queryClient = useQueryClient();
  return useMutation<IDespesa, Error, ICreateDespesa>({
    mutationFn: createDespesa,
    onSuccess: () => {
      // Invalida todas as queries que começam com ['despesas'], limpando o cache de todas as páginas
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
    },
  });
};