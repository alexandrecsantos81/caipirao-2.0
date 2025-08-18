import {
  Box, Button, Flex, FormControl, FormLabel, Heading, IconButton,
  Input, NumberInput, NumberInputField, Select, Spinner, Text, useToast, VStack, Badge, FormErrorMessage,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { ICliente, getClientes } from '../services/cliente.service';
import { IProduto, getProdutos } from '../services/produto.service';
import { IVenda, INovaVenda, createVenda, updateVenda } from '../services/venda.service';
import { useAuth } from '../hooks/useAuth';
import { IPaginatedResponse } from '@/types/common.types';
import { useDebounce } from '../hooks/useDebounce';

// --- INTERFACES LOCAIS ---
interface ProdutoVendaItem {
  produto_id: number;
  quantidade: number;
  preco_manual?: number;
  nome: string;
  unidade_medida: string;
  preco_original: number;
}

interface FormularioNovaVendaProps {
  isOpen: boolean;
  onClose: () => void;
  vendaParaEditar: IVenda | null;
}

export const FormularioNovaVenda = ({ isOpen, onClose, vendaParaEditar }: FormularioNovaVendaProps) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [produtosNaVenda, setProdutosNaVenda] = useState<ProdutoVendaItem[]>([]);
  const [opcaoPagamento, setOpcaoPagamento] = useState<'À VISTA' | 'A PRAZO'>('À VISTA');
  const [estoqueAtual, setEstoqueAtual] = useState<number | null>(null);

  const [termoBuscaCliente, setTermoBuscaCliente] = useState('');
  const buscaClienteDebounced = useDebounce(termoBuscaCliente, 500);

  const drawerSize = useBreakpointValue({ base: 'full', md: 'xl' });
  const flexDir = useBreakpointValue<'column' |'row'>({ base: 'column', md: 'row' });

  const { control, register, handleSubmit, watch, reset, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      cliente_id: '', data_venda: new Date().toISOString().split('T')[0], data_vencimento: '',
      produto_selecionado_id: '', quantidade: '', preco_manual: '',
    },
  });

  const produtoIdAtual = watch('produto_selecionado_id');
  const quantidadeAtual = watch('quantidade');
  const precoManualAtual = watch('preco_manual');

  const { data: clientes, isLoading: isLoadingClientes } = useQuery<IPaginatedResponse<ICliente>>({ 
    queryKey: ['clientesParaVenda', buscaClienteDebounced], 
    queryFn: () => getClientes(1, 1000, buscaClienteDebounced),
    placeholderData: keepPreviousData,
    enabled: isOpen, 
  });
  
  const { data: produtos } = useQuery<IPaginatedResponse<IProduto>, Error, IProduto[]>({ 
    queryKey: ['todosProdutos'], 
    queryFn: () => getProdutos(1, 1000), 
    enabled: isOpen, 
    select: data => data.dados 
  });
  const dataVendaValue = watch('data_venda');

  useEffect(() => {
    if (produtoIdAtual && produtos) {
      const produtoInfo = produtos.find(p => p.id === Number(produtoIdAtual));
      setEstoqueAtual(produtoInfo ? produtoInfo.quantidade_em_estoque : null);
    } else {
      setEstoqueAtual(null);
    }
  }, [produtoIdAtual, produtos]);

  const valorTotalBase = useMemo(() => {
    return produtosNaVenda.reduce((total, item) => {
      const preco = item.preco_manual ?? item.preco_original;
      return total + (item.quantidade * preco);
    }, 0);
  }, [produtosNaVenda]);

  const valorTotalComItemAtual = useMemo(() => {
    const produtoInfo = produtos?.find(p => p.id === Number(produtoIdAtual));
    if (!produtoInfo || !quantidadeAtual) {
      return valorTotalBase;
    }

    const precoUnitario = Number(precoManualAtual) || produtoInfo.price;
    const valorItemAtual = Number(quantidadeAtual) * precoUnitario;

    return valorTotalBase + valorItemAtual;
  }, [valorTotalBase, produtos, produtoIdAtual, quantidadeAtual, precoManualAtual]);
  
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
      toast({ title: "Erro ao salvar venda", description: error.response?.data?.error || error.message, status: "error", duration: 6000, isClosable: true });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (vendaParaEditar) {
        setValue('cliente_id', String(vendaParaEditar.cliente_id));
        setTermoBuscaCliente(vendaParaEditar.cliente_nome);
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
        reset({ cliente_id: '', data_venda: new Date().toISOString().split('T')[0], data_vencimento: '', produto_selecionado_id: '', quantidade: '', preco_manual: '' });
        setProdutosNaVenda([]);
        setOpcaoPagamento('À VISTA');
        setTermoBuscaCliente('');
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
    const produtoInfo = produtos?.find(p => p.id === Number(produto_selecionado_id));
    if (!produtoInfo) return;

    if (produtoInfo.quantidade_em_estoque < Number(quantidade)) {
        toast({
            title: "Estoque Insuficiente!",
            description: `Você tentou adicionar ${quantidade} ${produtoInfo.unidade_medida} de "${produtoInfo.nome}", mas há apenas ${produtoInfo.quantidade_em_estoque} em estoque.`,
            status: "error",
            duration: 6000,
            isClosable: true
        });
        return;
    }

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
    setValue('quantidade', '');
    setValue('preco_manual', '');
  };

  const handleRemoveProduto = (produtoId: number) => {
    setProdutosNaVenda(prev => prev.filter(p => p.produto_id !== produtoId));
  };

  const onSubmit: SubmitHandler<any> = (data) => {
    if (produtosNaVenda.length === 0) {
        toast({ title: "Nenhum produto na venda", description: "Adicione pelo menos um produto antes de salvar.", status: "error" });
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
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">{vendaParaEditar ? 'Editar Venda' : 'Registrar Nova Venda'}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4} align="stretch">
               <Flex direction={flexDir} gap={4}>
                <FormControl isRequired isInvalid={!!errors.cliente_id} flex={1}>
                  <FormLabel>Cliente</FormLabel>
                  <Input
                    placeholder="Digite para buscar um cliente..."
                    value={termoBuscaCliente}
                    onChange={(e) => {
                      setTermoBuscaCliente(e.target.value);
                      if (getValues('cliente_id')) {
                        setValue('cliente_id', '');
                      }
                    }}
                  />
                  {isLoadingClientes && <Spinner size="sm" mt={2} />}
                  {clientes && termoBuscaCliente && getValues('cliente_id') === '' && (
                    <VStack
                      mt={1}
                      borderWidth={1}
                      borderRadius="md"
                      maxH="150px"
                      overflowY="auto"
                      align="stretch"
                      spacing={0}
                      bg={useColorModeValue('white', 'gray.700')}
                      zIndex="dropdown"
                      position="absolute"
                      width="98%"
                    >
                      {clientes.dados.length > 0 ? clientes.dados.map((c: ICliente) => (
                        <Button
                          key={c.id}
                          onClick={() => {
                            setValue('cliente_id', String(c.id), { shouldValidate: true });
                            setTermoBuscaCliente(c.nome);
                          }}
                          justifyContent="flex-start"
                          variant="ghost"
                          borderRadius={0}
                        >
                          {c.nome}
                        </Button>
                      )) : <Text p={2} color="gray.500">Nenhum cliente encontrado.</Text>}
                    </VStack>
                  )}
                  <FormErrorMessage>{errors.cliente_id && "Selecione um cliente da lista."}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired flex={1}>
                  <FormLabel>Data da Venda</FormLabel>
                  <Input type="date" {...register('data_venda')} />
                </FormControl>
              </Flex>
              <Flex direction={flexDir} gap={4}>
                 <FormControl isRequired flex={1}>
                  <FormLabel>Opção de Pagamento</FormLabel>
                  <Select value={opcaoPagamento} onChange={(e) => setOpcaoPagamento(e.target.value as any)}>
                    <option value="À VISTA">À VISTA</option>
                    <option value="A PRAZO">A PRAZO</option>
                  </Select>
                 </FormControl>
                <FormControl isRequired={opcaoPagamento === 'A PRAZO'} flex={1}>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Input type="date" {...register('data_vencimento')} isDisabled={opcaoPagamento === 'À VISTA'} />
                </FormControl>
              </Flex>
              <Box p={4} borderWidth={1} borderRadius="md" mt={4}>
                 <Heading size="sm" mb={3}>Adicionar Produtos</Heading>
                <Flex direction={flexDir} gap={2} align="flex-end">
                  <FormControl flex={3}>
                    <FormLabel>Produto</FormLabel>
                    <Select placeholder="Selecione..." {...register('produto_selecionado_id')}>
                      {produtos?.map((p: IProduto) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </Select>
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel>Estoque Atual</FormLabel>
                    <Input 
                      isReadOnly 
                      value={estoqueAtual !== null ? estoqueAtual : '---'}
                      textAlign="center"
                      fontWeight="bold"
                      bg={useColorModeValue('gray.100', 'gray.600')}
                      borderColor={
                        estoqueAtual !== null && estoqueAtual <= 0 
                          ? 'red.500' 
                          : useColorModeValue('gray.200', 'gray.600')
                      }
                      color={
                        estoqueAtual !== null && estoqueAtual <= 0 
                          ? 'red.500' 
                          : 'inherit'
                      }
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Qtd/ Peso</FormLabel>
                    <Controller 
                      name="quantidade" 
                      control={control} 
                      render={({ field }) => (
                        <NumberInput {...field} min={0.001} precision={3}>
                          <NumberInputField placeholder="Info Qtd/Peso" />
                        </NumberInput>
                      )} 
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Preço Manual (R$)</FormLabel>
                    <Input placeholder="Opcional" {...register('preco_manual')} type="number" step="0.01" />
                  </FormControl>
                  <Button colorScheme="green" onClick={handleAddProduto} alignSelf={{ base: 'stretch', md: 'flex-end' }}><FiPlus /></Button>
                </Flex>
              </Box>
              <VStack spacing={2} align="stretch" mt={4}>
                {produtosNaVenda.map(p => (
                  <Flex key={p.produto_id} justify="space-between" align="center" p={2} borderWidth={1} borderRadius="md">
                    <Box>
                      <Text fontWeight="bold">{p.nome}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {p.quantidade} {p.unidade_medida} x {(p.preco_manual ?? p.preco_original).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {p.preco_manual !== undefined && <Badge ml={2} colorScheme="orange">Manual</Badge>}
                      </Text>
                    </Box>
                    <IconButton aria-label="Remover" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => handleRemoveProduto(p.produto_id)} />
                  </Flex>
                ))}
              </VStack>
              <Flex justify="flex-end" mt={4}>
                <Box textAlign="right">
                  <Text fontSize="lg">Vendedor: {user?.nome}</Text>
                  <Heading size="lg" color="teal.500">
                    Total: {valorTotalComItemAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Heading>
                </Box>
              </Flex>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={mutation.isPending}>Salvar Venda</Button>
          </DrawerFooter>
        </form>
       </DrawerContent>
    </Drawer>
  );
};
