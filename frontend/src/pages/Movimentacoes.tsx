import {
  Box, Button, Center, Flex, FormControl, FormLabel, HStack, Heading, IconButton,
  Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
  ModalOverlay, NumberDecrementStepper, NumberIncrementStepper, NumberInput,
  NumberInputField, NumberInputStepper, Select, Spinner, Tab, TabList, TabPanel,
  TabPanels, Table, TableCaption, TableContainer, Tabs, Tbody, Td, Text, Th, Thead, Tr,
  useDisclosure, useToast, VStack
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

import { Pagination } from '../components/Pagination';
import { ICliente, getClientes } from '../services/cliente.service';
import { IDespesa, createDespesa, getDespesas } from '../services/despesas.service';
import { getProdutos } from '../services/produto.service';
import { IVenda, createVenda, getVendas, INovaVenda } from '../services/venda.service';
import { useAuth } from '../hooks/useAuth';

// --- COMPONENTE PARA ADICIONAR DESPESA ---
const ModalAdicionarDespesa = ({ isOpen, onClose, onSubmit, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { descricao: string; valor_total: number }) => void;
  isLoading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ descricao: string; valor_total: number }>();
  useEffect(() => { if (!isOpen) reset(); }, [isOpen, reset]);
  const handleFormSubmit: SubmitHandler<{ descricao: string; valor_total: number }> = (data) => onSubmit(data);
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalHeader>Registrar Nova Despesa</ModalHeader><ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.descricao}><FormLabel>Descrição</FormLabel><Input {...register('descricao', { required: 'Descrição é obrigatória' })} /></FormControl>
            <FormControl isInvalid={!!errors.valor_total}><FormLabel>Valor (R$)</FormLabel><NumberInput min={0.01} precision={2}><NumberInputField {...register('valor_total', { required: 'Valor é obrigatório', valueAsNumber: true, min: 0.01 })} /><NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper></NumberInput></FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter><Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="red" type="submit" isLoading={isLoading}>Salvar</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// --- COMPONENTE PARA REGISTRAR NOVA VENDA ---
