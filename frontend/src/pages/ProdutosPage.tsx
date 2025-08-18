// frontend/src/pages/ProdutosPage.tsx

import {
  Box, Button, Center, Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerOverlay, Flex, FormControl, FormErrorMessage, FormLabel,
  Heading, IconButton, Input, Select, Spinner,
  Text, useDisclosure, useToast,
  useBreakpointValue,
  Divider,
  HStack,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2, FiPlusSquare, FiSearch } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import {
  IProduto, createProduto, deleteProduto, getProdutos, updateProduto, IProdutoForm, IEntradaEstoqueForm, registrarEntradaEstoque,
} from '../services/produto.service';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import { ModalEntradaEstoque } from '../components/ModalEntradaEstoque';
import { IPaginatedResponse } from '@/types/common.types';
import { useDebounce } from '../hooks/useDebounce';

// --- COMPONENTES INTERNOS ---

// Formulário para Criar/Editar Produto
const FormularioProduto = ({ isOpen, onClose, produto, onSave, isLoading }: {
  isOpen: boolean; onClose: () => void; produto: IProduto | null; onSave: (data: IProdutoForm) => void; isLoading: boolean;
}) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<IProdutoForm & { outra_unidade_medida?: string }>();
  const unidadeMedida = watch('unidade_medida');
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  useEffect(() => {
    if (isOpen) {
      if (produto) {
        const unidadesPadrao = ['UN', 'KG'];
        const isStandardUnit = unidadesPadrao.includes(produto.unidade_medida.toUpperCase());
        reset({
          nome: produto.nome,
          price: produto.price,
          unidade_medida: isStandardUnit ? produto.unidade_medida.toUpperCase() : 'OUTROS',
          outra_unidade_medida: isStandardUnit ? '' : produto.unidade_medida,
        });
      } else {
        reset({ nome: '', price: undefined, unidade_medida: 'UN', outra_unidade_medida: '' });
      }
    }
  }, [isOpen, produto, reset]);

  const handleFormSubmit = (data: IProdutoForm & { outra_unidade_medida?: string }) => {
    const finalData: IProdutoForm = {
      nome: data.nome,
      price: data.price,
      unidade_medida: data.unidade_medida === 'OUTROS' && data.outra_unidade_medida ? data.outra_unidade_medida : data.unidade_medida,
    };
    onSave(finalData);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{produto ? 'Editar Produto' : 'Criar Novo Produto'}</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.nome}><FormLabel>Nome do Produto</FormLabel><Input placeholder="Informe o nome do produto" textTransform="uppercase" {...register('nome', { required: 'Nome é obrigatório', validate: (v) => (v && v.trim() !== '') || 'Não pode conter só espaços' })} /><FormErrorMessage>{errors.nome?.message}</FormErrorMessage></FormControl>
            <FormControl isInvalid={!!errors.unidade_medida}><FormLabel>Unidade de Medida</FormLabel><Select {...register('unidade_medida', { required: 'Unidade é obrigatória' })}><option value="UN">Unidade (UN)</option><option value="KG">Quilo (KG)</option><option value="OUTROS">Outros</option></Select></FormControl>
            {unidadeMedida === 'OUTROS' && (<FormControl isInvalid={!!errors.outra_unidade_medida}><FormLabel>Especifique a Unidade</FormLabel><Input textTransform="uppercase" {...register('outra_unidade_medida', { required: unidadeMedida === 'OUTROS' })} /></FormControl>)}
            <FormControl isRequired isInvalid={!!errors.price}><FormLabel>Preço (R$)</FormLabel><Input placeholder="Ex: 85.50" type="text" inputMode="decimal" {...register('price', { required: 'Preço é obrigatório', valueAsNumber: true, validate: { isNumber: (v) => !isNaN(parseFloat(String(v))), isPositive: (v) => parseFloat(String(v)) >= 0 } })} /><FormErrorMessage>{errors.price?.message}</FormErrorMessage></FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px"><Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// --- COMPONENTE PRINCIPAL ---

