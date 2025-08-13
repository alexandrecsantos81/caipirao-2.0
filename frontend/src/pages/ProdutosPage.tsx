// frontend/src/pages/ProdutosPage.tsx

import {
  Box, Button, Center, Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel,
  Heading, IconButton, Input, NumberInput, NumberInputField, Select, Spinner,
  Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast,
  useBreakpointValue,
  Divider,
  HStack,
  VStack,
  TableContainer,
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2, FiPlusSquare } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import {
  IProduto, createProduto, deleteProduto, getProdutos, updateProduto, IProdutoForm, IEntradaEstoqueForm, registrarEntradaEstoque,
} from '../services/produto.service';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { ModalEntradaEstoque } from '../components/ModalEntradaEstoque';
import { IPaginatedResponse } from '@/types/common.types';

// --- SUB-COMPONENTE: FORMULÁRIO DE PRODUTO ---
type ProdutoFormData = IProdutoForm & {
  outra_unidade_medida?: string;
};

const FormularioProduto = ({ isOpen, onClose, produto, onSave, isLoading }: {
  isOpen: boolean; onClose: () => void; produto: IProduto | null; onSave: (data: ProdutoFormData) => void; isLoading: boolean;
}) => {
  const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm<ProdutoFormData>();
  const unidadeMedida = watch('unidade_medida');
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  useEffect(() => {
    if (isOpen) {
      if (produto) {
        setValue('nome', produto.nome);
        setValue('price', produto.price);
        const unidadesPadrao = ['un', 'kg'];
        if (unidadesPadrao.includes(produto.unidade_medida)) {
          setValue('unidade_medida', produto.unidade_medida);
          setValue('outra_unidade_medida', '');
        } else {
          setValue('unidade_medida', 'outros');
          setValue('outra_unidade_medida', produto.unidade_medida);
        }
      } else {
        reset({ nome: '', price: undefined, unidade_medida: 'un', outra_unidade_medida: '' });
      }
    }
  }, [isOpen, produto, setValue, reset]);

  const handleFormSubmit = (data: ProdutoFormData) => {
    const finalData = { ...data };
    if (data.unidade_medida === 'outros' && data.outra_unidade_medida) {
      finalData.unidade_medida = data.outra_unidade_medida;
    }
    onSave(finalData);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">{produto ? 'Editar Produto' : 'Criar Novo Produto'}</DrawerHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.nome}>
                <FormLabel htmlFor="nome">Nome do Produto</FormLabel>
                <Input
                  id="nome"
                  placeholder="Informe o nome do produto"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                />
              </FormControl>
              <FormControl isInvalid={!!errors.unidade_medida}>
                <FormLabel htmlFor="unidade_medida">Unidade de Medida</FormLabel>
                <Select id="unidade_medida" {...register('unidade_medida', { required: 'Unidade de medida é obrigatória' })}>
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="outros">Outros</option>
                </Select>
              </FormControl>
              {unidadeMedida === 'outros' && (
                <FormControl isInvalid={!!errors.outra_unidade_medida}>
                  <FormLabel htmlFor="outra_unidade_medida">Especifique a Unidade (ex: dz, cx)</FormLabel>
                  <Input id="outra_unidade_medida" {...register('outra_unidade_medida', { required: unidadeMedida === 'outros' ? 'Especifique a unidade' : false })} />
                </FormControl>
              )}
              <FormControl isInvalid={!!errors.price}>
                <FormLabel htmlFor="price">Preço (R$)</FormLabel>
                <Controller
                  name="price"
                  control={control}
                  rules={{ required: 'Preço é obrigatório', min: { value: 0, message: 'Preço não pode ser negativo' } }}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <NumberInput
                      id="price"
                      onChange={(_valAsString, valAsNumber) => onChange(valAsNumber)}
                      onBlur={onBlur}
                      value={value}
                      ref={ref}
                      precision={2}
                      step={0.1}
                      min={0}
                    >
                      <NumberInputField placeholder="Informe o valor" />
                    </NumberInput>
                  )}
                />
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};


