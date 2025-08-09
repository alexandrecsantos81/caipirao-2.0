import {
  Box, Button, Center, Flex, FormControl, FormLabel, Heading, IconButton,
  Input, NumberInput, NumberInputField, Select, Spinner, Tab, TabList, TabPanel,
  TabPanels, Table, TableContainer, Tabs, Tbody, Td, Text, Th, Thead, Tr,
  useDisclosure, useToast, VStack, Badge, FormErrorMessage,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Textarea,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, HStack,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';

import { Pagination } from '../components/Pagination';
import { ICliente, getClientes, IPaginatedResponse } from '../services/cliente.service';
import { IDespesa, IDespesaForm, registrarDespesa, getDespesas, tiposDeSaida, updateDespesa, deleteDespesa } from '../services/despesa.service';
import { IProduto, getProdutos } from '../services/produto.service';
import { IVenda, INovaVenda, createVenda, getVendas, updateVenda, deleteVenda } from '../services/venda.service';
import { IFornecedor, getFornecedores } from '../services/fornecedor.service';
import { useAuth } from '../hooks/useAuth';

// --- INTERFACES LOCAIS ---
interface ProdutoVendaItem {
  produto_id: number;
  quantidade: number;
  preco_manual?: number;
  nome: string;
  unidade_medida: string;
  preco_original: number;
}

// --- COMPONENTE DO FORMULÁRIO DE VENDA ---
const FormularioNovaVenda = ({ isOpen, onClose, vendaParaEditar }: { isOpen: boolean; onClose: () => void; vendaParaEditar: IVenda | null }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [produtosNaVenda, setProdutosNaVenda] = useState<ProdutoVendaItem[]>([]);
  const [opcaoPagamento, setOpcaoPagamento] = useState<'À VISTA' | 'A PRAZO'>('À VISTA');

  const { control, register, handleSubmit, watch, reset, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      cliente_id: '', data_venda: new Date().toISOString().split('T')[0], data_vencimento: '',
      produto_selecionado_id: '', quantidade: 1, preco_manual: '',
    },
  });

  const { data: clientes } = useQuery<IPaginatedResponse<ICliente>>({ queryKey: ['todosClientes'], queryFn: () => getClientes(1, 1000), enabled: isOpen });
  const { data: produtos } = useQuery<IPaginatedResponse<IProduto>>({ queryKey: ['todosProdutos'], queryFn: () => getProdutos(1, 1000), enabled: isOpen });

  const dataVendaValue = watch('data_venda');
  // A LINHA ABAIXO FOI REMOVIDA
  // const watchedProdutoId = watch('produto_selecionado_id'); 

  const valorTotalCalculado = useMemo(() => {
    return produtosNaVenda.reduce((total, item) => {
      const preco = item.preco_manual ?? item.preco_original;
      return total + (item.quantidade * preco);
    }, 0);
  }, [produtosNaVenda]);

  const mutation = useMutation({
    mutationFn: (data: { vendaData: INovaVenda, id?: number }) => 
      data.id ? updateVenda({ id: data.id, data: data.vendaData }) : createVenda(data.vendaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: `Venda ${vendaParaEditar ? 'atualizada' : 'registrada'}!`, status: "success", duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar venda", description: error.response?.data?.error || error.message, status: "error", duration: 5000, isClosable: true });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (vendaParaEditar) {
        setValue('cliente_id', String(vendaParaEditar.cliente_id));
        setValue('data_venda', vendaParaEditar.data_venda.split('T')[0]);
        setOpcaoPagamento(vendaParaEditar.opcao_pagamento);
        setValue('data_vencimento', vendaParaEditar.data_vencimento ? vendaParaEditar.data_vencimento.split('T')[0] : '');
        
        const produtosEdit = vendaParaEditar.produtos.map(p => ({
          produto_id: p.produto_id,
          quantidade: p.quantidade,
          preco_manual: p.preco_manual,
          nome: p.nome,
          unidade_medida: p.unidade_medida,
          preco_original: p.valor_unitario,
        }));
        setProdutosNaVenda(produtosEdit);
      } else {
        reset({ cliente_id: '', data_venda: new Date().toISOString().split('T')[0], data_vencimento: '', produto_selecionado_id: '', quantidade: 1, preco_manual: '' });
        setProdutosNaVenda([]);
        setOpcaoPagamento('À VISTA');
      }
    }
  }, [isOpen, vendaParaEditar, reset, setValue]);

  useEffect(() => {
    if (opcaoPagamento === 'À VISTA') setValue('data_vencimento', dataVendaValue);
  }, [opcaoPagamento, dataVendaValue, setValue]);

  const handleAddProduto = () => {
    const { produto_selecionado_id, quantidade, preco_manual } = getValues();
    if (!produto_selecionado_id || !quantidade || Number(quantidade) <= 0) {
      toast({ title: "Produto ou quantidade inválida", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    const produtoInfo = produtos?.dados.find(p => p.id === Number(produto_selecionado_id));
    if (!produtoInfo) return;
    if (produtosNaVenda.some(p => p.produto_id === produtoInfo.id)) {
      toast({ title: "Produto já adicionado", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    setProdutosNaVenda(prev => [...prev, {
      produto_id: produtoInfo.id,
      quantidade: Number(quantidade),
      preco_manual: preco_manual ? Number(preco_manual) : undefined,
      nome: produtoInfo.nome,
      unidade_medida: produtoInfo.unidade_medida,
      preco_original: produtoInfo.price,
    }]);
    setValue('produto_selecionado_id', '');
    setValue('quantidade', 1);
    setValue('preco_manual', '');
  };

  const handleRemoveProduto = (produtoId: number) => {
    setProdutosNaVenda(prev => prev.filter(p => p.produto_id !== produtoId));
  };

  const onSubmit: SubmitHandler<any> = (data) => {
    if (produtosNaVenda.length === 0) {
      toast({ title: "Nenhum produto adicionado", status: "error", duration: 4000, isClosable: true });
      return;
    }
    const vendaParaAPI: INovaVenda = {
      cliente_id: Number(data.cliente_id),
      data_venda: data.data_venda,
      opcao_pagamento: opcaoPagamento,
      data_vencimento: data.data_vencimento,
      produtos: produtosNaVenda.map(p => ({
        produto_id: p.produto_id,
        quantidade: p.quantidade,
        preco_manual: p.preco_manual,
      })),
    };
    mutation.mutate({ vendaData: vendaParaAPI, id: vendaParaEditar?.id });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">{vendaParaEditar ? 'Editar Venda' : 'Registrar Nova Venda'}</DrawerHeader>
        <DrawerCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Flex gap={4}><FormControl isRequired isInvalid={!!errors.cliente_id}><FormLabel>Cliente</FormLabel><Select placeholder="Selecione um cliente" {...register('cliente_id', { required: 'Cliente é obrigatório' })}>{clientes?.dados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select><FormErrorMessage>{errors.cliente_id && errors.cliente_id.message}</FormErrorMessage></FormControl><FormControl isRequired><FormLabel>Data da Venda</FormLabel><Input type="date" {...register('data_venda')} /></FormControl></Flex>
              <Flex gap={4}><FormControl isRequired><FormLabel>Opção de Pagamento</FormLabel><Select value={opcaoPagamento} onChange={(e) => setOpcaoPagamento(e.target.value as any)}><option value="À VISTA">À VISTA</option><option value="A PRAZO">A PRAZO</option></Select></FormControl><FormControl isRequired={opcaoPagamento === 'A PRAZO'}><FormLabel>Data de Vencimento</FormLabel><Input type="date" {...register('data_vencimento')} isDisabled={opcaoPagamento === 'À VISTA'} /></FormControl></Flex>
              <Box p={4} borderWidth={1} borderRadius="md" mt={4}><Heading size="sm" mb={3}>Adicionar Produtos</Heading><Flex gap={2} align="flex-end"><FormControl flex={3}><FormLabel>Produto</FormLabel><Select placeholder="Selecione..." {...register('produto_selecionado_id')}>{produtos?.dados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</Select></FormControl><FormControl flex={1}><FormLabel>Qtd/Peso</FormLabel><Controller name="quantidade" control={control} render={({ field }) => <NumberInput {...field} min={0.001}><NumberInputField /></NumberInput>} /></FormControl><FormControl flex={1}><FormLabel>Preço Manual (R$)</FormLabel><Input placeholder="Opcional" {...register('preco_manual')} /></FormControl><Button colorScheme="green" onClick={handleAddProduto}><FiPlus /></Button></Flex></Box>
              <VStack spacing={2} align="stretch" mt={4}>{produtosNaVenda.map(p => (<Flex key={p.produto_id} justify="space-between" align="center" p={2} borderWidth={1} borderRadius="md"><Box><Text fontWeight="bold">{p.nome}</Text><Text fontSize="sm" color="gray.500">{p.quantidade} {p.unidade_medida} x {(p.preco_manual ?? p.preco_original).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{p.preco_manual !== undefined && <Badge ml={2} colorScheme="orange">Manual</Badge>}</Text></Box><IconButton aria-label="Remover" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => handleRemoveProduto(p.produto_id)} /></Flex>))}</VStack>
              <Flex justify="flex-end" mt={4}><Box textAlign="right"><Text fontSize="lg">Vendedor: {user?.nome}</Text><Heading size="lg" color="teal.500">Total: {valorTotalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Heading></Box></Flex>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px"><Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="teal" type="submit" isLoading={mutation.isPending}>Salvar Venda</Button></DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

// --- COMPONENTE DO FORMULÁRIO DE DESPESA ---
const FormularioNovaDespesa = ({ isOpen, onClose, despesaParaEditar }: { isOpen: boolean; onClose: () => void; despesaParaEditar: IDespesa | null }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<IDespesaForm>();

  const { data: fornecedores } = useQuery<IFornecedor[]>({ queryKey: ['todosFornecedores'], queryFn: getFornecedores, enabled: isOpen });

  const mutation = useMutation({
    mutationFn: (data: { despesaData: IDespesaForm, id?: number }) =>
      data.id ? updateDespesa({ id: data.id, data: data.despesaData }) : registrarDespesa(data.despesaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast({ title: `Despesa ${despesaParaEditar ? 'atualizada' : 'registrada'}!`, status: "success", duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar despesa", description: error.response?.data?.error || error.message, status: "error", duration: 5000, isClosable: true });
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (despesaParaEditar) {
        reset({
          ...despesaParaEditar,
          data_vencimento: despesaParaEditar.data_vencimento.split('T')[0],
        });
      } else {
        reset({
          discriminacao: '', tipo_saida: '', valor: '',
          data_vencimento: new Date().toISOString().split('T')[0], fornecedor_id: undefined,
        });
      }
    }
  }, [isOpen, despesaParaEditar, reset]);

  const onSubmit: SubmitHandler<IDespesaForm> = (data) => {
    const finalData = { ...data, valor: Number(data.valor), fornecedor_id: data.fornecedor_id ? Number(data.fornecedor_id) : null };
    mutation.mutate({ despesaData: finalData, id: despesaParaEditar?.id });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">{despesaParaEditar ? 'Editar Despesa' : 'Registrar Nova Despesa'}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.tipo_saida}><FormLabel>Tipo de Saída</FormLabel><Select placeholder="Selecione o tipo da despesa" {...register('tipo_saida', { required: 'Tipo é obrigatório' })}>{tiposDeSaida.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</Select><FormErrorMessage>{errors.tipo_saida?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.valor}><FormLabel>Valor (R$)</FormLabel><Controller name="valor" control={control} rules={{ required: 'Valor é obrigatório', min: { value: 0.01, message: 'Valor deve ser maior que zero' } }} render={({ field }) => <NumberInput {...field} onChange={(_, valAsNumber) => field.onChange(valAsNumber)} value={field.value as number} min={0.01} precision={2}><NumberInputField /></NumberInput>} /><FormErrorMessage>{errors.valor?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.discriminacao}><FormLabel>Discriminação (Detalhes)</FormLabel><Textarea placeholder="Detalhes da despesa..." {...register('discriminacao', { required: 'A descrição é obrigatória' })} /><FormErrorMessage>{errors.discriminacao?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.data_vencimento}><FormLabel>Data de Vencimento</FormLabel><Input type="date" {...register('data_vencimento', { required: 'Data de vencimento é obrigatória' })} /><FormErrorMessage>{errors.data_vencimento?.message}</FormErrorMessage></FormControl>
              <FormControl><FormLabel>Fornecedor/Credor (Opcional)</FormLabel><Select placeholder="Selecione um fornecedor" {...register('fornecedor_id')}>{fornecedores?.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</Select></FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px"><Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="red" type="submit" isLoading={mutation.isPending}>Salvar Despesa</Button></DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

// --- COMPONENTES DE TABELA (ATUALIZADOS) ---
const TabelaVendas = ({ onEdit, onDelete }: { onEdit: (venda: IVenda) => void; onDelete: (id: number) => void; }) => {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useQuery({ queryKey: ['vendas', pagina], queryFn: () => getVendas(pagina, 10), placeholderData: keepPreviousData });
  
  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as vendas.</Text></Center>;

  return (
    <>
      <TableContainer>
        <Table variant="striped">
          <Thead><Tr><Th>Data</Th><Th>Cliente</Th><Th>Pagamento</Th><Th>Status</Th><Th isNumeric>Valor</Th><Th>Ações</Th></Tr></Thead>
          <Tbody>{data?.dados.map((venda: IVenda) => (<Tr key={venda.id}>
            <Td>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
            <Td>{venda.cliente_nome}</Td>
            <Td>{venda.opcao_pagamento}</Td>
            <Td><Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>{venda.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Td>
            <Td isNumeric>{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
            <Td><HStack spacing={2}>
              <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(venda)} />
              <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(venda.id)} />
            </HStack></Td>
          </Tr>))}</Tbody>
        </Table>
      </TableContainer>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};

const TabelaDespesas = ({ onEdit, onDelete }: { onEdit: (despesa: IDespesa) => void; onDelete: (id: number) => void; }) => {
  const { data, isLoading, isError } = useQuery<IDespesa[]>({ queryKey: ['despesas'], queryFn: getDespesas });
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as despesas.</Text></Center>;
  
  return (
    <TableContainer>
      <Table variant="striped">
        <Thead><Tr><Th>Vencimento</Th><Th>Discriminação</Th><Th>Tipo</Th><Th>Status</Th><Th isNumeric>Valor</Th>{isAdmin && <Th>Ações</Th>}</Tr></Thead>
        <Tbody>{data?.map((despesa) => (
          <Tr key={despesa.id}>
            <Td>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
            <Td>{despesa.discriminacao}</Td>
            <Td>{despesa.tipo_saida}</Td>
            <Td><Badge colorScheme={despesa.data_pagamento ? 'green' : 'orange'}>{despesa.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Td>
            <Td isNumeric>{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
            {isAdmin && (<Td><HStack spacing={2}>
              <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(despesa)} />
              <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(despesa.id)} />
            </HStack></Td>)}
          </Tr>
        ))}</Tbody>
      </Table>
    </TableContainer>
  );
};

// --- PÁGINA PRINCIPAL DE MOVIMENTAÇÕES ---
const MovimentacoesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const queryClient = useQueryClient();
  const toast = useToast();

  const { isOpen: isVendaDrawerOpen, onOpen: onVendaDrawerOpen, onClose: onVendaDrawerClose } = useDisclosure();
  const { isOpen: isDespesaDrawerOpen, onOpen: onDespesaDrawerOpen, onClose: onDespesaDrawerClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  
  const [vendaParaEditar, setVendaParaEditar] = useState<IVenda | null>(null);
  const [despesaParaEditar, setDespesaParaEditar] = useState<IDespesa | null>(null);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: number; tipo: 'venda' | 'despesa' } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const deleteVendaMutation = useMutation({ mutationFn: deleteVenda, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendas'] }); toast({ title: 'Venda excluída!', status: 'success' }); onConfirmClose(); } });
  const deleteDespesaMutation = useMutation({ mutationFn: deleteDespesa, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['despesas'] }); toast({ title: 'Despesa excluída!', status: 'success' }); onConfirmClose(); } });

  const handleEditVenda = (venda: IVenda) => { setVendaParaEditar(venda); onVendaDrawerOpen(); };
  const handleEditDespesa = (despesa: IDespesa) => { setDespesaParaEditar(despesa); onDespesaDrawerOpen(); };
  const handleAddNewVenda = () => { setVendaParaEditar(null); onVendaDrawerOpen(); };
  const handleAddNewDespesa = () => { setDespesaParaEditar(null); onDespesaDrawerOpen(); };

  const handleDeleteClick = (id: number, tipo: 'venda' | 'despesa') => { setItemParaDeletar({ id, tipo }); onConfirmOpen(); };
  const handleConfirmDelete = () => {
    if (!itemParaDeletar) return;
    if (itemParaDeletar.tipo === 'venda') {
      deleteVendaMutation.mutate(itemParaDeletar.id);
    } else {
      deleteDespesaMutation.mutate(itemParaDeletar.id);
    }
  };

  return (
    <Box>
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="1em"><Tab>Vendas (Entradas)</Tab><Tab>Despesas (Saídas)</Tab></TabList>
        <TabPanels>
          <TabPanel>
            <Flex justify="space-between" mb={4}>
              <Heading size="md">Histórico de Vendas</Heading>
              <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewVenda}>Registrar Venda</Button>
            </Flex>
            <TabelaVendas onEdit={handleEditVenda} onDelete={(id) => handleDeleteClick(id, 'venda')} />
          </TabPanel>
          <TabPanel>
            <Flex justify="space-between" mb={4}>
              <Heading size="md">Histórico de Despesas</Heading>
              {isAdmin && (<Button leftIcon={<FiPlus />} colorScheme="red" onClick={handleAddNewDespesa}>Registrar Despesa</Button>)}
            </Flex>
            <TabelaDespesas onEdit={handleEditDespesa} onDelete={(id) => handleDeleteClick(id, 'despesa')} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <FormularioNovaVenda isOpen={isVendaDrawerOpen} onClose={onVendaDrawerClose} vendaParaEditar={vendaParaEditar} />
      <FormularioNovaDespesa isOpen={isDespesaDrawerOpen} onClose={onDespesaDrawerClose} despesaParaEditar={despesaParaEditar} />

      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose}>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Exclusão</AlertDialogHeader>
          <AlertDialogBody>Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onConfirmClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteVendaMutation.isPending || deleteDespesaMutation.isPending}>
              Sim, Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default MovimentacoesPage;
