import {
  Box, Button, Flex, Heading, IconButton, Spinner, Text,
  useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, FormErrorMessage,
  useBreakpointValue,
  Divider,
  Center,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window'; // 1. Importar de react-window

import {
  IFornecedor, IFornecedorForm, getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor
} from '../services/fornecedor.service';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

// --- COMPONENTES E FUNÇÕES AUXILIARES ---

const aplicarMascaraCnpjCpf = (value: string): string => {
  if (!value) return '';
  const apenasNumeros = value.replace(/\D/g, '');

  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  
  return apenasNumeros
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const validarCnpjCpf = (value: string | null | undefined): boolean | string => {
  if (!value) return 'Campo obrigatório'; 
  
  const apenasNumeros = value.replace(/\D/g, '');
  if (apenasNumeros.length !== 11 && apenasNumeros.length !== 14) {
    return 'O CNPJ/CPF deve ter 11 ou 14 dígitos.';
  }
  return true;
};

export const FormularioFornecedor = ({ isOpen, onClose, fornecedor, onSave, isLoading }: { 
  isOpen: boolean; 
  onClose: () => void; 
  fornecedor: IFornecedor | null; 
  onSave: (data: IFornecedorForm, id?: number) => void;
  isLoading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors }, control } = useForm<IFornecedorForm>();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  
  useEffect(() => {
    if (isOpen) {
      if (fornecedor) {
        const fornecedorFormatado = {
          ...fornecedor,
          cnpj_cpf: aplicarMascaraCnpjCpf(fornecedor.cnpj_cpf || '')
        };
        reset(fornecedorFormatado);
      } else {
        reset({ nome: '', cnpj_cpf: '', telefone: '', email: '', endereco: '' });
      }
    }
  }, [fornecedor, isOpen, reset]);

  const onSubmit: SubmitHandler<IFornecedorForm> = (data) => {
    onSave(data, fornecedor?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">{fornecedor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.nome}>
                <FormLabel>Nome</FormLabel>
                <Input 
                  {...register('nome', { 
                    required: 'Nome é obrigatório',
                    validate: (value) => (value && value.trim() !== '') || 'O campo nome não pode conter apenas espaços'
                  })}
                  textTransform="uppercase"
                />
                <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.cnpj_cpf}>
                <FormLabel>CNPJ/CPF</FormLabel>
                <Controller
                  name="cnpj_cpf"
                  control={control}
                  rules={{ validate: validarCnpjCpf }}
                  render={({ field: { onChange, value, name } }) => (
                    <Input
                      name={name}
                      value={value || ''}
                      onChange={(e) => onChange(aplicarMascaraCnpjCpf(e.target.value))}
                      placeholder="Digite o CNPJ ou CPF"
                    />
                  )}
                />
                <FormErrorMessage>{errors.cnpj_cpf?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.telefone}>
                <FormLabel>Telefone</FormLabel>
                <Input {...register('telefone', { required: 'Telefone é obrigatório' })} />
                <FormErrorMessage>{errors.telefone?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}><FormLabel>Email</FormLabel><Input type="email" {...register('email')} /></FormControl>
              
              <FormControl isRequired isInvalid={!!errors.endereco}>
                <FormLabel>Endereço</FormLabel>
                <Input 
                  {...register('endereco', { required: 'Endereço é obrigatório' })} 
                  textTransform="uppercase"
                />
                <FormErrorMessage>{errors.endereco?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

// Componente de confirmação de exclusão como Drawer
const ConfirmDeleteDrawer = ({ isOpen, onClose, fornecedor, onConfirm, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  fornecedor: IFornecedor | null;
  onConfirm: () => void;
  isLoading: boolean;
}) => {
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">Confirmar Exclusão</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4} align="start">
            <Text>Tem certeza que deseja excluir o fornecedor <strong>{fornecedor?.nome}</strong>?</Text>
            <Text fontSize="sm" color="red.500">Atenção: Esta ação não pode ser desfeita.</Text>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="red" onClick={onConfirm} isLoading={isLoading}>Sim, Excluir</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---

const FornecedoresPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmDrawerOpen, onOpen: onConfirmDrawerOpen, onClose: onConfirmDrawerClose } = useDisclosure();
  
  const [selectedFornecedor, setSelectedFornecedor] = useState<IFornecedor | null>(null);
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const buscaDebounced = useDebounce(termoBusca, 500);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const listRef = useRef<FixedSizeList>(null); // 2. Ref para a lista virtualizada
  const isAdmin = user?.perfil === 'ADMIN';

  useEffect(() => {
    if (buscaDebounced) {
      setPagina(1);
    }
  }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fornecedores', pagina, buscaDebounced],
    queryFn: () => getFornecedores(pagina, 50, buscaDebounced),
    placeholderData: keepPreviousData,
  });

  // 3. Efeito para rolar a lista para o topo quando os dados mudam
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: IFornecedorForm; id?: number }) => 
      id ? updateFornecedor({ id, ...data }) : createFornecedor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast({ title: `Fornecedor salvo com sucesso!`, status: 'success' });
      onDrawerClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar fornecedor', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast({ title: 'Fornecedor excluído com sucesso!', status: 'success' });
      onConfirmDrawerClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir fornecedor', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleAddClick = () => { setSelectedFornecedor(null); onDrawerOpen(); };
  const handleEditClick = (fornecedor: IFornecedor) => { setSelectedFornecedor(fornecedor); onDrawerOpen(); };
  const handleDeleteClick = (fornecedor: IFornecedor) => { setSelectedFornecedor(fornecedor); onConfirmDrawerOpen(); };
  const handleConfirmDelete = () => { if (selectedFornecedor) { deleteMutation.mutate(selectedFornecedor.id); } };
  const handleSave = (formData: IFornecedorForm, id?: number) => { saveMutation.mutate({ data: formData, id }); };

  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 4. Componente para renderizar uma linha da tabela no Desktop
  const RowDesktop = ({ index, style }: ListChildComponentProps) => {
    const fornecedor = data!.dados[index];
    return (
      <Flex style={style} align="center" _hover={{ bg: rowHoverBg }} borderBottomWidth="1px" borderColor={borderColor}>
        <Text width="30%" px={4} isTruncated title={fornecedor.nome}>{fornecedor.nome}</Text>
        <Text width="20%" px={4} isTruncated>{aplicarMascaraCnpjCpf(fornecedor.cnpj_cpf || '')}</Text>
        <Text width="25%" px={4} isTruncated>{fornecedor.telefone || '---'}</Text>
        <Text width="25%" px={4} isTruncated>{fornecedor.email || '---'}</Text>
        <Flex width="10%" px={4} justify="flex-start">
          <HStack>
            <Tooltip label="Editar Fornecedor" hasArrow><IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleEditClick(fornecedor)} /></Tooltip>
            {isAdmin && (<Tooltip label="Excluir Fornecedor" hasArrow><IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(fornecedor)} /></Tooltip>)}
          </HStack>
        </Flex>
      </Flex>
    );
  };

  // 5. Componente para renderizar um card no Mobile
  const RowMobile = ({ index, style }: ListChildComponentProps) => {
    const fornecedor = data!.dados[index];
    return (
      <Box style={style} px={2} py={2}>
        <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Flex justify="space-between" align="center">
            <Heading size="sm" noOfLines={1}>{fornecedor.nome}</Heading>
            <HStack spacing={1}>
              <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => handleEditClick(fornecedor)} />
              {isAdmin && (<IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" size="sm" onClick={() => handleDeleteClick(fornecedor)} />)}
            </HStack>
          </Flex>
          <Divider my={2} />
          <HStack justify="space-between"><Text fontSize="sm" color="gray.500">CNPJ/CPF:</Text><Text>{aplicarMascaraCnpjCpf(fornecedor.cnpj_cpf || '') || 'Não informado'}</Text></HStack>
          <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Telefone:</Text><Text>{fornecedor.telefone || 'Não informado'}</Text></HStack>
        </Box>
      </Box>
    );
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Fornecedores</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>Adicionar Fornecedor</Button>
      </Flex>

      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
          <Input placeholder="Buscar por nome, CNPJ/CPF, telefone ou email..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
        </InputGroup>
      </Box>

      {isLoading ? (<Center p={10}><Spinner size="xl" /></Center>) : 
       isError ? (<Center p={10}><Text color="red.500">Não foi possível carregar os fornecedores.</Text></Center>) : 
       !data?.dados || data.dados.length === 0 ? (<Center p={10}><Text>Nenhum fornecedor encontrado.</Text></Center>) :
      (
        <>
          {/* 6. Substituição do .map pela lista virtualizada */}
          {isMobile ? (
            <FixedSizeList height={600} itemCount={data.dados.length} itemSize={145} width="100%" ref={listRef}>
              {RowMobile}
            </FixedSizeList>
          ) : (
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
              <Flex bg={headerBg} borderBottomWidth="1px" fontWeight="bold" role="row" pr="15px">
                <Text width="30%" p={4}>Nome</Text>
                <Text width="20%" p={4}>CNPJ/CPF</Text>
                <Text width="25%" p={4}>Telefone</Text>
                <Text width="25%" p={4}>Email</Text>
                <Text width="10%" p={4}>Ações</Text>
              </Flex>
              <FixedSizeList height={600} itemCount={data.dados.length} itemSize={62} width="100%" ref={listRef}>
                {RowDesktop}
              </FixedSizeList>
            </Box>
          )}

          {data && data.totalPaginas > 1 && (
            <Pagination paginaAtual={data.pagina || 1} totalPaginas={data.totalPaginas || 1} onPageChange={setPagina} />
          )}
        </>
      )}

      <ConfirmDeleteDrawer 
        isOpen={isConfirmDrawerOpen} 
        onClose={onConfirmDrawerClose} 
        fornecedor={selectedFornecedor}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {isDrawerOpen && (
        <FormularioFornecedor 
          isOpen={isDrawerOpen} 
          onClose={onDrawerClose} 
          fornecedor={selectedFornecedor} 
          onSave={handleSave}
          isLoading={saveMutation.isPending}
        />
      )}
    </Box>
  );
};

export default FornecedoresPage;

