import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, HStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogContent, AlertDialogOverlay,
  Center, Badge, Tooltip, AlertDialogHeader,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Input
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import { useState, useRef, useMemo } from 'react';
import { 
  IDespesaPessoal, 
  IDespesaPessoalForm, 
  getDespesasPessoais, 
  createDespesaPessoal, 
  updateDespesaPessoal,
  togglePagamentoDespesa,
  deleteDespesaPessoal 
} from '../services/despesaPessoal.service';
import { FormularioDespesaPessoal } from './FormularioDespesaPessoal';
import { isValid, parseISO, format } from 'date-fns';

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
  termoBusca: string;
}

const formatarDataSegura = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Data Inválida';
  const data = parseISO(dateString); 
  if (!isValid(data)) {
    return 'Data Inválida';
  }
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const ModalConfirmarPagamento = ({ isOpen, onClose, onConfirm, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataPagamento: string) => void;
  isLoading: boolean;
}) => {
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleConfirm = () => {
    onConfirm(dataPagamento);
  };

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
          <Button colorScheme="green" onClick={handleConfirm} isLoading={isLoading}>
            Confirmar Pagamento
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const TabelaDespesasPessoais = ({ filters, termoBusca }: TabelaDespesasPessoaisProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isPagamentoOpen, onOpen: onPagamentoOpen, onClose: onPagamentoClose } = useDisclosure();
  
  const [selectedDespesa, setSelectedDespesa] = useState<IDespesaPessoal | null>(null);
  const [itemParaDeletar, setItemParaDeletar] = useState<IDespesaPessoal | IFinanciamentoAgrupado | null>(null);
  const [despesaParaPagar, setDespesaParaPagar] = useState<IDespesaPessoal | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery<IDespesaPessoal[]>({
    queryKey: ['despesasPessoais', filters],
    queryFn: () => getDespesasPessoais(filters.startDate, filters.endDate),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  const saveMutation = useMutation({
    mutationFn: (params: { data: IDespesaPessoalForm; id?: number }) =>
      params.id
        ? updateDespesaPessoal({ id: params.id, data: params.data })
        : createDespesaPessoal(params.data),
    onSuccess: (data: IDespesaPessoal | IDespesaPessoal[]) => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      const action = Array.isArray(data) ? 'criada' : 'atualizada';
      toast({ title: `Despesa ${action} com sucesso!`, status: 'success' });
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
    mutationFn: (params: { despesa: IDespesaPessoal, dataPagamento?: string }) => 
      togglePagamentoDespesa(params.despesa.id, !params.despesa.pago, params.dataPagamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesasPessoais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
      toast({ title: 'Status de pagamento atualizado!', status: 'info', duration: 2000 });
      onPagamentoClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar pagamento', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const itensDaTabela = useMemo(() => {
    if (!data) return [];

    const termo = termoBusca.toLowerCase();
    const dadosFiltradosPorTexto = !termoBusca ? data : data.filter(d => 
      d.descricao.toLowerCase().includes(termo) ||
      (d.categoria && d.categoria.toLowerCase().includes(termo))
    );

    const despesasVisiveis = dadosFiltradosPorTexto.filter(d => {
        if (d.pago) {
            if (!d.data_pagamento) return false;
            const dataPagamento = parseISO(d.data_pagamento);
            if (!isValid(dataPagamento)) return false;
            return dataPagamento >= parseISO(filters.startDate) && dataPagamento <= parseISO(filters.endDate);
        }
        return true;
    });

    const despesasUnicas = despesasVisiveis.filter(d => !d.parcela_id && !d.recorrente);
    const assinaturas = despesasVisiveis.filter(d => d.recorrente && !d.parcela_id);

    const parcelas = dadosFiltradosPorTexto.filter(d => !!d.parcela_id);
    const grupos = new Map<string, IDespesaPessoal[]>();
    parcelas.forEach(p => {
      const id = p.parcela_id!;
      if (!grupos.has(id)) grupos.set(id, []);
      grupos.get(id)!.push(p);
    });

    const financiamentos: IFinanciamentoAgrupado[] = [];
    grupos.forEach((parcelasDoGrupo) => {
      const proximaParcela = parcelasDoGrupo
        .filter(p => !p.pago)
        .sort((a, b) => (a.numero_parcela || 0) - (b.numero_parcela || 0))[0];

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

    return [...despesasUnicas, ...assinaturas, ...financiamentos].sort((a, b) => {
        const dateA = parseISO('proximaParcela' in a ? a.proximaParcela.data_vencimento : a.data_vencimento);
        const dateB = parseISO('proximaParcela' in b ? b.proximaParcela.data_vencimento : b.data_vencimento);
        return dateA.getTime() - dateB.getTime();
    });
  }, [data, termoBusca, filters.startDate, filters.endDate]);

  const handleAddClick = () => { setSelectedDespesa(null); onDrawerOpen(); };
  const handleEditClick = (despesa: IDespesaPessoal) => { setSelectedDespesa(despesa); onDrawerOpen(); };
  const handleDeleteClick = (item: IDespesaPessoal | IFinanciamentoAgrupado) => { setItemParaDeletar(item); onConfirmOpen(); };
  
  // CORREÇÃO APLICADA AQUI
  const handleSave = (formData: IDespesaPessoalForm, id?: number) => {
    saveMutation.mutate({ data: formData, id });
  };

  const handleConfirmDelete = () => {
    if (!itemParaDeletar) return;
    const idParaDeletar = 'proximaParcela' in itemParaDeletar ? itemParaDeletar.proximaParcela.id : itemParaDeletar.id;
    deleteMutation.mutate(idParaDeletar);
  };

  const handleTogglePago = (despesa: IDespesaPessoal) => {
    if (despesa.pago) {
      togglePagoMutation.mutate({ despesa });
    } else {
      setDespesaParaPagar(despesa);
      onPagamentoOpen();
    }
  };

  const handleConfirmarPagamento = (dataPagamento: string) => {
    if (despesaParaPagar) {
      togglePagoMutation.mutate({ despesa: despesaParaPagar, dataPagamento });
    }
  };

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
                      <Td>{formatarDataSegura(financiamento.proximaParcela.data_vencimento)}</Td>
                      <Td><Badge colorScheme="blue">{`${financiamento.proximaParcela.numero_parcela}/${financiamento.totalParcelas}`}</Badge></Td>
                      <Td>{financiamento.descricaoBase}</Td>
                      <Td>{financiamento.categoria || '---'}</Td>
                      <Td isNumeric color="red.500" fontWeight="bold">{financiamento.proximaParcela.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td isNumeric>{financiamento.saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td>
                        <Tooltip label={financiamento.proximaParcela.pago ? 'Pago' : 'Pendente'}>
                            <Badge colorScheme={financiamento.proximaParcela.pago ? 'green' : 'orange'}>
                                {financiamento.proximaParcela.pago ? 'Pago' : 'Pendente'}
                            </Badge>
                        </Tooltip>
                      </Td>
                      <Td>
                        <HStack>
                          <Tooltip label="Marcar como pago/pendente"><IconButton aria-label="Marcar como pago/pendente" icon={<FiCheckSquare />} onClick={() => handleTogglePago(financiamento.proximaParcela)} /></Tooltip>
                          <Tooltip label="Editar parcelamento (indisponível)"><IconButton aria-label="Editar" icon={<FiEdit />} isDisabled /></Tooltip>
                          <Tooltip label="Excluir parcelas futuras"><IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(financiamento)} /></Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                } 
                else {
                  const despesa = item as IDespesaPessoal;
                  return (
                    <Tr key={despesa.id}>
                      <Td>{formatarDataSegura(despesa.data_vencimento)}</Td>
                      <Td>{despesa.recorrente ? <Badge colorScheme="purple">Assinatura</Badge> : 'Única'}</Td>
                      <Td>{despesa.descricao}</Td>
                      <Td>{despesa.categoria || '---'}</Td>
                      <Td isNumeric color="red.500" fontWeight="bold">{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td isNumeric>{despesa.recorrente ? 'N/A' : '---'}</Td>
                      <Td>
                        <Tooltip label={despesa.pago ? `Pago em ${formatarDataSegura(despesa.data_pagamento)}` : 'Pendente'}>
                           <Badge colorScheme={despesa.pago ? 'green' : 'orange'}>
                                {despesa.pago ? 'Pago' : 'Pendente'}
                            </Badge>
                        </Tooltip>
                      </Td>
                      <Td>
                        <HStack>
                          <Tooltip label="Marcar como pago/pendente"><IconButton aria-label="Marcar como pago/pendente" icon={<FiCheckSquare />} onClick={() => handleTogglePago(despesa)} /></Tooltip>
                          <Tooltip label="Editar despesa"><IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleEditClick(despesa)} /></Tooltip>
                          <Tooltip label="Excluir despesa"><IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(despesa)} /></Tooltip>
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
      <ModalConfirmarPagamento 
        isOpen={isPagamentoOpen}
        onClose={onPagamentoClose}
        onConfirm={handleConfirmarPagamento}
        isLoading={togglePagoMutation.isPending}
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
