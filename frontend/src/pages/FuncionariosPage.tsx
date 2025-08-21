// frontend/src/pages/FuncionariosPage.tsx

import {
  Box, Button, Flex, Heading, IconButton, Spinner, Text,
  useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, FormErrorMessage,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  useBreakpointValue,
  Divider,
  Center,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useColorModeValue,
  Switch,
  Tag,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import {
  IFuncionario, IFuncionarioForm, getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario
} from '../services/funcionario.service';
// import { useAuth } from '../hooks/useAuth'; // Removido pois não é usado
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

// --- COMPONENTES E FUNÇÕES AUXILIARES ---

const aplicarMascaraCpf = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const FormularioFuncionario = ({ isOpen, onClose, funcionario, onSave, isLoading }: { 
  isOpen: boolean; 
  onClose: () => void; 
  funcionario: IFuncionario | null; 
  onSave: (data: IFuncionarioForm, id?: number) => void;
  isLoading: boolean;
}) => {
  const { register, handleSubmit, reset, watch, formState: { errors }, control } = useForm<IFuncionarioForm>(); // Adicionado 'watch' aqui
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  
  useEffect(() => {
    if (isOpen) {
      if (funcionario) {
        reset({
          ...funcionario,
          cpf: funcionario.cpf ? aplicarMascaraCpf(funcionario.cpf) : ''
        });
      } else {
        reset({ nome: '', cpf: '', funcao: '', status: 'ATIVO' });
      }
    }
  }, [funcionario, isOpen, reset]);

  const onSubmit: SubmitHandler<IFuncionarioForm> = (data) => {
    onSave(data, funcionario?.id);
  };

  const statusValue = watch('status'); // Agora 'watch' está disponível

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{funcionario ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.nome}>
              <FormLabel>Nome</FormLabel>
              <Input {...register('nome', { required: 'Nome é obrigatório' })} textTransform="uppercase" />
              <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.cpf}>
              <FormLabel>CPF (Opcional)</FormLabel>
              <Controller
                name="cpf"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input value={value || ''} onChange={(e) => onChange(aplicarMascaraCpf(e.target.value))} placeholder="000.000.000-00" />
                )}
              />
            </FormControl>
            <FormControl><FormLabel>Função (Opcional)</FormLabel><Input {...register('funcao')} textTransform="uppercase" /></FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="status-switch" mb="0">Status</FormLabel>
              <Controller
                name="status"
                control={control}
                defaultValue="ATIVO"
                render={({ field }) => (
                  <Switch id="status-switch" isChecked={field.value === 'ATIVO'} onChange={(e) => field.onChange(e.target.checked ? 'ATIVO' : 'INATIVO')} />
                )}
              />
              <Tag ml={3} colorScheme={statusValue === 'ATIVO' ? 'green' : 'red'}>{statusValue}</Tag>
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---

const FuncionariosPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();
  
  const [selectedFuncionario, setSelectedFuncionario] = useState<IFuncionario | null>(null);
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const buscaDebounced = useDebounce(termoBusca, 500);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const listRef = useRef<FixedSizeList>(null);

  useEffect(() => { if (buscaDebounced) setPagina(1); }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['funcionarios', pagina, buscaDebounced],
    queryFn: () => getFuncionarios(pagina, 50, buscaDebounced, ''),
    placeholderData: keepPreviousData,
  });

  useEffect(() => { if (listRef.current) listRef.current.scrollTo(0); }, [data]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: IFuncionarioForm; id?: number }) => 
      id ? updateFuncionario({ id, data }) : createFuncionario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({ title: `Funcionário salvo com sucesso!`, status: 'success' });
      onDrawerClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteFuncionario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({ title: 'Funcionário excluído com sucesso!', status: 'success' });
      onConfirmModalClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleAddClick = () => { setSelectedFuncionario(null); onDrawerOpen(); };
  const handleEditClick = (func: IFuncionario) => { setSelectedFuncionario(func); onDrawerOpen(); };
  const handleDeleteClick = (func: IFuncionario) => { setSelectedFuncionario(func); onConfirmModalOpen(); };
  const handleConfirmDelete = () => { if (selectedFuncionario) deleteMutation.mutate(selectedFuncionario.id); };
  const handleSave = (formData: IFuncionarioForm, id?: number) => { saveMutation.mutate({ data: formData, id }); };

  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const RowDesktop = ({ index, style }: ListChildComponentProps) => {
    const funcionario = data!.dados[index];
    return (
      <Flex style={style} align="center" _hover={{ bg: rowHoverBg }} borderBottomWidth="1px" borderColor={borderColor}>
        <Text width="40%" px={4} isTruncated title={funcionario.nome}>{funcionario.nome}</Text>
        <Text width="20%" px={4} isTruncated>{funcionario.cpf ? aplicarMascaraCpf(funcionario.cpf) : '---'}</Text>
        <Text width="20%" px={4} isTruncated>{funcionario.funcao || '---'}</Text>
        <Flex width="10%" px={4} justify="center"><Tag colorScheme={funcionario.status === 'ATIVO' ? 'green' : 'red'}>{funcionario.status}</Tag></Flex>
        <Flex width="10%" px={4} justify="center">
          <HStack>
            <Tooltip label="Editar" hasArrow><IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleEditClick(funcionario)} /></Tooltip>
            <Tooltip label="Excluir" hasArrow><IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(funcionario)} /></Tooltip>
          </HStack>
        </Flex>
      </Flex>
    );
  };

  const RowMobile = ({ index, style }: ListChildComponentProps) => {
    const funcionario = data!.dados[index];
    return (
      <Box style={style} px={2} py={2}>
        <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Flex justify="space-between" align="center">
            <Heading size="sm" noOfLines={1}>{funcionario.nome}</Heading>
            <Tag colorScheme={funcionario.status === 'ATIVO' ? 'green' : 'red'}>{funcionario.status}</Tag>
          </Flex>
          <Divider my={2} />
          <HStack justify="space-between"><Text fontSize="sm" color="gray.500">CPF:</Text><Text>{funcionario.cpf ? aplicarMascaraCpf(funcionario.cpf) : 'Não informado'}</Text></HStack>
          <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Função:</Text><Text>{funcionario.funcao || 'Não informada'}</Text></HStack>
          <HStack mt={4} justify="flex-end">
            <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => handleEditClick(funcionario)} />
            <IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" size="sm" onClick={() => handleDeleteClick(funcionario)} />
          </HStack>
        </Box>
      </Box>
    );
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Funcionários</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>Adicionar Funcionário</Button>
      </Flex>

      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
          <Input placeholder="Buscar por nome ou CPF..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
        </InputGroup>
      </Box>

      {isLoading ? (<Center p={10}><Spinner size="xl" /></Center>) : 
       isError ? (<Center p={10}><Text color="red.500">Não foi possível carregar os funcionários.</Text></Center>) : 
       !data?.dados || data.dados.length === 0 ? (<Center p={10}><Text>Nenhum funcionário encontrado.</Text></Center>) :
      (
        <>
          {isMobile ? (
            <FixedSizeList height={600} itemCount={data.dados.length} itemSize={160} width="100%" ref={listRef}>{RowMobile}</FixedSizeList>
          ) : (
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
              <Flex bg={headerBg} borderBottomWidth="1px" fontWeight="bold" role="row" pr="15px">
                <Text width="40%" p={4}>Nome</Text>
                <Text width="20%" p={4}>CPF</Text>
                <Text width="20%" p={4}>Função</Text>
                <Text width="10%" p={4} textAlign="center">Status</Text>
                <Text width="10%" p={4} textAlign="center">Ações</Text>
              </Flex>
              <FixedSizeList height={600} itemCount={data.dados.length} itemSize={62} width="100%" ref={listRef}>{RowDesktop}</FixedSizeList>
            </Box>
          )}
          {data && data.totalPaginas > 1 && (<Pagination paginaAtual={data.pagina || 1} totalPaginas={data.totalPaginas || 1} onPageChange={setPagina} />)}
        </>
      )}

      <Modal isOpen={isConfirmModalOpen} onClose={onConfirmModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Exclusão</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Tem certeza que deseja excluir o funcionário <strong>{selectedFuncionario?.nome}</strong>?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmModalClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} isLoading={deleteMutation.isPending}>Sim, Excluir</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {isDrawerOpen && (<FormularioFuncionario isOpen={isDrawerOpen} onClose={onDrawerClose} funcionario={selectedFuncionario} onSave={handleSave} isLoading={saveMutation.isPending} />)}
    </Box>
  );
};

export default FuncionariosPage;
