import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getDespesas, registrarDespesa, updateDespesa, deleteDespesa, IDespesa, IDespesaForm } from '../services/despesa.service';
import { IPaginatedResponse } from '@/types/common.types';
import { useToast } from '@chakra-ui/react';

// Chave principal para as queries de despesas, para fácil invalidação.
const DESPESAS_QUERY_KEY = 'despesas';

/**
 * Hook customizado para buscar a lista paginada de despesas.
 * @param pagina O número da página atual.
 * @param termoBusca O termo de busca (debounced).
 */
export const useGetDespesas = (pagina: number, termoBusca: string) => {
  return useQuery<IPaginatedResponse<IDespesa>, Error>({
    queryKey: [DESPESAS_QUERY_KEY, pagina, termoBusca],
    queryFn: () => getDespesas(pagina, 50, termoBusca),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook customizado para criar ou atualizar uma despesa.
 * Centraliza a lógica de mutação e feedback ao usuário.
 */
export const useSaveDespesa = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { despesaData: IDespesaForm, id?: number }) =>
      params.id 
        ? updateDespesa({ id: params.id, data: params.despesaData }) 
        : registrarDespesa(params.despesaData),
    onSuccess: (_, variables) => {
      // Invalida todas as queries relacionadas para forçar a atualização dos dados.
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      
      toast({
        title: `Despesa ${variables.id ? 'atualizada' : 'registrada'}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar despesa",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

/**
 * Hook customizado para deletar uma despesa.
 */
export const useDeleteDespesa = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, Error, number>({
    mutationFn: deleteDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: 'Despesa excluída!', status: 'success' });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir despesa", description: error.response?.data?.error || error.message, status: "error" });
    }
  });
};
