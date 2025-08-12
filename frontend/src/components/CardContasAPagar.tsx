import {
  Box, Button, Flex, Heading, Spinner, Text, VStack, HStack, useDisclosure, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Input, Select
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

import { IContasAPagar, quitarDespesa, IQuitacaoData, getContasAPagar } from '../services/despesa.service';
import { getUtilizadores, IUtilizador } from '../services/utilizador.service';
import { useAuth } from '../hooks/useAuth';
import { IPaginatedResponse } from '@/types/common.types';

export const CardContasAPagar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDespesa, setSelectedDespesa] = useState<IContasAPagar | null>(null);
  const { register, handleSubmit, setValue } = useForm<IQuitacaoData>();

  const { data: contas, isLoading, isError } = useQuery<IContasAPagar[]>({
    queryKey: ['contasAPagar'],
    queryFn: getContasAPagar,
  });

  // ✅ CORREÇÃO AQUI: A query agora sabe que a API retorna 'IPaginatedResponse'
  // e o 'select' transforma o resultado final em um array simples 'IUtilizador[]'.
  const { data: admins, isLoading: isLoadingAdmins } = useQuery<IPaginatedResponse<IUtilizador>, Error, IUtilizador[]>({
    queryKey: ['utilizadores', 1, 1000],
    queryFn: () => getUtilizadores(1, 1000),
    select: (data) => data.dados.filter(u => u.perfil === 'ADMIN'),
    enabled: isOpen,
  });

  const quitacaoMutation = useMutation({
    mutationFn: quitarDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: 'Despesa quitada com sucesso!', status: 'success' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao quitar despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleQuitarClick = (despesa: IContasAPagar) => {
    setSelectedDespesa(despesa);
    setValue('data_pagamento', new Date().toISOString().split('T')[0]);
    if (user) setValue('responsavel_pagamento_id', user.id);
    onOpen();
  };

  const onConfirmarQuitacao: SubmitHandler<IQuitacaoData> = (data) => {
    if (selectedDespesa) {
      const finalData = {
        ...data,
        responsavel_pagamento_id: Number(data.responsavel_pagamento_id)
      };
      quitacaoMutation.mutate({ id: selectedDespesa.id, quitacaoData: finalData });
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <Box p={5} borderWidth={1} borderRadius={8} boxShadow="sm" h="100%">
      <Heading size="md" mb={4}>Contas a Pagar (Próximos 5 dias)</Heading>
      {isLoading && <Spinner />}
      {isError && <Text color="red.500">Erro ao carregar contas a pagar.</Text>}
      {!isLoading && !isError && (
        <VStack spacing={4} align="stretch">
          {contas && contas.length > 0 ? (
            contas.map((conta) => (
              <Flex key={conta.id} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="md">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">{conta.nome_fornecedor || 'Despesa sem fornecedor'}</Text>
                  <Text fontSize="sm">Vence em: {formatarData(conta.data_vencimento)}</Text>
                </VStack>
                <HStack>
                  <Text fontWeight="bold" color="red.500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                  </Text>
                  {user?.perfil === 'ADMIN' && (
                    <Button colorScheme="green" size="sm" onClick={() => handleQuitarClick(conta)}>Quitar</Button>
                  )}
                </HStack>
              </Flex>
            ))
          ) : (
            <Text color="gray.500">Nenhuma conta com vencimento próximo.</Text>
          )}
        </VStack>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onConfirmarQuitacao)}>
          <ModalHeader>Quitar Despesa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Confirmar quitação para <strong>{selectedDespesa?.nome_fornecedor || 'esta despesa'}</strong> no valor de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedDespesa?.valor || 0)}</strong>?</Text>
              <FormControl isRequired>
                <FormLabel>Data de Pagamento</FormLabel>
                <Input type="date" {...register('data_pagamento', { required: true })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Responsável pelo Pagamento</FormLabel>
                <Select
                  placeholder={isLoadingAdmins ? "Carregando..." : "Selecione um responsável"}
                  {...register('responsavel_pagamento_id', { required: true })}
                  disabled={isLoadingAdmins}
                >
                  {admins?.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.nome}</option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="green" type="submit" isLoading={quitacaoMutation.isPending}>Confirmar Pagamento</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

//marcação para commit gemini