// --- COMPONENTE PRINCIPAL: PÁGINA DE PRODUTOS ---
const ProdutosPage = () => {
  // Hooks são chamados no topo, incondicionalmente
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEstoqueOpen, onOpen: onEstoqueOpen, onClose: onEstoqueClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();
  
  // Estados locais para dados, paginação e UI
  const [data, setData] = useState<IPaginatedResponse<IProduto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [editingProduto, setEditingProduto] = useState<IProduto | null>(null);
  const [produtoParaEstoque, setProdutoParaEstoque] = useState<IProduto | null>(null);
  
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Funções de manipulação de dados
  const fetchData = async (page: number) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const result = await getProdutos(page, 10);
      setData(result);
    } catch (error) {
      setIsError(true);
      toast({ title: 'Erro ao buscar produtos', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagina);
  }, [pagina]);

  const refreshData = () => fetchData(pagina);

  const handleDelete = async (id: number) => {
    setIsMutating(true);
    try {
      await deleteProduto(id);
      toast({ title: 'Produto deletado!', status: 'success' });
      await refreshData();
    } catch (error: any) {
      toast({ title: 'Erro ao deletar.', description: error.response?.data?.message || 'Ocorreu um erro', status: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleSave = async (formData: IProdutoForm) => {
    setIsMutating(true);
    try {
      if (editingProduto?.id) {
        await updateProduto(editingProduto.id, formData);
      } else {
        await createProduto(formData);
      }
      toast({ title: 'Produto salvo com sucesso!', status: 'success' });
      onFormClose();
      await refreshData();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar produto.', description: error.response?.data?.message || 'Ocorreu um erro', status: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveEstoque = async (formData: IEntradaEstoqueForm) => {
    if (produtoParaEstoque) {
      setIsMutating(true);
      try {
        await registrarEntradaEstoque({ id: produtoParaEstoque.id, data: formData });
        toast({ title: 'Estoque atualizado!', status: 'success' });
        onEstoqueClose();
        await refreshData();
      } catch (error: any) {
        toast({ title: 'Erro ao adicionar estoque.', description: error.response?.data?.message || 'Ocorreu um erro', status: 'error' });
      } finally {
        setIsMutating(false);
      }
    }
  };

  const handleOpenForCreate = () => { setEditingProduto(null); onFormOpen(); };
  const handleOpenForEdit = (produto: IProduto) => { setEditingProduto(produto); onFormOpen(); };
  const handleOpenForEstoque = (produto: IProduto) => { setProdutoParaEstoque(produto); onEstoqueOpen(); };

  // Função de renderização que decide o que mostrar (Tabela ou Cards)
  const renderContent = () => {
    if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
    if (isError) return <Center p={10}><Text color="red.500">Falha ao carregar os produtos.</Text></Center>;
    if (!data?.dados || data.dados.length === 0) return <Center p={10}><Text>Nenhum produto encontrado.</Text></Center>;

    // Se for mobile, renderiza a lista de cards
    if (isMobile) {
      return (
        <VStack spacing={4} align="stretch">
          {data.dados.map((produto) => (
            <Box key={produto.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
              <Flex justify="space-between" align="center">
                <Heading size="sm" noOfLines={1}>{produto.nome}</Heading>
                <Text fontWeight="bold" color="teal.500">{produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
              </Flex>
              <Divider my={2} />
              <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Unidade:</Text><Text fontWeight="bold">{produto.unidade_medida.toUpperCase()}</Text></HStack>
              <HStack justify="space-between" mt={1}><Text fontSize="sm" color="gray.500">Estoque:</Text><Text fontWeight="bold">{produto.quantidade_em_estoque} {produto.unidade_medida}</Text></HStack>
              {isAdmin && (
                <HStack mt={4} justify="space-around" bg={useBreakpointValue({ base: 'gray.100', md: 'transparent' })} _dark={{ bg: 'gray.700' }} p={2} borderRadius="md">
                  <Button flex="1" size="sm" leftIcon={<FiPlusSquare />} colorScheme="blue" onClick={() => handleOpenForEstoque(produto)}>Estoque</Button>
                  <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForEdit(produto)} />
                  <IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDelete(produto.id)} isLoading={isMutating} />
                </HStack>
              )}
            </Box>
          ))}
        </VStack>
      );
    }

    // Se for desktop, renderiza a tabela
    return (
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th><Th>Unidade</Th><Th isNumeric>Preço (R$)</Th><Th isNumeric>Estoque Atual</Th>
              {isAdmin && <Th>Ações</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {data.dados.map((produto) => (
              <Tr key={produto.id}>
                <Td>{produto.nome}</Td>
                <Td>{produto.unidade_medida}</Td>
                <Td isNumeric>{typeof produto.price === 'number' ? produto.price.toFixed(2) : '0.00'}</Td>
                <Td isNumeric>{produto.quantidade_em_estoque}</Td>
                {isAdmin && (
                  <Td>
                    <HStack spacing={2}>
                      <Button size="sm" leftIcon={<FiPlusSquare />} variant="outline" colorScheme="blue" onClick={() => handleOpenForEstoque(produto)}>Entrada</Button>
                      <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForEdit(produto)} />
                      <IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDelete(produto.id)} isLoading={isMutating} />
                    </HStack>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      {/* Cabeçalho da Página */}
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Produtos</Heading>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleOpenForCreate} w={{ base: 'full', md: 'auto' }}>
            Novo Produto
          </Button>
        )}
      </Flex>
      
      {/* Conteúdo Principal (Tabela ou Cards) */}
      {renderContent()}
      
      {/* Paginação */}
      {data && data.totalPaginas > 1 && (
        <Pagination paginaAtual={data.pagina || 1} totalPaginas={data.totalPaginas || 1} onPageChange={setPagina} />
      )}
      
      {/* Modais e Drawers (Renderizados incondicionalmente para não violar regras de hooks) */}
      <FormularioProduto 
        isOpen={isFormOpen} 
        onClose={onFormClose} 
        produto={editingProduto} 
        onSave={handleSave} 
        isLoading={isMutating} 
      />
      <ModalEntradaEstoque 
        isOpen={isEstoqueOpen} 
        onClose={onEstoqueClose} 
        produto={produtoParaEstoque} 
        onSubmit={handleSaveEstoque} 
        isLoading={isMutating} 
      />
    </Box>
  );
};

export default ProdutosPage;
