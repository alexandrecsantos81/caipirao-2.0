import {
  Box, Button, Flex, Heading, Spinner, Text, VStack, useDisclosure,
  useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, FormControl, FormLabel, Input, useColorModeValue, Divider
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { addDays, isBefore, startOfDay, isValid, format, parseISO } from 'date-fns';

import {
  getDespesasPessoaisPendentes,
  IDespesaPessoalPendente,
  togglePagamentoDespesa
} from '../services/despesaPessoal.service';

const ModalConfirmarPagamento = ({ isOpen, onClose, onConfirm, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataPagamento: string) => void;
  isLoading: boolean;
}) => {
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirmar Data do Pagamento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Data em que o pagamento foi realizado</FormLabel>
            <Input 
              type="date" 
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="green" onClick={() => onConfirm(dataPagamento)} isLoading={isLoading}>
            Confirmar Pagamento
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const CardDespesasPessoaisPendentes = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  
  const [selectedDespesa, setSelectedDespesa] = useState<IDespesaPessoalPendente | null>(null);

  const cardBgColor = useColorModeValue('orange.50', 'orange.900');
  const cardBorderColor = useColorModeValue('orange.400', 'orange.500');
  const urgentItemBgColor = useColorModeValue('red.100', 'red.800');
  const normalItemBgColor = useColorModeValue('whiteAlpha.800', 'whiteAlpha.100');

  const { data: contas, isLoading, isError } = useQuery<IDespesaPessoalPendente[]>({
    queryKey: ['despesasPessoaisPendentes'],
    queryFn: getDespesasPessoaisPendentes,
  });

  const pagamentoMutation = useMutation({
    mutationFn: (params: { id: number, dataPagamento: string }) => 
      togglePagamentoDespesa(params.id, true, params.dataPagamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoaisPendentes'] });
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      queryClient.invalidateQueries({ queryKey: ['analiseFinanceira'] });
      toast({ title: 'Pagamento registrado com sucesso!', status: 'success' });
      onModalClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar pagamento', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handlePagarClick = (despesa: IDespesaPessoalPendente) => {
    setSelectedDespesa(despesa);
    onModalOpen();
  };

  const handleConfirmarPagamento = (dataPagamento: string) => {
    if (selectedDespesa) {
      pagamentoMutation.mutate({ id: selectedDespesa.id, dataPagamento });
    }
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return 'Data inválida';
    const dateObj = parseISO(data);
    if (!isValid(dateObj)) return 'Data inválida';
    return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const isUrgent = (dataVencimento: string | null | undefined) => {
    if (!dataVencimento) return false;
    const hoje = startOfDay(new Date());
    const dataLimite = addDays(hoje, 5);
    const dataVenc = startOfDay(parseISO(dataVencimento));
    if (!isValid(dataVenc)) return false;
    return isBefore(dataVenc, dataLimite);
  };

  return (
    <Box p={5} borderWidth={2} borderRadius={8} boxShadow="md" h="100%" bg={cardBgColor} borderColor={cardBorderColor}>
      <Heading size="md" mb={4}>Despesas Pessoais Pendentes</Heading>
      {isLoading && <Spinner />}
      {isError && <Text color="red.500">Erro ao carregar despesas pendentes.</Text>}
      {!isLoading && !isError && (
        <VStack spacing={3} align="stretch" overflowY="auto" maxHeight="300px">
          {contas && contas.length > 0 ? (
            contas.map((conta) => (
              <Box key={conta.id} p={3} bg={isUrgent(conta.data_vencimento) ? urgentItemBgColor : normalItemBgColor} borderRadius="md" boxShadow="sm">
                <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
                  <VStack align="start" spacing={0} mb={{ base: 2, md: 0 }}>
                    <Text fontWeight="bold" noOfLines={1}>{conta.descricao}</Text>
                    <Text fontSize="sm">Vence em: {formatarData(conta.data_vencimento)}</Text>
                  </VStack>
                  <Text fontWeight="bold" color="red.500" fontSize="lg" mb={{ base: 2, md: 0 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                  </Text>
                  <Button display={{ base: 'none', md: 'inline-flex' }} colorScheme="green" size="sm" onClick={() => handlePagarClick(conta)}>Pagar</Button>
                </Flex>
                <Divider my={2} display={{ base: 'block', md: 'none' }} />
                <Button display={{ base: 'inline-flex', md: 'none' }} colorScheme="green" size="sm" w="full" onClick={() => handlePagarClick(conta)}>Pagar</Button>
              </Box>
            ))
          ) : (
            <Text color="gray.500" textAlign="center" pt={8}>Nenhuma despesa pessoal pendente.</Text>
          )}
        </VStack>
      )}

      <ModalConfirmarPagamento
        isOpen={isModalOpen}
        onClose={onModalClose}
        onConfirm={handleConfirmarPagamento}
        isLoading={pagamentoMutation.isPending}
      />
    </Box>
  );
};
