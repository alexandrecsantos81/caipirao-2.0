// frontend/src/components/CardContasAReceber.tsx

import {
  Box, Button, Flex, Heading, Spinner, Text, VStack, HStack, useDisclosure,
  useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, FormControl, FormLabel, Input, useColorModeValue,
  Divider, Link, Icon, Checkbox, Collapse, Select, InputGroup, InputLeftAddon, FormErrorMessage,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogOverlay
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { addDays, isBefore, startOfDay, isValid, format } from 'date-fns';
import { FaWhatsapp } from 'react-icons/fa';

import { IContaAReceber, getContasAReceber, registrarPagamento, IQuitacaoVendaData } from '../services/venda.service';
import { getUtilizadores, IUtilizador } from '../services/utilizador.service';
import { useAuth } from '../hooks/useAuth';
import { IPaginatedResponse } from '@/types/common.types';

export const CardContasAReceber = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  
  const [selectedVenda, setSelectedVenda] = useState<IContaAReceber | null>(null);
  const { register, handleSubmit, reset, watch, getValues, formState: { errors } } = useForm<IQuitacaoVendaData & { pagamento_parcial: boolean }>();
  const isPagamentoParcial = watch('pagamento_parcial');
  const cancelRef = useRef<HTMLButtonElement>(null);

  const cardBgColor = useColorModeValue('teal.50', 'teal.900');
  const cardBorderColor = useColorModeValue('teal.400', 'teal.500');
  const urgentItemBgColor = useColorModeValue('red.100', 'red.800');
  const normalItemBgColor = useColorModeValue('whiteAlpha.800', 'whiteAlpha.100');

  const { data: contas, isLoading, isError } = useQuery<IContaAReceber[]>({
    queryKey: ['contasAReceber'],
    queryFn: getContasAReceber,
  });

  const { data: admins, isLoading: isLoadingAdmins } = useQuery<IPaginatedResponse<IUtilizador>, Error, IUtilizador[]>({
    queryKey: ['utilizadores', 1, 1000],
    queryFn: () => getUtilizadores(1, 1000),
    select: (data) => data.dados.filter(u => u.perfil === 'ADMIN'),
    enabled: isModalOpen,
  });

  const quitacaoMutation = useMutation({
    mutationFn: registrarPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasAReceber'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: 'Recebimento registrado com sucesso!', status: 'success' });
      onModalClose();
      onAlertClose();
      reset();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar recebimento', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleReceberClick = (venda: IContaAReceber) => {
    setSelectedVenda(venda);
    onModalOpen();
  };

  useEffect(() => {
    if (selectedVenda && isModalOpen) {
      reset({
        data_pagamento: format(new Date(), 'yyyy-MM-dd'),
        valor_pago: selectedVenda.valor_total,
        responsavel_quitacao_id: user?.id,
        pagamento_parcial: false,
      });
    }
  }, [selectedVenda, isModalOpen, reset, user]);

  const onConfirmarQuitacao = () => {
    const data = getValues();
    if (selectedVenda) {
      const finalData: IQuitacaoVendaData = {
        data_pagamento: data.data_pagamento,
        valor_pago: Number(data.valor_pago),
        responsavel_quitacao_id: isPagamentoParcial ? Number(data.responsavel_quitacao_id) : user?.id,
      };
      quitacaoMutation.mutate({ vendaId: selectedVenda.id, quitacaoData: finalData });
    }
  };

  const handleFormSubmit: SubmitHandler<IQuitacaoVendaData> = (data) => {
    if (selectedVenda && data.valor_pago < selectedVenda.valor_total) {
      onAlertOpen();
    } else {
      onConfirmarQuitacao();
    }
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return 'Data inválida';
    const dateObj = new Date(data);
    if (!isValid(dateObj)) return 'Data inválida';
    return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const isUrgent = (dataVencimento: string | null | undefined) => {
    if (!dataVencimento) return false;
    const hoje = startOfDay(new Date());
    const dataLimite = addDays(hoje, 5);
    const dataVenc = startOfDay(new Date(dataVencimento));
    if (!isValid(dataVenc)) return false;
    return isBefore(dataVenc, dataLimite);
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank' );
  };

  return (
    <Box p={5} borderWidth={2} borderRadius={8} boxShadow="md" h="100%" bg={cardBgColor} borderColor={cardBorderColor}>
      <Heading size="md" mb={4}>Contas a Receber Pendentes</Heading>
      {isLoading && <Spinner />}
      {isError && <Text color="red.500">Erro ao carregar contas a receber.</Text>}
      {!isLoading && !isError && (
        <VStack spacing={3} align="stretch" overflowY="auto" maxHeight="300px">
          {contas && contas.length > 0 ? (
            contas.map((conta) => (
              <Box key={conta.id} p={3} bg={isUrgent(conta.data_vencimento) ? urgentItemBgColor : normalItemBgColor} borderRadius="md" boxShadow="sm">
                <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
                  <VStack align="start" spacing={0} mb={{ base: 2, md: 0 }}>
                    <Text fontWeight="bold">{conta.cliente_nome}</Text>
                    <Text fontSize="sm">Vence em: {formatarData(conta.data_vencimento)}</Text>
                  </VStack>
                  <Text fontWeight="bold" color="green.500" fontSize="lg" mb={{ base: 2, md: 0 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor_total)}
                  </Text>
                  {user?.perfil === 'ADMIN' && (
                    <HStack>
                      <Link onClick={() => openWhatsApp(conta.cliente_telefone)} color="green.600" _hover={{ color: 'green.800' }}><Icon as={FaWhatsapp} boxSize={6} /></Link>
                      <Button display={{ base: 'none', md: 'inline-flex' }} colorScheme="teal" size="sm" onClick={() => handleReceberClick(conta)}>Receber</Button>
                    </HStack>
                  )}
                </Flex>
                {user?.perfil === 'ADMIN' && (
                  <><Divider my={2} display={{ base: 'block', md: 'none' }} /><Button display={{ base: 'inline-flex', md: 'none' }} colorScheme="teal" size="sm" w="full" onClick={() => handleReceberClick(conta)}>Receber</Button></>
                )}
              </Box>
            ))
          ) : (
            <Text color="gray.500" textAlign="center" pt={8}>Nenhuma conta a receber pendente.</Text>
          )}
        </VStack>
      )}

      <Modal isOpen={isModalOpen} onClose={onModalClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>Registrar Recebimento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Confirmar recebimento de <strong>{selectedVenda?.cliente_nome}</strong> no valor total de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedVenda?.valor_total || 0)}</strong>?</Text>
              
              <FormControl isRequired isInvalid={!!errors.data_pagamento}>
                <FormLabel>Data de Recebimento</FormLabel>
                <Input type="date" {...register('data_pagamento', { required: 'A data é obrigatória' })} />
                <FormErrorMessage>{errors.data_pagamento?.message}</FormErrorMessage>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="pagamento-parcial-check" mb="0">
                  É um pagamento parcial?
                </FormLabel>
                <Checkbox id="pagamento-parcial-check" {...register('pagamento_parcial')} />
              </FormControl>

              <Collapse in={isPagamentoParcial} animateOpacity style={{ width: '100%' }}>
                <VStack spacing={4} borderWidth={1} p={4} borderRadius="md">
                  <FormControl isRequired={isPagamentoParcial} isInvalid={!!errors.valor_pago}>
                    <FormLabel>Valor Recebido</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>R$</InputLeftAddon>
                      <Input type="number" step="0.01" {...register('valor_pago', { required: 'O valor é obrigatório', valueAsNumber: true, min: { value: 0.01, message: 'O valor deve ser maior que zero.' }, validate: (value) => value <= (selectedVenda?.valor_total || 0) || `O valor não pode ser maior que o devido.` })} />
                    </InputGroup>
                    <FormErrorMessage>{errors.valor_pago?.message}</FormErrorMessage>
                  </FormControl>
                  <FormControl isRequired={isPagamentoParcial} isInvalid={!!errors.responsavel_quitacao_id}>
                    <FormLabel>Responsável pela Autorização</FormLabel>
                    <Select placeholder={isLoadingAdmins ? "Carregando..." : "Selecione um admin"} {...register('responsavel_quitacao_id', { required: isPagamentoParcial ? 'O responsável é obrigatório' : false, valueAsNumber: true })} disabled={isLoadingAdmins}>
                      {admins?.map(admin => (<option key={admin.id} value={admin.id}>{admin.nome}</option>))}
                    </Select>
                    <FormErrorMessage>{errors.responsavel_quitacao_id?.message}</FormErrorMessage>
                  </FormControl>
                </VStack>
              </Collapse>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onModalClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={quitacaoMutation.isPending}>Confirmar Recebimento</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose} isCentered>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Pagamento Parcial</AlertDialogHeader>
          <AlertDialogBody>O valor informado é menor que o valor total da dívida. Uma nova pendência será mantida com o valor restante. Deseja continuar?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onAlertClose}>Cancelar</Button>
            <Button colorScheme="teal" onClick={onConfirmarQuitacao} ml={3} isLoading={quitacaoMutation.isPending}>Sim, Continuar</Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
