import {
  Box, Button, Center, Drawer, DrawerBody, DrawerContent, DrawerFooter,
  DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel, HStack, Heading,
  IconButton, Input, Link, Spinner, Stack, Table, TableContainer, Tbody, Td,
  Text, Th, Thead, Tr, useDisclosure, useToast, Checkbox,
  useBreakpointValue,
  Divider,
  VStack,
  Icon,
  FormErrorMessage,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Badge,
  Tooltip,
  List,
  ListItem,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiEdit, FiPhone, FiPlus, FiTrash2, FiSearch, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Pagination } from '../components/Pagination';
import {
  ICliente, IClienteForm, createCliente, deleteCliente, getClientes, updateCliente, getHistoricoVendas, IHistoricoVenda,
} from '../services/cliente.service';
import { useAuth } from '../hooks/useAuth';

// Hook customizado para debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const formatarTelefone = (telefone: string): string => {
  if (!telefone) return '';
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length === 11) return `(${digitos.substring(0, 2)}) ${digitos.substring(2, 7)}-${digitos.substring(7)}`;
  if (digitos.length === 10) return `(${digitos.substring(0, 2)}) ${digitos.substring(2, 6)}-${digitos.substring(6)}`;
  return telefone;
};

const openWhatsApp = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  window.open(`https://wa.me/55${cleanPhone}`, '_blank'  );
};