const FormularioNovaVenda = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [clienteId, setClienteId] = useState<number | ''>('');
  const [produtosVenda, setProdutosVenda] = useState<{ produto_id: number; quantidade: number; valor_unitario: number; nome: string; unidade_medida: string; }[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const { data: clientes } = useQuery<ICliente[]>({ queryKey: ['todosClientes'], queryFn: () => getClientes(1, 1000).then(res => res.dados) });
  const { data: produtosData } = useQuery({ 
      queryKey: ['todosProdutos'], 
      queryFn: () => getProdutos(1, 1000) // Busca a resposta paginada completa
  });
const produtos = produtosData?.dados; // Extrai o array de produtos da resposta
  const mutation = useMutation({
    mutationFn: createVenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: "Venda registrada!", status: "success", duration: 3000, isClosable: true });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao registrar venda", description: error.response?.data?.error || error.message, status: "error", duration: 5000, isClosable: true });
    }
  });

  const handleAddProduto = () => {
    if (!produtoSelecionadoId || quantidade <= 0) return;
    const produto = produtos?.find(p => p.id === produtoSelecionadoId);
    if (!produto) return;

    if (produtosVenda.some(p => p.produto_id === produto.id)) {
      toast({ title: "Produto já adicionado", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    
    if (Number(produto.quantidade_em_estoque) < quantidade) {
      toast({ title: "Estoque insuficiente", description: `Disponível: ${produto.quantidade_em_estoque} ${produto.unidade_medida}`, status: "error", duration: 3000, isClosable: true });
      return;
    }

    setProdutosVenda([...produtosVenda, {
      produto_id: produto.id,
      quantidade,
      valor_unitario: produto.price, // << CORRIGIDO
      nome: produto.nome,
      unidade_medida: produto.unidade_medida,
    }]);
    setProdutoSelecionadoId('');
    setQuantidade(1);
  };

  const handleRemoveProduto = (produtoId: number) => {
    setProdutosVenda(produtosVenda.filter(p => p.produto_id !== produtoId));
  };

  const calcularValorTotal = () => {
    return produtosVenda.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0);
  };

  const handleSubmit = () => {
    if (!clienteId || produtosVenda.length === 0) {
      toast({ title: "Preencha todos os campos", description: "Selecione um cliente e adicione pelo menos um produto.", status: "error", duration: 3000, isClosable: true });
      return;
    }

    const novaVenda: INovaVenda = {
      cliente_id: Number(clienteId),
      valor_total: calcularValorTotal(), // <<< CORREÇÃO: Calculando e enviando o valor total
      produtos: produtosVenda.map(({ produto_id, quantidade, valor_unitario }) => ({ produto_id, quantidade, valor_unitario }))
    };
    mutation.mutate(novaVenda);
  };

  const handleClose = () => {
    setClienteId('');
    setProdutosVenda([]);
    setProdutoSelecionadoId('');
    setQuantidade(1);
    onClose();
  };

  const produtoAtual = produtos?.find(p => p.id === produtoSelecionadoId);
  const permiteFracao = produtoAtual?.unidade_medida.toLowerCase() === 'kg';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Registrar Nova Venda</ModalHeader><ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired><FormLabel>Cliente</FormLabel><Select placeholder="Selecione um cliente" value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))}>{clientes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormControl>
            <Heading size="md" mt={6}>Adicionar Produtos</Heading>
            <HStack width="100%">
            <FormControl flex="3">
                <FormLabel>Produto</FormLabel>
                <Select 
                    placeholder="Selecione um produto" 
                    value={produtoSelecionadoId} 
                    onChange={(e) => setProdutoSelecionadoId(Number(e.target.value))}
                    isDisabled={!produtos} // Desabilita o select enquanto os produtos carregam
                >
                    {/* Renderiza as opções apenas se o array de produtos existir */}
                    {produtos?.map(p => <option key={p.id} value={p.id}>{`${p.nome} - R$ ${p.price.toFixed(2)}/${p.unidade_medida} (Est: ${p.quantidade_em_estoque})`}</option>)}
                </Select>
            </FormControl>
              <FormControl flex="1"><FormLabel>Qtd.</FormLabel><NumberInput value={quantidade} onChange={(_, valueAsNumber) => setQuantidade(isNaN(valueAsNumber) ? 0 : valueAsNumber)} min={0.001} precision={permiteFracao ? 3 : 0}><NumberInputField /></NumberInput></FormControl>
              <Button onClick={handleAddProduto} alignSelf="flex-end" colorScheme="green">Adicionar</Button>
            </HStack>
            <Box width="100%" mt={4}>
              <Heading size="sm">Produtos na Venda</Heading>
              {produtosVenda.map(p => (
                <HStack key={p.produto_id} justify="space-between" p={2} borderWidth={1} borderRadius="md" mt={2}>
                  <Text>{`${p.nome} (Qtd: ${p.quantidade} ${p.unidade_medida})`}</Text>
                  <IconButton aria-label="Remover produto" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleRemoveProduto(p.produto_id)} />
                </HStack>
              ))}
            </Box>
            <Heading size="md" alignSelf="flex-end" mt={4}>Total: {calcularValorTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Heading>
          </VStack>
        </ModalBody>
        <ModalFooter><Button variant="ghost" mr={3} onClick={handleClose}>Cancelar</Button><Button colorScheme="teal" onClick={handleSubmit} isLoading={mutation.isPending}>Salvar Venda</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// --- COMPONENTE DA TABELA DE VENDAS ---
const TabelaVendas = () => {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useQuery({ queryKey: ['vendas', pagina], queryFn: () => getVendas(pagina, 10), placeholderData: keepPreviousData });
  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as vendas.</Text></Center>;
  return (
    <>
      <TableContainer>
        <Table variant="striped"><TableCaption>Histórico de Vendas</TableCaption>
          <Thead><Tr><Th>Data</Th><Th>Cliente</Th><Th>Vendedor</Th><Th>Produtos</Th><Th isNumeric>Valor Total</Th></Tr></Thead>
          <Tbody>
            {data?.dados.map((venda: IVenda) => (
              <Tr key={venda.id}>
                <Td>{new Date(venda.data_movimentacao).toLocaleDateString('pt-BR')}</Td>
                <Td>{venda.cliente_nome}</Td>
                <Td>{venda.usuario_nome}</Td>
                <Td>{venda.produtos?.map(p => `${p.quantidade}x ${p.nome}`).join(', ') || 'N/A'}</Td>
                <Td isNumeric>{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};

// --- COMPONENTE DA TABELA DE DESPESAS ---
const TabelaDespesas = () => {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useQuery({ queryKey: ['despesas', pagina], queryFn: () => getDespesas(pagina, 10), placeholderData: keepPreviousData });
  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as despesas.</Text></Center>;
  return (
    <>
      <TableContainer>
        <Table variant="striped"><TableCaption>Histórico de Despesas</TableCaption>
          <Thead><Tr><Th>Data</Th><Th>Descrição</Th><Th>Registrado por</Th><Th isNumeric>Valor</Th></Tr></Thead>
          <Tbody>
            {data?.dados.map((despesa: IDespesa) => (
              <Tr key={despesa.id}>
                <Td>{new Date(despesa.data_movimentacao).toLocaleDateString('pt-BR')}</Td>
                <Td>{despesa.descricao}</Td>
                <Td>{despesa.usuario_nome}</Td>
                <Td isNumeric>{despesa.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};

// --- PÁGINA PRINCIPAL DE MOVIMENTAÇÕES ---
const MovimentacoesPage = () => {
  const { isOpen: isVendaOpen, onOpen: onVendaOpen, onClose: onVendaClose } = useDisclosure();
  const { isOpen: isDespesaOpen, onOpen: onDespesaOpen, onClose: onDespesaClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  const queryClient = useQueryClient();
  const { mutate: criarDespesa, isPending: isCreatingDespesa } = useMutation({
    mutationFn: createDespesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast({ title: 'Despesa registrada!', status: 'success' });
      onDespesaClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar despesa', description: error.message, status: 'error' });
    }
  });

  return (
    <Box p={8}>
      <Heading mb={6}>Movimentações</Heading>
      <Tabs isFitted variant="enclosed">
        <TabList mb="1em"><Tab>Vendas (Entradas)</Tab><Tab>Despesas (Saídas)</Tab></TabList>
        <TabPanels>
          <TabPanel>
            <Flex justify="space-between" mb={4}><Heading size="md">Histórico de Vendas</Heading><Button leftIcon={<AddIcon />} colorScheme="teal" onClick={onVendaOpen}>Registrar Venda</Button></Flex>
            <TabelaVendas />
          </TabPanel>
          <TabPanel>
            <Flex justify="space-between" mb={4}><Heading size="md">Histórico de Despesas</Heading>{isAdmin && (<Button leftIcon={<AddIcon />} colorScheme="red" onClick={onDespesaOpen}>Registrar Despesa</Button>)}</Flex>
            <TabelaDespesas />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <FormularioNovaVenda isOpen={isVendaOpen} onClose={onVendaClose} />
      <ModalAdicionarDespesa isOpen={isDespesaOpen} onClose={onDespesaClose} onSubmit={criarDespesa} isLoading={isCreatingDespesa} />
    </Box>
  );
};

export default MovimentacoesPage;