const ProdutosPage = () => {
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEstoqueOpen, onOpen: onEstoqueOpen, onClose: onEstoqueClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const buscaDebounced = useDebounce(termoBusca, 500);
  
  const [editingProduto, setEditingProduto] = useState<IProduto | null>(null);
  const [produtoParaEstoque, setProdutoParaEstoque] = useState<IProduto | null>(null);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<IProduto | null>(null);
  
  const cancelRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<FixedSizeList>(null);
  
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => { if (buscaDebounced) { setPagina(1); } }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery<IPaginatedResponse<IProduto>>({
    queryKey: ['produtos', pagina, buscaDebounced],
    queryFn: () => getProdutos(pagina, 50, buscaDebounced),
    placeholderData: keepPreviousData,
  });

  useEffect(() => { if (listRef.current) { listRef.current.scrollTo(0); } }, [data]);

  const saveMutation = useMutation({
    mutationFn: (formData: IProdutoForm) => editingProduto?.id ? updateProduto(editingProduto.id, formData) : createProduto(formData),
    onSuccess: () => { toast({ title: 'Produto salvo!', status: 'success' }); onFormClose(); queryClient.invalidateQueries({ queryKey: ['produtos'] }); },
    onError: (error: any) => { toast({ title: 'Erro ao salvar.', description: error.response?.data?.msg || 'Ocorreu um erro', status: 'error' }); }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => { toast({ title: 'Produto deletado!', status: 'success' }); onAlertClose(); queryClient.invalidateQueries({ queryKey: ['produtos'] }); },
    onError: (error: any) => { toast({ title: 'Erro ao deletar.', description: error.response?.data?.msg || 'Ocorreu um erro', status: 'error' }); }
  });

  const estoqueMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IEntradaEstoqueForm }) => registrarEntradaEstoque({ id, data }),
    onSuccess: () => { toast({ title: 'Estoque atualizado!', status: 'success' }); onEstoqueClose(); queryClient.invalidateQueries({ queryKey: ['produtos'] }); },
    onError: (error: any) => { toast({ title: 'Erro ao adicionar estoque.', description: error.response?.data?.error || 'Ocorreu um erro', status: 'error' }); }
  });

  const handleSave = (formData: IProdutoForm) => { saveMutation.mutate(formData); };
  const handleDeleteClick = (produto: IProduto) => { setProdutoParaDeletar(produto); onAlertOpen(); };
  const handleConfirmDelete = () => { if (produtoParaDeletar) { deleteMutation.mutate(produtoParaDeletar.id); } };
  const handleOpenForCreate = () => { setEditingProduto(null); onFormOpen(); };
  const handleOpenForEdit = (produto: IProduto) => { setEditingProduto(produto); onFormOpen(); };
  const handleOpenForEstoque = (produto: IProduto) => { setProdutoParaEstoque(produto); onEstoqueOpen(); };

  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Componente para renderizar uma linha da tabela no Desktop
  const RowDesktop = ({ index, style }: ListChildComponentProps) => {
    const produto = data!.dados[index];
    return (
      <Flex style={style} align="center" _hover={{ bg: rowHoverBg }} borderBottomWidth="1px" borderColor={borderColor}>
        <Text width="40%" px={4} isTruncated title={produto.nome}>{produto.nome}</Text>
        <Text width="15%" px={4} textAlign="center">{produto.unidade_medida}</Text>
        <Text width="15%" px={4} textAlign="center">{produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <Text width="15%" px={4} textAlign="center">{produto.quantidade_em_estoque.toFixed(2)}</Text>
        {isAdmin && (
          <Flex width="15%" px={4} justify="center">
            <HStack spacing={2}>
              <Tooltip label="Registrar Entrada" hasArrow><IconButton aria-label="Entrada de Estoque" icon={<FiPlusSquare />} size="sm" colorScheme="blue" onClick={() => handleOpenForEstoque(produto)} /></Tooltip>
              <Tooltip label="Editar Produto" hasArrow><IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => handleOpenForEdit(produto)} /></Tooltip>
              <Tooltip label="Excluir Produto" hasArrow><IconButton aria-label="Deletar" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => handleDeleteClick(produto)} /></Tooltip>
            </HStack>
          </Flex>
        )}
      </Flex>
    );
  };

  // Componente para renderizar um card no Mobile
  const RowMobile = ({ index, style }: ListChildComponentProps) => {
    const produto = data!.dados[index];
    return (
      <Box style={style} px={2} py={2}>
        <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Flex justify="space-between" align="center">
            <Heading size="sm" noOfLines={1}>{produto.nome}</Heading>
            <Text fontWeight="bold" color="teal.500">{produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          </Flex>
          <Divider my={2} />
          <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Unidade:</Text><Text fontWeight="bold">{produto.unidade_medida.toUpperCase()}</Text></HStack>
          <HStack justify="space-between" mt={1}><Text fontSize="sm" color="gray.500">Estoque:</Text><Text fontWeight="bold">{produto.quantidade_em_estoque.toFixed(2)} {produto.unidade_medida}</Text></HStack>
          {isAdmin && (
            <HStack mt={4} justify="space-around" bg={useColorModeValue('gray.100', 'gray.700')} p={2} borderRadius="md">
              <Button flex="1" size="sm" leftIcon={<FiPlusSquare />} colorScheme="blue" onClick={() => handleOpenForEstoque(produto)}>Estoque</Button>
              <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForEdit(produto)} />
              <IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(produto)} />
            </HStack>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box p={{ base: 2, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box textAlign={{ base: 'center', md: 'left' }}><Heading>Gestão de Produtos</Heading><Text color="gray.500">Adicione, edite e controle o estoque dos seus produtos.</Text></Box>
        {isAdmin && (<Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleOpenForCreate} w={{ base: 'full', md: 'auto' }}>Novo Produto</Button>)}
      </Flex>
      
      <Box mb={6}><InputGroup><InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement><Input placeholder="Buscar por nome do produto..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} /></InputGroup></Box>

      {isLoading ? (<Center p={10}><Spinner size="xl" /></Center>) : 
       isError ? (<Center p={10}><Text color="red.500">Não foi possível carregar os produtos.</Text></Center>) : 
       !data?.dados || data.dados.length === 0 ? (<Center p={10}><Text>Nenhum produto encontrado.</Text></Center>) :
      (
        <>
          {isMobile ? (
            <FixedSizeList height={600} itemCount={data.dados.length} itemSize={175} width="100%" ref={listRef}>{RowMobile}</FixedSizeList>
          ) : (
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
              <Flex bg={headerBg} borderBottomWidth="1px" fontWeight="bold" role="row" pr="15px">
                <Text width="40%" p={4}>Nome</Text>
                <Text width="15%" p={4} textAlign="center">Unidade</Text>
                <Text width="15%" p={4} textAlign="center">Preço</Text>
                <Text width="15%" p={4} textAlign="center">Estoque</Text>
                {isAdmin && <Text width="15%" p={4} textAlign="center">Ações</Text>}
              </Flex>
              <FixedSizeList height={600} itemCount={data.dados.length} itemSize={62} width="100%" ref={listRef}>{RowDesktop}</FixedSizeList>
            </Box>
          )}
          <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
        </>
      )}
      
      <FormularioProduto isOpen={isFormOpen} onClose={onFormClose} produto={editingProduto} onSave={handleSave} isLoading={saveMutation.isPending} />
      <ModalEntradaEstoque isOpen={isEstoqueOpen} onClose={onEstoqueClose} produto={produtoParaEstoque} onSubmit={(formData) => produtoParaEstoque && estoqueMutation.mutate({ id: produtoParaEstoque.id, data: formData })} isLoading={estoqueMutation.isPending} />
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose}>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Exclusão</AlertDialogHeader>
          <AlertDialogBody>Tem certeza que deseja excluir o produto <strong>{produtoParaDeletar?.nome}</strong>? Esta ação não pode ser desfeita e pode afetar relatórios de vendas antigos.</AlertDialogBody>
          <AlertDialogFooter><Button ref={cancelRef} onClick={onAlertClose}>Cancelar</Button><Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button></AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProdutosPage;
