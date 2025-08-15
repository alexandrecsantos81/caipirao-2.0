import {
  Box, Button, Center, Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerOverlay, Flex, FormControl, FormErrorMessage, FormLabel,
  Heading, IconButton, Input, Select, Spinner,
  Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast,
  useBreakpointValue,
  Divider,
  HStack,
  VStack,
  TableContainer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2, FiPlusSquare } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  IProduto, createProduto, deleteProduto, getProdutos, updateProduto, IProdutoForm, IEntradaEstoqueForm, registrarEntradaEstoque,
} from '../services/produto.service';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { ModalEntradaEstoque } from '../components/ModalEntradaEstoque';
import { IPaginatedResponse } from '@/types/common.types';

type ProdutoFormData = IProdutoForm & {
  outra_unidade_medida?: string;
};

const FormularioProduto = ({ isOpen, onClose, produto, onSave, isLoading }: {
  isOpen: boolean; onClose: () => void; produto: IProduto | null; onSave: (data: ProdutoFormData) => void; isLoading: boolean;
}) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<ProdutoFormData>();
  const unidadeMedida = watch('unidade_medida');
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  useEffect(() => {
    if (isOpen) {
      if (produto) {
        setValue('nome', produto.nome);
        setValue('price', produto.price);
        const unidadesPadrao = ['UN', 'KG'];
        if (unidadesPadrao.includes(produto.unidade_medida.toUpperCase())) {
          setValue('unidade_medida', produto.unidade_medida.toUpperCase());
          setValue('outra_unidade_medida', '');
        } else {
          setValue('unidade_medida', 'OUTROS');
          setValue('outra_unidade_medida', produto.unidade_medida);
        }
      } else {
        reset({ nome: '', price: undefined, unidade_medida: 'UN', outra_unidade_medida: '' });
      }
    }
  }, [isOpen, produto, setValue, reset]);

  const handleFormSubmit = (data: ProdutoFormData) => {
    const finalData = { ...data };
    if (data.unidade_medida === 'OUTROS' && data.outra_unidade_medida) {
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
              <FormControl isRequired isInvalid={!!errors.nome}>
                <FormLabel htmlFor="nome">Nome do Produto</FormLabel>
                <Input
                  id="nome"
                  placeholder="Informe o nome do produto"
                  textTransform="uppercase"
                  {...register('nome', { 
                    required: 'Nome é obrigatório',
                    validate: (value) => (value && value.trim() !== '') || 'O nome não pode ser apenas espaços'
                  })}
                />
                <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.unidade_medida}>
                <FormLabel htmlFor="unidade_medida">Unidade de Medida</FormLabel>
                <Select id="unidade_medida" {...register('unidade_medida', { required: 'Unidade de medida é obrigatória' })}>
                  <option value="UN">Unidade (UN)</option>
                  <option value="KG">Quilo (KG)</option>
                  <option value="OUTROS">Outros</option>
                </Select>
              </FormControl>
              {unidadeMedida === 'OUTROS' && (
                <FormControl isInvalid={!!errors.outra_unidade_medida}>
                  <FormLabel htmlFor="outra_unidade_medida">Especifique a Unidade (ex: DZ, CX)</FormLabel>
                  <Input 
                    id="outra_unidade_medida" 
                    textTransform="uppercase"
                    {...register('outra_unidade_medida', { required: unidadeMedida === 'OUTROS' ? 'Especifique a unidade' : false })} 
                  />
                </FormControl>
              )}
              <FormControl isRequired isInvalid={!!errors.price}>
                <FormLabel htmlFor="price">Preço (R$)</FormLabel>
                <Input
                  id="price"
                  placeholder="Informe o valor. Ex: 85.50"
                  type="text"
                  inputMode="decimal"
                  {...register('price', {
                    required: 'Preço é obrigatório',
                    valueAsNumber: true,
                    validate: {
                      isNumber: (value) => !isNaN(parseFloat(String(value))) || 'Por favor, insira um preço válido.',
                      isPositive: (value) => parseFloat(String(value)) >= 0 || 'O preço não pode ser negativo.'
                    }
                  })}
                />
                <FormErrorMessage>{errors.price?.message}</FormErrorMessage>
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

const ProdutosPage = () => {
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEstoqueOpen, onOpen: onEstoqueOpen, onClose: onEstoqueClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [pagina, setPagina] = useState(1);
  const [editingProduto, setEditingProduto] = useState<IProduto | null>(null);
  const [produtoParaEstoque, setProdutoParaEstoque] = useState<IProduto | null>(null);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<IProduto | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });
  const mobileActionsBg = useBreakpointValue({ base: 'gray.100', md: 'transparent' });

  const { data, isLoading, isError } = useQuery<IPaginatedResponse<IProduto>>({
    queryKey: ['produtos', pagina],
    // ✅ Atualiza a chamada para usar o novo limite padrão de 50
    queryFn: () => getProdutos(pagina, 50),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: (formData: IProdutoForm) => 
      editingProduto?.id ? updateProduto(editingProduto.id, formData) : createProduto(formData),
    onSuccess: () => {
      toast({ title: 'Produto salvo com sucesso!', status: 'success' });
      onFormClose();
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar produto.', description: error.response?.data?.msg || 'Ocorreu um erro', status: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      toast({ title: 'Produto deletado!', status: 'success' });
      onAlertClose();
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao deletar.', description: error.response?.data?.msg || 'Ocorreu um erro', status: 'error' });
    }
  });

  const estoqueMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IEntradaEstoqueForm }) => registrarEntradaEstoque({ id, data }),
    onSuccess: () => {
      toast({ title: 'Estoque atualizado!', status: 'success' });
      onEstoqueClose();
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar estoque.', description: error.response?.data?.error || 'Ocorreu um erro', status: 'error' });
    }
  });

  const handleSave = (formData: IProdutoForm) => {
    saveMutation.mutate(formData);
  };

  const handleDeleteClick = (produto: IProduto) => {
    setProdutoParaDeletar(produto);
    onAlertOpen();
  };

  const handleConfirmDelete = () => {
    if (produtoParaDeletar) {
      deleteMutation.mutate(produtoParaDeletar.id);
    }
  };

  const handleOpenForCreate = () => { setEditingProduto(null); onFormOpen(); };
  const handleOpenForEdit = (produto: IProduto) => { setEditingProduto(produto); onFormOpen(); };
  const handleOpenForEstoque = (produto: IProduto) => { setProdutoParaEstoque(produto); onEstoqueOpen(); };

  const renderContent = () => {
    if (isLoading && !data) return <Center p={10}><Spinner size="xl" /></Center>;
    if (isError) return <Center p={10}><Text color="red.500">Falha ao carregar os produtos.</Text></Center>;
    if (!data?.dados || data.dados.length === 0) return <Center p={10}><Text>Nenhum produto encontrado.</Text></Center>;

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
                <HStack mt={4} justify="space-around" bg={mobileActionsBg} _dark={{ bg: 'gray.700' }} p={2} borderRadius="md">
                  <Button flex="1" size="sm" leftIcon={<FiPlusSquare />} colorScheme="blue" onClick={() => handleOpenForEstoque(produto)}>Estoque</Button>
                  <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForEdit(produto)} />
                  <IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(produto)} isLoading={deleteMutation.isPending && deleteMutation.variables === produto.id} />
                </HStack>
              )}
            </Box>
          ))}
        </VStack>
      );
    }

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
                      <IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(produto)} isLoading={deleteMutation.isPending && deleteMutation.variables === produto.id} />
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
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Produtos</Heading>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleOpenForCreate} w={{ base: 'full', md: 'auto' }}>
            Novo Produto
          </Button>
        )}
      </Flex>
      
      {renderContent()}
      
      {data && data.totalPaginas > 1 && (
        <Pagination paginaAtual={data.pagina || 1} totalPaginas={data.totalPaginas || 1} onPageChange={setPagina} />
      )}
      
      <FormularioProduto 
        isOpen={isFormOpen} 
        onClose={onFormClose} 
        produto={editingProduto} 
        onSave={handleSave} 
        isLoading={saveMutation.isPending} 
      />
      <ModalEntradaEstoque 
        isOpen={isEstoqueOpen} 
        onClose={onEstoqueClose} 
        produto={produtoParaEstoque} 
        onSubmit={(formData) => produtoParaEstoque && estoqueMutation.mutate({ id: produtoParaEstoque.id, data: formData })} 
        isLoading={estoqueMutation.isPending} 
      />
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Exclusão
            </AlertDialogHeader>
            <AlertDialogBody>
              Tem certeza que deseja excluir o produto <strong>{produtoParaDeletar?.nome}</strong>? Esta ação não pode ser desfeita e pode afetar relatórios de vendas antigos.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>
                Sim, Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProdutosPage;
