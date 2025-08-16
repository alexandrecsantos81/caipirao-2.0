// frontend/src/components/TabelaDespesasPessoais.tsx

import {
  Box, Button, Flex, IconButton, Spinner, Table, TableContainer,
  Tag, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, FormErrorMessage, Switch, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Center,
  Heading,
  InputGroup,
  InputLeftElement,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { FiEdit, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import {
  IDespesa,
  IDespesaForm,
  getDespesas,
  updateDespesa,
  deleteDespesa,
  registrarDespesa,
} from '../services/despesa.service';
import { Pagination } from './Pagination';

// Hook de Debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

// --- COMPONENTE DO FORMULÁRIO ---
const FormularioDespesa = ({ isOpen, onClose, despesaParaEditar }: {
  isOpen: boolean;
  onClose: () => void;
  despesaParaEditar: IDespesa | null;
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting } } = useForm<IDespesaForm>();
  
  const éRecorrente = watch('recorrente');
  const tipoRecorrencia = watch('tipo_recorrencia');

  const mutation = useMutation({
    mutationFn: (data: { formData: IDespesaForm, id?: number }) =>
      data.id ? updateDespesa({ id: data.id, data: data.formData }) : registrarDespesa(data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      toast({ title: `Despesa salva com sucesso!`, status: 'success' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (despesaParaEditar) {
        // ✅ CORREÇÃO FINALÍSSIMA APLICADA AQUI
        reset({
          ...despesaParaEditar,
          valor: String(despesaParaEditar.valor),
          data_vencimento: despesaParaEditar.data_vencimento.split('T')[0],
          data_pagamento: despesaParaEditar.data_pagamento ? despesaParaEditar.data_pagamento.split('T')[0] : '', // Trata o null
          categoria: despesaParaEditar.categoria || '',
          parcela_atual: despesaParaEditar.parcela_atual || '',
          total_parcelas: despesaParaEditar.total_parcelas || '',
          tipo_recorrencia: despesaParaEditar.tipo_recorrencia || 'PARCELAMENTO',
        });
      } else {
        reset({
          discriminacao: '', valor: '', categoria: '', recorrente: false,
          data_vencimento: new Date().toISOString().split('T')[0],
          tipo_recorrencia: 'PARCELAMENTO',
        });
      }
    }
  }, [isOpen, despesaParaEditar, reset]);

  const onSubmit: SubmitHandler<IDespesaForm> = (data) => {
    const formData: IDespesaForm = {
      ...data,
      valor: parseFloat(String(data.valor)),
      parcela_atual: data.recorrente && data.tipo_recorrencia === 'PARCELAMENTO' ? Number(data.parcela_atual) : undefined,
      total_parcelas: data.recorrente && data.tipo_recorrencia === 'PARCELAMENTO' ? Number(data.total_parcelas) : undefined,
    };
    mutation.mutate({ formData, id: despesaParaEditar?.id });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{despesaParaEditar ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.discriminacao}><FormLabel>Descrição</FormLabel><Input {...register('discriminacao', { required: 'Descrição é obrigatória' })} /></FormControl>
            <FormControl isRequired isInvalid={!!errors.valor}><FormLabel>Valor (R$)</FormLabel><Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true })} /></FormControl>
            <FormControl><FormLabel>Categoria (Opcional)</FormLabel><Input {...register('categoria')} /></FormControl>
            <FormControl display="flex" alignItems="center"><FormLabel htmlFor="recorrente-switch" mb="0">É recorrente?</FormLabel><Switch id="recorrente-switch" {...register('recorrente')} /></FormControl>
            {éRecorrente && (
              <VStack p={4} borderWidth={1} borderRadius="md" w="100%" align="flex-start" spacing={4}>
                <FormControl as="fieldset"><FormLabel as="legend">Tipo</FormLabel>
                  <Controller name="tipo_recorrencia" control={control} render={({ field }) => (
                      <RadioGroup {...field}><Stack direction="row"><Radio value="PARCELAMENTO">Parcelamento</Radio><Radio value="ASSINATURA">Assinatura</Radio></Stack></RadioGroup>
                  )} />
                </FormControl>
                {tipoRecorrencia === 'PARCELAMENTO' && (
                  <HStack>
                    <FormControl isRequired isInvalid={!!errors.parcela_atual}><FormLabel>Parcela Atual</FormLabel><Input type="number" {...register('parcela_atual', { required: 'Campo obrigatório' })} /></FormControl>
                    <FormControl isRequired isInvalid={!!errors.total_parcelas}><FormLabel>de (Total)</FormLabel><Input type="number" {...register('total_parcelas', { required: 'Campo obrigatório' })} /></FormControl>
                  </HStack>
                )}
              </VStack>
            )}
            <FormControl isRequired isInvalid={!!errors.data_vencimento}><FormLabel>Vencimento</FormLabel><Input type="date" {...register('data_vencimento', { required: 'Vencimento é obrigatório' })} /></FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px"><Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="teal" type="submit" isLoading={isSubmitting}>Salvar</Button></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};


// --- COMPONENTE PRINCIPAL DA TABELA ---
export const TabelaDespesasPessoais = ({ filters }: { filters: { startDate: string; endDate: string; } }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  
  const [despesaParaEditar, setDespesaParaEditar] = useState<IDespesa | null>(null);
  const [despesaParaDeletar, setDespesaParaDeletar] = useState<IDespesa | null>(null);
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const buscaDebounced = useDebounce(termoBusca, 500);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['despesasPessoais', pagina, buscaDebounced, filters],
    queryFn: () => getDespesas(pagina, 50, buscaDebounced),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      toast({ title: 'Despesa excluída!', status: 'success' });
      onAlertClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleOpenForm = (despesa: IDespesa | null) => { setDespesaParaEditar(despesa); onFormOpen(); };
  const handleDeleteClick = (despesa: IDespesa) => { setDespesaParaDeletar(despesa); onAlertOpen(); };
  const handleConfirmDelete = () => { if (despesaParaDeletar) { deleteMutation.mutate(despesaParaDeletar.id); } };

  const calcularSaldoRestante = (despesa: IDespesa) => {
    if (despesa.pago || !despesa.recorrente || despesa.tipo_recorrencia !== 'PARCELAMENTO' || !despesa.parcela_atual || !despesa.total_parcelas) return '---';
    const parcelasRestantes = despesa.total_parcelas - despesa.parcela_atual + 1;
    const saldo = parcelasRestantes * despesa.valor;
    return saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Gestão de Despesas Pessoais</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="red" onClick={() => handleOpenForm(null)}>Adicionar Despesa</Button>
      </Flex>
      <InputGroup mb={6}><InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement><Input placeholder="Buscar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} /></InputGroup>
      {isLoading ? <Center p={10}><Spinner size="xl" /></Center> : isError ? <Center p={10}><Text color="red.500">Erro ao carregar.</Text></Center> : (
        <>
          <TableContainer>
            <Table variant="striped">
              <Thead><Tr><Th>Vencimento</Th><Th>Parcela</Th><Th>Descrição</Th><Th>Categoria</Th><Th isNumeric>Valor</Th><Th isNumeric>Saldo</Th><Th>Status</Th><Th>Ações</Th></Tr></Thead>
              <Tbody>
                {data?.dados.map((d) => (
                  <Tr key={d.id}>
                    <Td>{new Date(d.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                    <Td>{d.tipo_recorrencia === 'PARCELAMENTO' && d.parcela_atual ? `${d.parcela_atual}/${d.total_parcelas}` : '---'}</Td>
                    <Td>{d.discriminacao}</Td>
                    <Td>{d.categoria || '---'}</Td>
                    <Td isNumeric>{d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                    <Td isNumeric>{calcularSaldoRestante(d)}</Td>
                    <Td><Tag colorScheme={d.pago ? 'green' : 'orange'}>{d.pago ? 'Pago' : 'Pendente'}</Tag></Td>
                    <Td><HStack><IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForm(d)} /><IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(d)} /></HStack></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
        </>
      )}
      <FormularioDespesa isOpen={isFormOpen} onClose={onFormClose} despesaParaEditar={despesaParaEditar} />
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose}>
        <AlertDialogOverlay><AlertDialogContent>
            <AlertDialogHeader>Confirmar Exclusão</AlertDialogHeader>
            <AlertDialogBody>Excluir a despesa <strong>{despesaParaDeletar?.discriminacao}</strong>?</AlertDialogBody>
            <AlertDialogFooter><Button ref={cancelRef} onClick={onAlertClose}>Cancelar</Button><Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button></AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
