import {
  Box, Flex, Heading, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid,
  Spinner, Text, VStack, HStack, Button, useDisclosure, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Input, Select
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

import { IContasAPagar, quitarDespesa, IQuitacaoData } from '../services/despesa.service';
import { getContasAPagar } from '../services/despesa.service';
import { getUtilizadores, IUtilizador } from '../services/utilizador.service';
import { useAuth } from '../hooks/useAuth';

// --- COMPONENTE: CARD DE CONTAS A PAGAR ---
const CardContasAPagar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDespesa, setSelectedDespesa] = useState<IContasAPagar | null>(null);
  const { register, handleSubmit, setValue } = useForm<IQuitacaoData>();

  // Busca as contas a pagar
  const { data: contas, isLoading, isError } = useQuery<IContasAPagar[]>({
    queryKey: ['contasAPagar'],
    queryFn: getContasAPagar,
  });

  // Busca a lista de admins para o dropdown de responsável
  const { data: admins, isLoading: isLoadingAdmins } = useQuery<IUtilizador[]>({
    queryKey: ['utilizadores'],
    queryFn: getUtilizadores,
    select: (data) => data.filter(u => u.perfil === 'ADMIN'),
    enabled: isOpen, // Só busca quando o modal está aberto
  });

  // Mutação para quitar a despesa
  const quitacaoMutation = useMutation({
    mutationFn: quitarDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast({ title: 'Despesa quitada com sucesso!', status: 'success' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao quitar despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleQuitarClick = (despesa: IContasAPagar) => {
    setSelectedDespesa(despesa);
    // Define a data de pagamento padrão como hoje
    setValue('data_pagamento', new Date().toISOString().split('T')[0]);
    // Define o responsável padrão como o admin logado
    if (user) setValue('responsavel_pagamento_id', user.id);
    onOpen();
  };

  const onConfirmarQuitacao: SubmitHandler<IQuitacaoData> = (data) => {
    if (selectedDespesa) {
      quitacaoMutation.mutate({ id: selectedDespesa.id, quitacaoData: data });
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <Box p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
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

      {/* Modal de Quitação */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onConfirmarQuitacao)}>
          <ModalHeader>Quitar Despesa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Confirmar quitação para <strong>{selectedDespesa?.nome_fornecedor}</strong> no valor de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedDespesa?.valor || 0)}</strong>?</Text>
              <FormControl isRequired>
                <FormLabel>Data de Pagamento</FormLabel>
                <Input type="date" {...register('data_pagamento', { required: true })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Responsável pelo Pagamento</FormLabel>
                <Select 
                  placeholder={isLoadingAdmins ? "Carregando admins..." : "Selecione um responsável"}
                  {...register('responsavel_pagamento_id', { required: true, valueAsNumber: true })} 
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


// --- PÁGINA PRINCIPAL DO DASHBOARD ---
const DashboardPage = () => {
  return (
    <Box p={8}>
      <Heading mb={6}>Dashboard</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {/* Cards existentes (placeholders) */}
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Total de Vendas (Mês)</StatLabel>
          <StatNumber>N/D</StatNumber>
          <StatHelpText>A ser implementado</StatHelpText>
        </Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Novos Clientes (Mês)</StatLabel>
          <StatNumber>N/D</StatNumber>
          <StatHelpText>A ser implementado</StatHelpText>
        </Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Contas a Receber</StatLabel>
          <StatNumber>N/D</StatNumber>
          <StatHelpText>A ser implementado</StatHelpText>
        </Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Produtos em Baixo Estoque</StatLabel>
          <StatNumber>N/D</StatNumber>
          <StatHelpText>A ser implementado</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Nova Seção de Cards */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        <CardContasAPagar />
        <Box p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
            <Heading size="md" mb={4}>Contas a Receber</Heading>
            <Text color="gray.500">(Card de contas a receber será implementado aqui)</Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
