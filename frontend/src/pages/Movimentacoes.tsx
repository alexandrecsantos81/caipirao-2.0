// frontend/src/pages/Movimentacoes.tsx

import {
  Box, Button, Center, Flex, FormControl, FormLabel, Heading, IconButton,
  Input, NumberInput, NumberInputField, Select, Spinner, Tab, TabList, TabPanel,
  TabPanels, Table, TableContainer, Tabs, Tbody, Td, Text, Th, Thead, Tr,
  useDisclosure, useToast, VStack, Badge, FormErrorMessage,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Pagination } from '../components/Pagination';
import { ICliente, getClientes } from '../services/cliente.service';
import { IDespesa, createDespesa, getDespesas } from '../services/despesas.service';
import { IProduto, getProdutos } from '../services/produto.service';
import { IVenda, INovaVenda, createVenda, getVendas } from '../services/venda.service';
import { useAuth } from '../hooks/useAuth';

interface ProdutoVendaItem {
  produto_id: number;
  quantidade: number;
  preco_manual?: number;
  nome: string;
  unidade_medida: string;
  preco_original: number;
}

// --- COMPONENTE DO FORMULÁRIO DE VENDA (sem alterações) ---
const FormularioNovaVenda = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
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

  const { data: clientes } = useQuery<ICliente[]>({ queryKey: ['todosClientes'], queryFn: () => getClientes(1, 1000).then(res => res.dados) });
  const { data: produtos } = useQuery<IProduto[]>({ queryKey: ['todosProdutos'], queryFn: () => getProdutos(1, 1000).then(res => res.dados) });

  const watchedQuantidade = watch('quantidade');
  const watchedPrecoManual = watch('preco_manual');
  const watchedProdutoId = watch('produto_selecionado_id');
  const dataVendaValue = watch('data_venda');

  const valorTotalCalculado = useMemo(() => {
    const totalItensNaLista = produtosNaVenda.reduce((total, item) => {
      const preco = item.preco_manual ?? item.preco_original;
      return total + (item.quantidade * preco);
    }, 0);
    let valorItemAtual = 0;
    const produtoInfo = produtos?.find(p => p.id === Number(watchedProdutoId));
    if (produtoInfo) {
      const precoAtual = Number(watchedPrecoManual) > 0 ? Number(watchedPrecoManual) : produtoInfo.price;
      valorItemAtual = (Number(watchedQuantidade) || 0) * precoAtual;
    }
    return totalItensNaLista + valorItemAtual;
  }, [produtosNaVenda, watchedQuantidade, watchedPrecoManual, watchedProdutoId, produtos]);

  const mutation = useMutation({
    mutationFn: createVenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['contasAReceber'] });
      toast({ title: "Venda registrada!", status: "success", duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao registrar venda", description: error.response?.data?.error || error.message, status: "error", duration: 6000, isClosable: true });
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ cliente_id: '', data_venda: new Date().toISOString().split('T')[0], data_vencimento: '', produto_selecionado_id: '', quantidade: 1, preco_manual: '' });
      setProdutosNaVenda([]);
      setOpcaoPagamento('À VISTA');
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (opcaoPagamento === 'À VISTA') setValue('data_vencimento', dataVendaValue);
  }, [opcaoPagamento, dataVendaValue, setValue]);

  const handleAddProduto = () => {
    const { produto_selecionado_id, quantidade, preco_manual } = getValues();
    if (!produto_selecionado_id || !quantidade || Number(quantidade) <= 0) {
      toast({ title: "Produto ou quantidade inválida", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    const produtoInfo = produtos?.find(p => p.id === Number(produto_selecionado_id));
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
    reset({ ...getValues(), produto_selecionado_id: '', quantidade: 1, preco_manual: '' });
  };

  const handleRemoveProduto = (produtoId: number) => {
    setProdutosNaVenda(prev => prev.filter(p => p.produto_id !== produtoId));
  };

  const onSubmit: SubmitHandler<any> = (data) => {
    const { produto_selecionado_id, quantidade } = getValues();
    let listaFinalDeProdutos = [...produtosNaVenda];
    if (produto_selecionado_id && quantidade > 0) {
      const produtoJaNaLista = produtosNaVenda.some(p => p.produto_id === Number(produto_selecionado_id));
      if (!produtoJaNaLista) {
        const produtoInfo = produtos?.find(p => p.id === Number(produto_selecionado_id));
        if (produtoInfo) {
          listaFinalDeProdutos.push({
            produto_id: produtoInfo.id,
            quantidade: Number(quantidade),
            preco_manual: getValues('preco_manual') ? Number(getValues('preco_manual')) : undefined,
            nome: produtoInfo.nome,
            unidade_medida: produtoInfo.unidade_medida,
            preco_original: produtoInfo.price,
          });
        }
      }
    }
    if (listaFinalDeProdutos.length === 0) {
      toast({ title: "Nenhum produto adicionado", status: "error", duration: 4000, isClosable: true });
      return;
    }
    const vendaParaAPI: INovaVenda = {
      cliente_id: Number(data.cliente_id),
      data_venda: data.data_venda,
      opcao_pagamento: opcaoPagamento,
      data_vencimento: data.data_vencimento,
      produtos: listaFinalDeProdutos.map(p => ({
        produto_id: p.produto_id,
        quantidade: p.quantidade,
        preco_manual: p.preco_manual,
      })),
    };
    mutation.mutate(vendaParaAPI);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">Registrar Nova Venda</DrawerHeader>
        <DrawerCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Flex gap={4}><FormControl isRequired isInvalid={!!errors.cliente_id}><FormLabel>Cliente</FormLabel><Select placeholder="Selecione um cliente" {...register('cliente_id', { required: 'Cliente é obrigatório' })}>{clientes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select><FormErrorMessage>{errors.cliente_id && errors.cliente_id.message}</FormErrorMessage></FormControl><FormControl isRequired><FormLabel>Data da Venda</FormLabel><Input type="date" {...register('data_venda')} /></FormControl></Flex>
              <Flex gap={4}><FormControl isRequired><FormLabel>Opção de Pagamento</FormLabel><Select value={opcaoPagamento} onChange={(e) => setOpcaoPagamento(e.target.value as any)}><option value="À VISTA">À VISTA</option><option value="A PRAZO">A PRAZO</option></Select></FormControl><FormControl isRequired={opcaoPagamento === 'A PRAZO'}><FormLabel>Data de Vencimento</FormLabel><Input type="date" {...register('data_vencimento')} isDisabled={opcaoPagamento === 'À VISTA'} /></FormControl></Flex>
              <Box p={4} borderWidth={1} borderRadius="md" mt={4}><Heading size="sm" mb={3}>Adicionar Produtos</Heading><Flex gap={2} align="flex-end"><FormControl flex={3}><FormLabel>Produto</FormLabel><Select placeholder="Selecione..." {...register('produto_selecionado_id')}>{produtos?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</Select></FormControl><FormControl flex={1}><FormLabel>Qtd/Peso</FormLabel><Controller name="quantidade" control={control} render={({ field }) => <NumberInput {...field} min={0.001}><NumberInputField /></NumberInput>} /></FormControl><FormControl flex={1}><FormLabel>Preço Manual (R$)</FormLabel><Input placeholder="Opcional" {...register('preco_manual')} /></FormControl><Button colorScheme="green" onClick={handleAddProduto}><FiPlus /></Button></Flex></Box>
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

// --- CORREÇÃO: REINTRODUZINDO OS COMPONENTES DE TABELA ---
const TabelaVendas = () => {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useQuery({ queryKey: ['vendas', pagina], queryFn: () => getVendas(pagina, 10), placeholderData: keepPreviousData });
  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as vendas.</Text></Center>;
  return (
    <><TableContainer><Table variant="striped"><Thead><Tr><Th>Data Venda</Th><Th>Cliente</Th><Th>Pagamento</Th><Th>Vencimento</Th><Th>Status</Th><Th isNumeric>Valor Total</Th></Tr></Thead><Tbody>{data?.dados.map((venda: IVenda) => (<Tr key={venda.id}><Td>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td><Td>{venda.cliente_nome}</Td><Td>{venda.opcao_pagamento}</Td><Td>{venda.data_vencimento ? new Date(venda.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</Td><Td><Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>{venda.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Td><Td isNumeric>{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td></Tr>))}</Tbody></Table></TableContainer><Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} /></>
  );
};

const TabelaDespesas = () => {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useQuery({ queryKey: ['despesas', pagina], queryFn: () => getDespesas(pagina, 10), placeholderData: keepPreviousData });
  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as despesas.</Text></Center>;
  return (
    <><TableContainer><Table variant="striped"><Thead><Tr><Th>Data</Th><Th>Descrição</Th><Th>Registrado por</Th><Th isNumeric>Valor</Th></Tr></Thead><Tbody>{data?.dados.map((despesa: IDespesa) => (<Tr key={despesa.id}><Td>{new Date(despesa.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td><Td>{despesa.descricao}</Td><Td>{despesa.usuario_nome}</Td><Td isNumeric>{despesa.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td></Tr>))}</Tbody></Table></TableContainer><Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} /></>
  );
};

// --- PÁGINA PRINCIPAL DE MOVIMENTAÇÕES ---
const MovimentacoesPage = () => {
  const { isOpen: isVendaDrawerOpen, onOpen: onVendaDrawerOpen, onClose: onVendaDrawerClose } = useDisclosure();
  const { isOpen: isDespesaModalOpen, onOpen: onDespesaModalOpen, onClose: onDespesaModalClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const queryClient = useQueryClient();

  const { mutate: criarDespesa, isPending: isCreatingDespesa } = useMutation({
    mutationFn: createDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast({ title: 'Despesa registrada!', status: 'success' });
      onDespesaModalClose();
    },
    onError: (error: any) => { toast({ title: 'Erro ao registrar despesa', description: error.message, status: 'error' }); }
  });

  return (
    <Box p={8}>
      <Heading mb={6}>Movimentações</Heading>
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="1em"><Tab>Vendas (Entradas)</Tab><Tab>Despesas (Saídas)</Tab></TabList>
        <TabPanels>
          <TabPanel>
            <Flex justify="space-between" mb={4}>
              <Heading size="md">Histórico de Vendas</Heading>
              <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onVendaDrawerOpen}>Registrar Venda</Button>
            </Flex>
            <TabelaVendas />
          </TabPanel>
          <TabPanel>
            <Flex justify="space-between" mb={4}>
              <Heading size="md">Histórico de Despesas</Heading>
              {isAdmin && (<Button leftIcon={<FiPlus />} colorScheme="red" onClick={onDespesaModalOpen}>Registrar Despesa</Button>)}
            </Flex>
            <TabelaDespesas />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <FormularioNovaVenda isOpen={isVendaDrawerOpen} onClose={onVendaDrawerClose} />
      
      <Modal isOpen={isDespesaModalOpen} onClose={onDespesaModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registrar Nova Despesa</ModalHeader>
          <ModalCloseButton />
          <ModalBody><Text>Aqui iria o formulário de despesa.</Text></ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDespesaModalClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={() => criarDespesa({ descricao: 'Exemplo', valor_total: 10 })} isLoading={isCreatingDespesa}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MovimentacoesPage;
