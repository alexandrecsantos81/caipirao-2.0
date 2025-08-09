import {
  Badge, Box, Button, Center, Drawer, DrawerBody, DrawerContent, DrawerFooter,
  DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel, HStack, Heading,
  IconButton, Input, Link, Spinner, Stack, Table, TableContainer, Tbody, Td,
  Text, Th, Thead, Tr, useDisclosure, useToast, Checkbox,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiEdit, FiPhone, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Pagination } from '../components/Pagination';
import {
  ICliente, IClienteForm, createCliente, deleteCliente, getClientes, updateCliente,
} from '../services/cliente.service';
import { useAuth } from '../hooks/useAuth'; // 1. IMPORTAR O HOOK

const formatarTelefone = (telefone: string): string => {
  if (!telefone) return '';
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length === 11) return `(${digitos.substring(0, 2)}) ${digitos.substring(2, 7)}-${digitos.substring(7)}`;
  if (digitos.length === 10) return `(${digitos.substring(0, 2)}) ${digitos.substring(2, 6)}-${digitos.substring(6)}`;
  return telefone;
};

const FormularioCliente = ({ isOpen, onClose, cliente, onSave }: {
  isOpen: boolean; onClose: () => void; cliente: ICliente | null; onSave: (data: IClienteForm, id?: number) => void;
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<IClienteForm>();

  useEffect(() => {
    if (isOpen) {
      reset(cliente || { nome: '', responsavel: '', telefone: '', tem_whatsapp: false, endereco: '' });
    }
  }, [cliente, isOpen, reset]);

  const onSubmit: SubmitHandler<IClienteForm> = (data) => {
    onSave(data, cliente?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">{cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerBody>
            <Stack spacing={4}>
              <HStack>
                <FormControl isRequired isInvalid={!!errors.nome}><FormLabel>Nome</FormLabel><Input {...register('nome', { required: 'Nome é obrigatório' })} placeholder="Nome completo do cliente" /></FormControl>
                <FormControl><FormLabel>Responsável (Opcional)</FormLabel><Input {...register('responsavel')} placeholder="Nome do responsável" /></FormControl>
              </HStack>
              <FormControl isRequired isInvalid={!!errors.telefone}><FormLabel>Telefone</FormLabel><Input {...register('telefone', { required: 'Telefone é obrigatório' })} placeholder="(xx) xxxxx-xxxx" /></FormControl>
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

const ClientesPage = () => {
  const [pagina, setPagina] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCliente, setEditingCliente] = useState<ICliente | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // 2. OBTER O USUÁRIO DO CONTEXTO
  const isAdmin = user?.perfil === 'ADMIN'; // 3. CRIAR A VARIÁVEL DE VERIFICAÇÃO

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

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank'  );
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading></Heading>
          <Text color="gray.500">Adicione, edite e gerencie seus clientes.</Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={() => handleOpenForm(null)}>
          Novo Cliente
        </Button>
      </Flex>

      {isLoading ? (
        <Center p={10}><Spinner size="xl" /></Center>
      ) : isError ? (
        <Center p={10}><Text color="red.500">Não foi possível carregar os clientes.</Text></Center>
      ) : (
        <>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nome</Th>
                  <Th>Status</Th>
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
                      <Badge colorScheme={cliente.status === 'Ativo' ? 'green' : 'red'}>
                        {cliente.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack as={Link} onClick={() => cliente.tem_whatsapp && openWhatsApp(cliente.telefone)} color={cliente.tem_whatsapp ? 'teal.500' : 'inherit'} _hover={cliente.tem_whatsapp ? { textDecoration: 'underline', cursor: 'pointer' } : {}}>
                        <FiPhone />
                        <Text>{formatarTelefone(cliente.telefone)}</Text>
                        {cliente.tem_whatsapp && (
                          <Text as="span" fontSize="sm" color="gray.500">(WhatsApp)</Text>
                        )}
                      </HStack>
                    </Td>
                    <Td>{cliente.endereco}</Td>
                    <Td>
                      <HStack>
                        <Button size="sm" leftIcon={<FiEdit />} onClick={() => handleOpenForm(cliente)}>
                          Editar
                        </Button>
                        {/* 4. RENDERIZAÇÃO CONDICIONAL DO BOTÃO DE EXCLUSÃO */}
                        {isAdmin && (
                          <IconButton
                            aria-label="Deletar"
                            icon={<FiTrash2 />}
                            colorScheme="red"
                            size="sm"
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
