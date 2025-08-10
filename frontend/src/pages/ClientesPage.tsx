import {
  Box, Button, Center, Drawer, DrawerBody, DrawerContent, DrawerFooter,
  DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel, HStack, Heading,
  IconButton, Input, Link, Spinner, Stack, Table, TableContainer, Tbody, Td,
  Text, Th, Thead, Tr, useDisclosure, useToast, Checkbox,
  useBreakpointValue,
  Divider,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiEdit, FiPhone, FiPlus, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Pagination } from '../components/Pagination';
import {
  ICliente, IClienteForm, createCliente, deleteCliente, getClientes, updateCliente,
} from '../services/cliente.service';
import { useAuth } from '../hooks/useAuth';

// --- FUNÇÕES AUXILIARES (SEM ALTERAÇÃO) ---
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

// --- COMPONENTE DO FORMULÁRIO (SEM ALTERAÇÃO) ---
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
                  <FormLabel>Nome</FormLabel>
                  <Input {...register('nome', { required: 'Nome é obrigatório' })} placeholder="Nome completo do cliente" />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>Responsável (Opcional)</FormLabel>
                  <Input {...register('responsavel')} placeholder="Nome do responsável" />
                </FormControl>
              </Flex>
              <FormControl isRequired isInvalid={!!errors.telefone}>
                <FormLabel>Telefone</FormLabel>
                <Input {...register('telefone', { required: 'Telefone é obrigatório' })} placeholder="(xx) xxxxx-xxxx" />
              </FormControl>
              <Checkbox {...register('tem_whatsapp')}>É WhatsApp?</Checkbox>
              <FormControl><FormLabel>Endereço Completo</FormLabel><Input {...register('endereco')} placeholder="Avenida, Rua, Quadra, Lote, Bairro..." /></FormControl>
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

// --- PÁGINA PRINCIPAL DE CLIENTES (SEM ALTERAÇÃO) ---
const ClientesPage = () => {
  const [pagina, setPagina] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCliente, setEditingCliente] = useState<ICliente | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', pagina],
    queryFn: () => getClientes(pagina, 10),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: IClienteForm; id?: number }) =>
      id ? updateCliente(id, data) : createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Cliente salvo com sucesso!', status: 'success', duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar cliente.', description: error.message, status: 'error', duration: 5000, isClosable: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Cliente deletado!', status: 'success', duration: 3000, isClosable: true });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao deletar.', description: error.message, status: 'error', duration: 5000, isClosable: true });
    },
  });

  const handleOpenForm = (cliente: ICliente | null) => {
    setEditingCliente(cliente);
    onOpen();
  };

  const handleSave = (formData: IClienteForm, id?: number) => {
    saveMutation.mutate({ data: formData, id });
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
                      <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => handleOpenForm(cliente)} />
                      {isAdmin && (
                        <IconButton
                          aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" size="sm"
                          onClick={() => deleteMutation.mutate(cliente.id)}
                          isLoading={deleteMutation.isPending && deleteMutation.variables === cliente.id}
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
                    <Th>Nome</Th>
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
                          <Button size="sm" leftIcon={<FiEdit />} onClick={() => handleOpenForm(cliente)}>
                            Editar
                          </Button>
                          {isAdmin && (
                            <IconButton
                              aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" size="sm"
                              onClick={() => deleteMutation.mutate(cliente.id)}
                              isLoading={deleteMutation.isPending && deleteMutation.variables === cliente.id}
                            />
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

      <FormularioCliente isOpen={isOpen} onClose={onClose} cliente={editingCliente} onSave={handleSave} />
    </Box>
  );
};

export default ClientesPage;
