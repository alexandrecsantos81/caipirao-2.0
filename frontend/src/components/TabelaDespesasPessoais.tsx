import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogContent, AlertDialogOverlay,
  Center, Badge, Checkbox, Tooltip, ModalHeader // Mantido ModalHeader para o AlertDialog
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useState, useRef } from 'react';

import {
  IDespesaPessoal, IDespesaPessoalForm, getDespesasPessoais, createDespesaPessoal, updateDespesaPessoal, deleteDespesaPessoal
} from '../services/despesaPessoal.service';
import { FormularioDespesaPessoal } from './FormularioDespesaPessoal';

interface TabelaDespesasPessoaisProps {
  filters: { startDate: string; endDate: string };
}

export const TabelaDespesasPessoais = ({ filters }: TabelaDespesasPessoaisProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  
  const [selectedDespesa, setSelectedDespesa] = useState<IDespesaPessoal | null>(null);
  const [itemParaDeletar, setItemParaDeletar] = useState<IDespesaPessoal | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['despesasPessoais', filters],
    queryFn: () => getDespesasPessoais(filters.startDate, filters.endDate),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ data, id }: { data: IDespesaPessoalForm; id?: number }): Promise<IDespesaPessoal[]> => {
      if (id) {
        const updated = await updateDespesaPessoal({ id, data: { ...data, valor: Number(data.valor) } });
        return [updated];
      }
      return createDespesaPessoal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      toast({ title: `Despesa salva com sucesso!`, status: 'success' });
      onDrawerClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDespesaPessoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      toast({ title: 'Despesa excluída com sucesso!', status: 'success' });
      onConfirmClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const togglePagoMutation = useMutation({
    mutationFn: (despesa: IDespesaPessoal) => updateDespesaPessoal({
      id: despesa.id,
      data: { pago: !despesa.pago, data_pagamento: !despesa.pago ? new Date().toISOString().split('T')[0] : null }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      toast({ title: 'Status de pagamento atualizado!', status: 'info', duration: 2000 });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar pagamento', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleAddClick = () => { setSelectedDespesa(null); onDrawerOpen(); };
  const handleEditClick = (despesa: IDespesaPessoal) => { setSelectedDespesa(despesa); onDrawerOpen(); };
  const handleDeleteClick = (despesa: IDespesaPessoal) => { setItemParaDeletar(despesa); onConfirmOpen(); };
  const handleConfirmDelete = () => { if (itemParaDeletar) { deleteMutation.mutate(itemParaDeletar.id); } };
  const handleSave = (formData: IDespesaPessoalForm, id?: number) => { saveMutation.mutate({ data: formData, id }); };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Despesas Pessoais</Heading>
        {/* AJUSTE 3: Alterando a cor do botão para 'red' */}
        <Button leftIcon={<FiPlus />} colorScheme="red" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>
          Adicionar Despesa
        </Button>
      </Flex>

      {isLoading ? <Center p={8}><Spinner size="xl" /></Center> : isError ? <Center p={8}><Text color="red.500">Erro ao carregar despesas.</Text></Center> : (
        <TableContainer>
          <Table variant="striped">
            <Thead><Tr><Th>Vencimento</Th><Th>Descrição</Th><Th>Categoria</Th><Th isNumeric>Valor (R$)</Th><Th>Pago?</Th><Th>Ações</Th></Tr></Thead>
            <Tbody>
              {data?.map((despesa) => (
                <Tr key={despesa.id} opacity={despesa.pago ? 0.6 : 1}>
                  <Td>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                  <Td>{despesa.descricao}</Td>
                  <Td><Badge>{despesa.categoria || '---'}</Badge></Td>
                  <Td isNumeric color="red.500" fontWeight="bold">{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                  <Td>
                    <Tooltip label={despesa.pago ? `Pago em ${new Date(despesa.data_pagamento!).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : 'Marcar como pago'}>
                      <Checkbox isChecked={despesa.pago} onChange={() => togglePagoMutation.mutate(despesa)} />
                    </Tooltip>
                  </Td>
                  <Td>
                    <HStack>
                      <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleEditClick(despesa)} />
                      <IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(despesa)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* AJUSTE 1: Garantindo que o Drawer seja usado para o formulário */}
      <FormularioDespesaPessoal isOpen={isDrawerOpen} onClose={onDrawerClose} despesa={selectedDespesa} onSave={handleSave} isLoading={saveMutation.isPending} />
      
      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <ModalHeader>Confirmar Exclusão</ModalHeader>
          <AlertDialogBody>Tem certeza que deseja excluir a despesa "<strong>{itemParaDeletar?.descricao}</strong>"?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onConfirmClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};