// --- NOVO COMPONENTE: MODAL DE HISTÓRICO DE VENDAS ---
const ModalHistoricoVendas = ({ isOpen, onClose, cliente }: { isOpen: boolean; onClose: () => void; cliente: ICliente | null }) => {
  const { data: historico, isLoading, isError } = useQuery({
    queryKey: ['historicoCliente', cliente?.id],
    queryFn: () => getHistoricoVendas(cliente!.id),
    enabled: !!cliente && isOpen, // Só busca os dados se o modal estiver aberto e um cliente selecionado
  });

  const formatarProdutos = (produtos: IHistoricoVenda['produtos']) => {
    return (
      <List spacing={1} fontSize="sm">
        {produtos.map((p, index) => (
          <ListItem key={index}>
            <Text as="span" fontWeight="bold">{p.quantidade} {p.unidade_medida}</Text> - {p.nome}
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Histórico de Vendas de {cliente?.nome}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading && <Center p={10}><Spinner size="xl" /></Center>}
          {isError && <Center p={10}><Text color="red.500">Erro ao carregar o histórico.</Text></Center>}
          {!isLoading && !isError && (
            <TableContainer>
              <Table variant="striped">
                <Thead>
                  <Tr>
                    <Th>Data</Th>
                    <Th>Produtos Adquiridos</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Valor Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {historico && historico.length > 0 ? (
                    historico.map((venda) => (
                      <Tr key={venda.id}>
                        <Td>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                        <Td>{formatarProdutos(venda.produtos)}</Td>
                        <Td>
                          <Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>
                            {venda.data_pagamento ? 'Pago' : 'Pendente'}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="bold">
                          {venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={4} textAlign="center">Nenhuma venda encontrada para este cliente.</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};


const FormularioCliente = ({ isOpen, onClose, cliente, onSave }: {
  isOpen: boolean; onClose: () => void; cliente: ICliente | null; onSave: (data: IClienteForm, id?: number) => void;
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<IClienteForm>();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  const flexDir = useBreakpointValue<'column' | 'row'>({ base: 'column', md: 'row' });

  useEffect(() => {
    if (isOpen) {
      reset(cliente || { nome: '', responsavel: '', telefone: '', tem_whatsapp: false, endereco: '', email: '' });
    }
  }, [cliente, isOpen, reset]);

  const onSubmit: SubmitHandler<IClienteForm> = (data) => {
    onSave(data, cliente?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">{cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerBody>
            <Stack spacing={4}>
              <Flex direction={flexDir} gap={4}>
                <FormControl isRequired isInvalid={!!errors.nome} flex={1}>
                  <FormLabel>Nome Empresarial</FormLabel>
                  <Input 
                    {...register('nome', { 
                      required: 'Nome Empresarial é obrigatório',
                      validate: (value) => (value && value.trim() !== '') || 'O campo não pode conter apenas espaços'
                    })} 
                    placeholder="Nome da empresa ou do cliente"
                    textTransform="uppercase"
                  />
                  <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.responsavel} flex={1}>
                  <FormLabel>Responsável</FormLabel>
                  <Input 
                    {...register('responsavel', {
                      required: 'Nome do responsável é obrigatório',
                      validate: (value) => (value && value.trim() !== '') || 'O campo não pode conter apenas espaços'
                    })} 
                    placeholder="Nome do responsável"
                    textTransform="uppercase"
                  />
                  <FormErrorMessage>{errors.responsavel?.message}</FormErrorMessage>
                </FormControl>
              </Flex>
              <FormControl isRequired isInvalid={!!errors.telefone}>
                <FormLabel>Telefone</FormLabel>
                <Input 
                  {...register('telefone', { 
                    required: 'Telefone é obrigatório',
                    validate: (value) => (value && value.trim() !== '') || 'O campo não pode conter apenas espaços'
                  })} 
                  placeholder="(xx) xxxxx-xxxx" 
                />
                <FormErrorMessage>{errors.telefone?.message}</FormErrorMessage>
              </FormControl>
              <Checkbox {...register('tem_whatsapp')}>É WhatsApp?</Checkbox>
              <FormControl isRequired isInvalid={!!errors.endereco}>
                <FormLabel>Endereço Completo</FormLabel>
                <Input 
                  {...register('endereco', {
                    required: 'Endereço é obrigatório',
                    validate: (value) => (value && value.trim() !== '') || 'O campo não pode conter apenas espaços'
                  })} 
                  placeholder="Avenida, Rua, Quadra, Lote, Bairro..."
                  textTransform="uppercase"
                />
                <FormErrorMessage>{errors.endereco?.message}</FormErrorMessage>
              </FormControl>
              <FormControl><FormLabel>Email (Opcional)</FormLabel><Input type="email" {...register('email')} placeholder="email@exemplo.com" /></FormControl>
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isSubmitting}>Salvar Cliente</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

const ClientesPage = () => {
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const buscaDebounced = useDebounce(termoBusca, 500);

  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure(); // Estado para o modal de histórico
  
  const [clienteParaDeletar, setClienteParaDeletar] = useState<ICliente | null>(null);
  const [clienteParaHistorico, setClienteParaHistorico] = useState<ICliente | null>(null); // Estado para guardar o cliente do histórico
  const [editingCliente, setEditingCliente] = useState<ICliente | null>(null);
  
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buscaDebounced) {
      setPagina(1);
    }
  }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', pagina, buscaDebounced],
    queryFn: () => getClientes(pagina, 10, buscaDebounced),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: IClienteForm; id?: number }) =>
      id ? updateCliente(id, data) : createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Cliente salvo com sucesso!', status: 'success', duration: 3000, isClosable: true });
      onDrawerClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar cliente.', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Cliente deletado!', status: 'success', duration: 3000, isClosable: true });
      onAlertClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao deletar.', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    },
  });

  const handleOpenForm = (cliente: ICliente | null) => {
    setEditingCliente(cliente);
    onDrawerOpen();
  };

  const handleOpenHistory = (cliente: ICliente) => {
    setClienteParaHistorico(cliente);
    onHistoryOpen();
  };

  const handleSave = (formData: IClienteForm, id?: number) => {
    saveMutation.mutate({ data: formData, id });
  };

  const handleDeleteClick = (cliente: ICliente) => {
    setClienteParaDeletar(cliente);
    onAlertOpen();
  };

  const handleConfirmDelete = () => {
    if (clienteParaDeletar) {
      deleteMutation.mutate(clienteParaDeletar.id);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box textAlign={{ base: 'center', md: 'left' }}>
          <Heading>Gestão de Clientes</Heading>
          <Text color="gray.500">Adicione, edite e gerencie seus clientes.</Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={() => handleOpenForm(null)} w={{ base: 'full', md: 'auto' }}>
          Novo Cliente
        </Button>
      </Flex>

      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar por nome, email, telefone ou responsável..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </InputGroup>
      </Box>

      {isLoading ? (
        <Center p={10}><Spinner size="xl" /></Center>
      ) : isError ? (
        <Center p={10}><Text color="red.500">Não foi possível carregar os clientes.</Text></Center>
      ) : (
        <>
          {isMobile ? (
            <VStack spacing={4} align="stretch">
              {data?.dados.map((cliente) => (
                <Box key={cliente.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
                  <Flex justify="space-between" align="center">
                    <Heading size="sm" noOfLines={1}>{cliente.nome}</Heading>
                    <HStack spacing={1}>
                      <IconButton aria-label="Histórico" icon={<FiClock />} size="sm" onClick={() => handleOpenHistory(cliente)} />
                      <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => handleOpenForm(cliente)} />
                      {isAdmin && (
                        <IconButton
                          aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" size="sm"
                          onClick={() => handleDeleteClick(cliente)}
                        />
                      )}
                    </HStack>
                  </Flex>
                  <Divider my={2} />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">Contato:</Text>
                    <HStack as={Link} onClick={() => cliente.tem_whatsapp && openWhatsApp(cliente.telefone)} color={cliente.tem_whatsapp ? 'teal.500' : 'inherit'} _hover={{ textDecoration: 'none' }}>
                      <Icon as={cliente.tem_whatsapp ? FaWhatsapp : FiPhone} />
                      <Text>{formatarTelefone(cliente.telefone)}</Text>
                    </HStack>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">Endereço:</Text>
                    <Text noOfLines={1} textAlign="right">{cliente.endereco || 'Não informado'}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome Empresarial</Th>
                    <Th>Contato</Th>
                    <Th>Endereço Principal</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.dados.map((cliente) => (
                    <Tr key={cliente.id}>
                      <Td>{cliente.nome}</Td>
                      <Td>
                        <HStack as={Link} onClick={() => cliente.tem_whatsapp && openWhatsApp(cliente.telefone)} color={cliente.tem_whatsapp ? 'teal.500' : 'inherit'} _hover={cliente.tem_whatsapp ? { textDecoration: 'underline', cursor: 'pointer' } : {}}>
                          <Icon as={cliente.tem_whatsapp ? FaWhatsapp : FiPhone} />
                          <Text>{formatarTelefone(cliente.telefone)}</Text>
                        </HStack>
                      </Td>
                      <Td>{cliente.endereco}</Td>
                      <Td>
                        <HStack>
                          <Tooltip label="Histórico de Vendas" hasArrow>
                            <IconButton aria-label="Histórico de Vendas" icon={<FiClock />} onClick={() => handleOpenHistory(cliente)} />
                          </Tooltip>
                          <Tooltip label="Editar Cliente" hasArrow>
                            <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForm(cliente)} />
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip label="Excluir Cliente" hasArrow>
                              <IconButton
                                aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red"
                                onClick={() => handleDeleteClick(cliente)}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          <Pagination
            paginaAtual={data?.pagina || 1}
            totalPaginas={data?.totalPaginas || 1}
            onPageChange={(page) => setPagina(page)}
          />
        </>
      )}

      <FormularioCliente isOpen={isDrawerOpen} onClose={onDrawerClose} cliente={editingCliente} onSave={handleSave} />
      
      <ModalHistoricoVendas isOpen={isHistoryOpen} onClose={onHistoryClose} cliente={clienteParaHistorico} />

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
              Tem certeza que deseja excluir o cliente <strong>{clienteParaDeletar?.nome}</strong>? Esta ação não pode ser desfeita.
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

export default ClientesPage;
