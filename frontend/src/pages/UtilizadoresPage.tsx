import {
  Box, Button, Flex, IconButton, Link, Spinner, Table, TableContainer,
  Tag, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, Select, FormErrorMessage, Switch, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Center,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';

import {
  IUtilizador, IUpdateUtilizadorForm, getUtilizadores, updateUtilizador, deleteUtilizador,
  ICreateUtilizadorForm, createUtilizador,
} from '../services/utilizador.service';
import { useAuth } from '../hooks/useAuth';

// --- COMPONENTE: FORMULÁRIO DE ADICIONAR UTILIZADOR (sem alterações) ---
const FormularioAdicionarUtilizador = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ICreateUtilizadorForm>();

  const mutation = useMutation({
    mutationFn: createUtilizador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador criado com sucesso!', status: 'success', duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar utilizador', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    }
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit: SubmitHandler<ICreateUtilizadorForm> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">Adicionar Novo Utilizador</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.nome}><FormLabel>Nome Completo</FormLabel><Input {...register('nome', { required: 'Nome é obrigatório' })} /><FormErrorMessage>{errors.nome?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.email}><FormLabel>Email</FormLabel><Input type="email" {...register('email', { required: 'Email é obrigatório' })} /><FormErrorMessage>{errors.email?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.telefone}><FormLabel>Telefone</FormLabel><Input {...register('telefone', { required: 'Telefone é obrigatório' })} /><FormErrorMessage>{errors.telefone?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.nickname}><FormLabel>Nickname (Apelido)</FormLabel><Input {...register('nickname', { required: 'Nickname é obrigatório' })} /><FormErrorMessage>{errors.nickname?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.senha}><FormLabel>Senha Provisória</FormLabel><Input type="password" {...register('senha', { required: 'Senha é obrigatória', minLength: { value: 6, message: 'A senha deve ter no mínimo 6 caracteres' } })} /><FormErrorMessage>{errors.senha?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.perfil}><FormLabel>Perfil</FormLabel><Select placeholder="Selecione um perfil" {...register('perfil', { required: 'Perfil é obrigatório' })}><option value="VENDEDOR">Vendedor</option><option value="GERENTE">Gerente</option><option value="ADMINISTRATIVO">Administrativo</option><option value="ADMIN">Admin</option></Select><FormErrorMessage>{errors.perfil?.message}</FormErrorMessage></FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isSubmitting}>Salvar Utilizador</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};


// --- COMPONENTE: FORMULÁRIO DE EDITAR UTILIZADOR ---
const FormularioEditarUtilizador = ({ isOpen, onClose, utilizador }: { isOpen: boolean; onClose: () => void; utilizador: IUtilizador | null; }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  // ======================= INÍCIO DA CORREÇÃO =======================
  // A função 'reset' foi removida, pois não estava sendo utilizada.
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<IUpdateUtilizadorForm>();
  // ======================== FIM DA CORREÇÃO =========================

  useEffect(() => {
    if (utilizador) {
      setValue('nome', utilizador.nome);
      setValue('email', utilizador.email);
      setValue('telefone', utilizador.telefone);
      setValue('nickname', utilizador.nickname);
      if (utilizador.perfil !== 'PENDENTE') {
        setValue('perfil', utilizador.perfil);
      }
      setValue('status', utilizador.status);
    }
  }, [utilizador, setValue]);

  const mutation = useMutation({
    mutationFn: (data: IUpdateUtilizadorForm) => updateUtilizador({ id: utilizador!.id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador atualizado!', status: 'success', duration: 3000, isClosable: true });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    }
  });

  const onSubmit: SubmitHandler<IUpdateUtilizadorForm> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">Editar Utilizador</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.nome}><FormLabel>Nome Completo</FormLabel><Input {...register('nome', { required: 'Nome é obrigatório' })} /></FormControl>
              <FormControl isRequired isInvalid={!!errors.email}><FormLabel>Email</FormLabel><Input type="email" {...register('email', { required: 'Email é obrigatório' })} /></FormControl>
              <FormControl isRequired isInvalid={!!errors.telefone}><FormLabel>Telefone</FormLabel><Input {...register('telefone', { required: 'Telefone é obrigatório' })} /></FormControl>
              <FormControl isRequired isInvalid={!!errors.nickname}><FormLabel>Nickname</FormLabel><Input {...register('nickname', { required: 'Nickname é obrigatório' })} /></FormControl>
              <FormControl isRequired isInvalid={!!errors.perfil}><FormLabel>Perfil</FormLabel><Select placeholder="Selecione" {...register('perfil', { required: 'Perfil é obrigatório' })}><option value="VENDEDOR">Vendedor</option><option value="GERENTE">Gerente</option><option value="ADMINISTRATIVO">Administrativo</option><option value="ADMIN">Admin</option></Select></FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isSubmitting}>Salvar Alterações</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

// --- PÁGINA PRINCIPAL DE GESTÃO DE UTILIZADORES (sem alterações) ---
const UtilizadoresPage = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isEditDrawerOpen, onOpen: onEditDrawerOpen, onClose: onEditDrawerClose } = useDisclosure();
  const { isOpen: isAddDrawerOpen, onOpen: onAddDrawerOpen, onClose: onAddDrawerClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  
  const [selectedUser, setSelectedUser] = useState<IUtilizador | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { data: utilizadores, isLoading, isError } = useQuery<IUtilizador[]>({
    queryKey: ['utilizadores'],
    queryFn: getUtilizadores,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (user: IUtilizador) => updateUtilizador({
      id: user.id,
      data: {
        ...user,
        perfil: user.perfil === 'PENDENTE' ? 'VENDEDOR' : user.perfil,
        status: user.status === 'ATIVO' ? 'INATIVO' : 'ATIVO',
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Status atualizado!', status: 'info', duration: 2000, isClosable: true });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, status: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUtilizador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador excluído!', status: 'success' });
      onDeleteAlertClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.message, status: 'error' });
    }
  });

  const handleEditClick = (user: IUtilizador) => {
    setSelectedUser(user);
    onEditDrawerOpen();
  };

  const handleDeleteClick = (user: IUtilizador) => {
    setSelectedUser(user);
    onDeleteAlertOpen();
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const getStatusTag = (status: string, perfil: string) => {
    if (perfil === 'PENDENTE') return <Tag colorScheme="yellow">Pendente</Tag>;
    return status === 'ATIVO' ? <Tag colorScheme="green">Ativo</Tag> : <Tag colorScheme="red">Inativo</Tag>;
  };

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Erro ao carregar utilizadores.</Text></Center>;

  return (
    <Box>
      <Flex justify="flex-end" align="center" mb={6}>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onAddDrawerOpen}>
          Adicionar Utilizador
        </Button>
      </Flex>

      <TableContainer>
        <Table variant="striped">
          <Thead><Tr><Th>Nome</Th><Th>Contato</Th><Th>Perfil</Th><Th>Status</Th><Th>Ações</Th></Tr></Thead>
          <Tbody>
            {utilizadores?.map((user) => (
              <Tr key={user.id}>
                <Td fontWeight="medium">{user.nome}</Td>
                <Td><VStack align="start" spacing={0}><Text>{user.email}</Text><Text fontSize="sm" color="gray.500">{user.telefone}</Text></VStack></Td>
                <Td>{user.perfil}</Td>
                <Td>{getStatusTag(user.status, user.perfil)}</Td>
                <Td>
                  <HStack spacing={2}>
                    {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
                    <Tooltip label={user.status === 'ATIVO' ? 'Desativar usuário' : 'Ativar usuário'} hasArrow>
                      {/* Envolvemos o Switch em uma div para corrigir o bug do tooltip persistente */}
                      <Box as="div" display="inline-block">
                        <Switch
                          isChecked={user.status === 'ATIVO'}
                          onChange={() => updateStatusMutation.mutate(user)}
                          isDisabled={user.id === currentUser?.id}
                        />
                      </Box>
                    </Tooltip>
                    {/* ======================== FIM DA CORREÇÃO ========================= */}
                    <Tooltip label="WhatsApp" hasArrow><IconButton as={Link} href={`https://wa.me/55${user.telefone.replace(/\D/g, '' )}`} target="_blank" aria-label="WhatsApp" icon={<FaWhatsapp />} variant="ghost" /></Tooltip>
                    <Tooltip label="Editar" hasArrow><IconButton aria-label="Editar" icon={<FiEdit />} variant="ghost" onClick={() => handleEditClick(user)} /></Tooltip>
                    <Tooltip label="Excluir" hasArrow><IconButton aria-label="Excluir" icon={<FiTrash2 />} variant="ghost" colorScheme="red" onClick={() => handleDeleteClick(user)} isDisabled={user.id === currentUser?.id} /></Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <FormularioAdicionarUtilizador isOpen={isAddDrawerOpen} onClose={onAddDrawerClose} />
      <FormularioEditarUtilizador isOpen={isEditDrawerOpen} onClose={onEditDrawerClose} utilizador={selectedUser} />

      <AlertDialog isOpen={isDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={onDeleteAlertClose}>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Exclusão</AlertDialogHeader>
          <AlertDialogBody>Tem certeza que deseja excluir o utilizador <strong>{selectedUser?.nome}</strong>? Esta ação não pode ser desfeita.</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onDeleteAlertClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default UtilizadoresPage;
