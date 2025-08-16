import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, HStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogContent, AlertDialogOverlay,
  Center, Badge, Checkbox, Tooltip, AlertDialogHeader
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useState, useRef, useMemo } from 'react';
import { 
  IDespesaPessoal, 
  IDespesaPessoalForm, 
  getDespesasPessoais, 
  createDespesaPessoal, 
  updateDespesaPessoal, 
  deleteDespesaPessoal 
} from '../services/despesaPessoal.service';
import { FormularioDespesaPessoal } from './FormularioDespesaPessoal';

// Interface para representar um financiamento agrupado na tabela
interface IFinanciamentoAgrupado {
  parcela_id: string;
  descricaoBase: string;
  proximaParcela: IDespesaPessoal;
  saldoRestante: number;
  totalParcelas: number;
  categoria?: string | null;
}

interface TabelaDespesasPessoaisProps {
  filters: { startDate: string; endDate: string };
}

export const TabelaDespesasPessoais = ({ filters }: TabelaDespesasPessoaisProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  
  const [selectedDespesa, setSelectedDespesa] = useState<IDespesaPessoal | null>(null);
  const [itemParaDeletar, setItemParaDeletar] = useState<IDespesaPessoal | IFinanciamentoAgrupado | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery<IDespesaPessoal[]>({
    queryKey: ['despesasPessoais', filters],
    queryFn: () => getDespesasPessoais(filters.startDate, filters.endDate),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  const saveMutation = useMutation({
    mutationFn: createDespesaPessoal,
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
      toast({ title: 'Despesa(s) excluída(s) com sucesso!', status: 'success' });
      onConfirmClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir despesa', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const togglePagoMutation = useMutation({
    mutationFn: (despesa: IDespesaPessoal) => updateDespesaPessoal({ id: despesa.id, data: { pago: !despesa.pago } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      toast({ title: 'Status de pagamento atualizado!', status: 'info', duration: 2000 });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar pagamento', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const itensDaTabela = useMemo(() => {
    if (!data) return [];

    const despesasUnicas = data.filter(d => !d.parcela_id);
    const parcelas = data.filter(d => !!d.parcela_id);

    const grupos = new Map<string, IDespesaPessoal[]>();
    parcelas.forEach(p => {
      const id = p.parcela_id!;
      if (!grupos.has(id)) grupos.set(id, []);
      grupos.get(id)!.push(p);
    });

    const financiamentos: IFinanciamentoAgrupado[] = [];
    grupos.forEach((parcelasDoGrupo) => {
      const proximaParcela = parcelasDoGrupo
        .sort((a, b) => a.numero_parcela! - b.numero_parcela!)
        .find(p => !p.pago);

      if (!proximaParcela) return;

      const saldoRestante = parcelasDoGrupo.reduce((acc, p) => !p.pago ? acc + p.valor : acc, 0);
      
      financiamentos.push({
        parcela_id: proximaParcela.parcela_id!,
        descricaoBase: proximaParcela.descricao.replace(/\s*\(\d+\/\d+\)$/, ''),
        proximaParcela,
        saldoRestante,
        totalParcelas: proximaParcela.total_parcelas || 0,
        categoria: proximaParcela.categoria,
      });
    });

    return [...despesasUnicas, ...financiamentos].sort((a, b) => {
        const dateA = new Date('proximaParcela' in a ? a.proximaParcela.data_vencimento : a.data_vencimento);
        const dateB = new Date('proximaParcela' in b ? b.proximaParcela.data_vencimento : b.data_vencimento);
        return dateA.getTime() - dateB.getTime();
    });
  }, [data]);

  const handleAddClick = () => { setSelectedDespesa(null); onDrawerOpen(); };
  const handleEditClick = () => {
    toast({
        title: 'Função em desenvolvimento',
        description: 'A edição de despesas será implementada em breve.',
        status: 'info',
        duration: 3000,
        isClosable: true,
    });
  };
  const handleDeleteClick = (item: IDespesaPessoal | IFinanciamentoAgrupado) => { setItemParaDeletar(item); onConfirmOpen(); };
  const handleConfirmDelete = () => {
    if (!itemParaDeletar) return;
    const idParaDeletar = 'proximaParcela' in itemParaDeletar ? itemParaDeletar.proximaParcela.id : itemParaDeletar.id;
    deleteMutation.mutate(idParaDeletar);
  };
  const handleSave = (formData: IDespesaPessoalForm) => { saveMutation.mutate(formData); };

  return (
    <Box>
      <div ref={portalContainerRef} />
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Despesas Pessoais</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="red" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>
          Adicionar Despesa
        </Button>
      </Flex>
      {isLoading ? <Center p={8}><Spinner size="xl" /></Center> : isError ? <Center p={8}><Text color="red.500">Erro ao carregar despesas.</Text></Center> : (
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Próximo Vencimento</Th>
                <Th>Parcela</Th>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th isNumeric>Valor da Parcela</Th>
                <Th isNumeric>Saldo Restante</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {itensDaTabela.map((item) => {
                if ('proximaParcela' in item) {
                  const financiamento = item as IFinanciamentoAgrupado;
                  return (
                    <Tr key={financiamento.parcela_id}>
                      <Td>{new Date(financiamento.proximaParcela.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                      <Td><Badge colorScheme="blue">{`${financiamento.proximaParcela.numero_parcela}/${financiamento.totalParcelas}`}</Badge></Td>
                      <Td>{financiamento.descricaoBase}</Td>
                      <Td>{financiamento.categoria || '---'}</Td>
                      <Td isNumeric color="red.500" fontWeight="bold">{financiamento.proximaParcela.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td isNumeric>{financiamento.saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td>
                        <Tooltip label={financiamento.proximaParcela.pago ? 'Pago' : 'Marcar como pago'}>
                          <Checkbox isChecked={financiamento.proximaParcela.pago} onChange={() => togglePagoMutation.mutate(financiamento.proximaParcela)} />
                        </Tooltip>
                      </Td>
                      <Td>
                        <HStack>
                          <IconButton aria-label="Editar" icon={<FiEdit />} onClick={handleEditClick} isDisabled />
                          <IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(financiamento)} />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                } 
                else {
                  const despesa = item as IDespesaPessoal;
                  return (
                    <Tr key={despesa.id}>
                      <Td>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                      <Td>---</Td>
                      <Td>{despesa.descricao}</Td>
                      <Td>{despesa.categoria || '---'}</Td>
                      <Td isNumeric color="red.500" fontWeight="bold">{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td isNumeric>---</Td>
                      <Td>
                        <Tooltip label={despesa.pago ? `Pago em ${despesa.data_pagamento ? new Date(despesa.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}` : 'Marcar como pago'}>
                          <Checkbox isChecked={despesa.pago} onChange={() => togglePagoMutation.mutate(despesa)} />
                        </Tooltip>
                      </Td>
                      <Td>
                        <HStack>
                          <IconButton aria-label="Editar" icon={<FiEdit />} onClick={handleEditClick} />
                          <IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(despesa)} />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                }
              })}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      <FormularioDespesaPessoal 
        isOpen={isDrawerOpen} onClose={onDrawerClose} despesa={selectedDespesa} 
        onSave={handleSave} isLoading={saveMutation.isPending} portalContainerRef={portalContainerRef}
      />
      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Exclusão</AlertDialogHeader>
          <AlertDialogBody>
            Tem certeza que deseja excluir {'proximaParcela' in (itemParaDeletar || {}) 
              ? `a despesa "${(itemParaDeletar as IFinanciamentoAgrupado).descricaoBase}" e todas as suas parcelas futuras`
              : `a despesa "${(itemParaDeletar as IDespesaPessoal)?.descricao}"`
            }? Esta ação não pode ser desfeita.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onConfirmClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};
