// frontend/src/pages/VendasPage.tsx

import { useState } from 'react';
import {
  Box, Button, Heading, Spinner, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  TableCaption, Text, useToast, IconButton, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, Select, VStack, HStack, NumberInput, NumberInputField,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

import { getVendas, createVenda, deleteVenda, INovaVenda, IVenda } from '../services/venda.service';
import { getClientes, ICliente, IPaginatedResponse } from '../services/cliente.service';
import { getProdutos, IProduto } from '../services/produto.service';

const FormularioNovaVenda = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [clienteId, setClienteId] = useState<number | ''>('');
  const [produtosVenda, setProdutosVenda] = useState<{ produto_id: number; quantidade: number; valor_unitario: number; nome: string; }[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const { data: clientesData } = useQuery<IPaginatedResponse<ICliente>>({ 
    queryKey: ['clientes', 1, 1000],
    queryFn: ({ queryKey }) => getClientes(queryKey[1] as number, queryKey[2] as number) 
  });

  const { data: produtosData } = useQuery<IPaginatedResponse<IProduto>>({ 
    queryKey: ['produtos', 1, 1000],
    queryFn: ({ queryKey }) => getProdutos(queryKey[1] as number, queryKey[2] as number) 
  });

  const mutation = useMutation({
    mutationFn: createVenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({ title: "Venda registrada!", status: "success", duration: 3000, isClosable: true });
      handleClose();
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar venda", description: error.message, status: "error", duration: 5000, isClosable: true });
    }
  });

  const handleAddProduto = () => {
    if (!produtoSelecionado || quantidade <= 0) return;
    const produto = produtosData?.dados.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    if (produtosVenda.some(p => p.produto_id === produto.id)) {
      toast({ title: "Produto já adicionado", status: "warning", duration: 2000, isClosable: true });
      return;
    }

    setProdutosVenda([...produtosVenda, {
      produto_id: produto.id,
      quantidade,
      valor_unitario: produto.price,
      nome: produto.nome
    }]);
    setProdutoSelecionado('');
    setQuantidade(1);
  };

  const handleRemoveProduto = (produtoId: number) => {
    setProdutosVenda(produtosVenda.filter(p => p.produto_id !== produtoId));
  };

  const calcularValorTotal = () => {
    return produtosVenda.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0);
  };

  // --- FUNÇÃO CORRIGIDA ---
  const handleSubmit = () => {
    if (!clienteId || produtosVenda.length === 0) {
      toast({ title: "Preencha todos os campos", description: "Selecione um cliente e adicione pelo menos um produto.", status: "error", duration: 3000, isClosable: true });
      return;
    }

    // O objeto agora corresponde à interface INovaVenda
    const hoje = new Date().toISOString();

    const novaVenda: INovaVenda = {
      cliente_id: Number(clienteId),
      data_venda: hoje,
      opcao_pagamento: 'À VISTA', // Valor padrão, idealmente viria de um input no formulário
      data_vencimento: hoje, // Valor padrão, idealmente viria de um input no formulário
      produtos: produtosVenda.map(({ produto_id, quantidade }) => ({
        produto_id,
        quantidade,
      }))
    };

    mutation.mutate(novaVenda);
  };

  const handleClose = () => {
    setClienteId('');
    setProdutosVenda([]);
    setProdutoSelecionado('');
    setQuantidade(1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Registrar Nova Venda</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Cliente</FormLabel>
              <Select placeholder="Selecione um cliente" value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))}>
                {clientesData?.dados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </FormControl>

            <Heading size="md" mt={6}>Adicionar Produtos</Heading>
            <HStack width="100%">
              <FormControl flex="3">
                <FormLabel>Produto</FormLabel>
                <Select placeholder="Selecione um produto" value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(Number(e.target.value))}>
                  {produtosData?.dados.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>)}
                </Select>
              </FormControl>
              <FormControl flex="1">
                <FormLabel>Qtd.</FormLabel>
                <NumberInput value={quantidade} onChange={(_, valueAsNumber) => setQuantidade(valueAsNumber)} min={1}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <Button onClick={handleAddProduto} alignSelf="flex-end" colorScheme="green">Adicionar</Button>
            </HStack>

            <Box width="100%" mt={4}>
              <Heading size="sm">Produtos na Venda</Heading>
              {produtosVenda.map(p => (
                <HStack key={p.produto_id} justify="space-between" p={2} borderWidth={1} borderRadius="md" mt={2}>
                  <Text>{p.nome} (Qtd: {p.quantidade})</Text>
                  <IconButton aria-label="Remover produto" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleRemoveProduto(p.produto_id)} />
                </HStack>
              ))}
            </Box>
            
            <Heading size="md" alignSelf="flex-end" mt={4}>
              Total: {calcularValorTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Heading>

          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>Cancelar</Button>
          <Button colorScheme="teal" onClick={handleSubmit} isLoading={mutation.isPending}>Salvar Venda</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const VendasPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: vendasData, isLoading, isError } = useQuery<IPaginatedResponse<IVenda>>({ 
    queryKey: ['vendas', 1, 100],
    queryFn: ({ queryKey }) => getVendas(queryKey[1] as number, queryKey[2] as number) 
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({ title: 'Sucesso!', description: 'Venda deletada com sucesso.', status: 'success', duration: 3000, isClosable: true });
    },
    onError: (error) => {
      toast({ title: 'Erro.', description: error.message, status: 'error', duration: 5000, isClosable: true });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta venda?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box p={8}>
      <FormularioNovaVenda isOpen={isOpen} onClose={onClose} />

      <Heading as="h1" mb={6}>Registro de Vendas</Heading>
      
      <Button leftIcon={<AddIcon />} colorScheme="teal" mb={6} onClick={onOpen}>
        Registrar Nova Venda
      </Button>

      {isLoading && <Spinner size="xl" />}
      {isError && <Text color="red.500">Não foi possível carregar as vendas.</Text>}
      
      {vendasData && (
        <TableContainer>
          <Table variant="simple">
            <TableCaption>Lista de todas as vendas registradas</TableCaption>
            <Thead>
              <Tr>
                <Th>Data</Th>
                <Th>Cliente</Th>
                <Th>Vendedor</Th>
                <Th isNumeric>Valor Total</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {vendasData.dados.map((venda) => (
                <Tr key={venda.id}>
                  <Td>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                  <Td>{venda.cliente_nome}</Td>
                  <Td>{venda.usuario_nome}</Td>
                  <Td isNumeric>{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                  <Td>
                    <IconButton aria-label="Deletar venda" icon={<DeleteIcon />} colorScheme="red" onClick={() => handleDelete(venda.id)} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default VendasPage;
