import {
  Box, Button, Flex, Heading, IconButton, Link, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Table, TableContainer,
  Tag, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader,
  FormControl, FormLabel, Input, Select, FormErrorMessage, Switch, AlertDialog, 
  AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Tooltip, DrawerOverlay,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

import {
  IUtilizador, IUpdateUtilizadorForm, getUtilizadores, ativarUtilizador, updateUtilizador, deleteUtilizador
} from '../services/utilizador.service';

// --- COMPONENTE: FORMULÁRIO DE EDIÇÃO DE UTILIZADOR (sem alterações) ---
const FormularioEditarUtilizador = ({ isOpen, onClose, utilizador, onSave, isLoading }: { 
  isOpen: boolean; 
  onClose: () => void; 
  utilizador: IUtilizador | null;
  onSave: (data: IUpdateUtilizadorForm) => void;
  isLoading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IUpdateUtilizadorForm>();

  useEffect(() => {
    if (utilizador) {
      const dadosParaFormulario = {
        ...utilizador,
        perfil: utilizador.perfil === 'PENDENTE' ? 'VENDEDOR' : utilizador.perfil,
      };
      reset(dadosParaFormulario);
    }
  }, [utilizador, reset]);

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSave)}>
          <DrawerHeader borderBottomWidth="1px">Editar Utilizador</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.nome}><FormLabel>Nome Completo</FormLabel><Input {...register('nome', { required: 'Nome é obrigatório' })} /><FormErrorMessage>{errors.nome?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.email}><FormLabel>Email</FormLabel><Input type="email" {...register('email', { required: 'Email é obrigatório' })} /><FormErrorMessage>{errors.email?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.telefone}><FormLabel>Telefone</FormLabel><Input {...register('telefone', { required: 'Telefone é obrigatório' })} /><FormErrorMessage>{errors.telefone?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.nickname}><FormLabel>Nickname</FormLabel><Input {...register('nickname', { required: 'Nickname é obrigatório' })} /><FormErrorMessage>{errors.nickname?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.perfil}><FormLabel>Perfil</FormLabel><Select placeholder="Selecione um perfil" {...register('perfil', { required: 'Perfil é obrigatório' })}><option value="VENDEDOR">Vendedor</option><option value="GERENTE">Gerente</option><option value="ADMINISTRATIVO">Administrativo</option><option value="ADMIN">Admin</option></Select><FormErrorMessage>{errors.perfil?.message}</FormErrorMessage></FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar Alterações</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

// --- PÁGINA PRINCIPAL DE GESTÃO DE UTILIZADORES ---
const UtilizadoresPage = () => {
  const { user: adminUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen: isActivationModalOpen, onOpen: onActivationModalOpen, onClose: onActivationModalClose } = useDisclosure();
  const { isOpen: isEditDrawerOpen, onOpen: onEditDrawerOpen, onClose: onEditDrawerClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  
  const [userToActivate, setUserToActivate] = useState<IUtilizador | null>(null);
  const [userToEdit, setUserToEdit] = useState<IUtilizador | null>(null);
  const [userToDelete, setUserToDelete] = useState<IUtilizador | null>(null);
  const [activationProfile, setActivationProfile] = useState<'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO'>('VENDEDOR');

  const { data: utilizadores, isLoading, isError } = useQuery<IUtilizador[]>({
    queryKey: ['utilizadores'],
    queryFn: getUtilizadores,
  });

  const ativacaoMutation = useMutation({
    mutationFn: ativarUtilizador,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador ativado!', status: 'success' });
      const telefoneLimpo = data.utilizador.telefone.replace(/\D/g, '');
      const mensagem = `Olá, ${data.utilizador.nome}! Seu acesso ao sistema Caipirão 3.0 foi liberado. Sua senha provisória é: *${data.senhaProvisoria}*`;
      window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem )}`, '_blank');
      onActivationModalClose();
    },
    onError: (error: any) => toast({ title: 'Erro ao ativar', description: error.response?.data?.error || error.message, status: 'error' })
  });

  const updateMutation = useMutation({
    mutationFn: updateUtilizador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador atualizado!', status: 'success' });
      onEditDrawerClose();
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar', description: error.response?.data?.error || error.message, status: 'error' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUtilizador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador excluído!', status: 'info' });
      onDeleteAlertClose();
    },
    onError: (error: any) => toast({ title: 'Erro ao excluir', description: error.response?.data?.error || error.message, status: 'error' })
  });

  const handleOpenActivation = (user: IUtilizador) => { setUserToActivate(user); onActivationModalOpen(); };
  const handleOpenEdit = (user: IUtilizador) => { setUserToEdit(user); onEditDrawerOpen(); };
  const handleOpenDelete = (user: IUtilizador) => { setUserToDelete(user); onDeleteAlertOpen(); };

  const handleConfirmActivation = () => { if (userToActivate) ativacaoMutation.mutate({ id: userToActivate.id, perfil: activationProfile }); };
  const handleSaveEdit: SubmitHandler<IUpdateUtilizadorForm> = (data) => { if (userToEdit) updateMutation.mutate({ id: userToEdit.id, data }); };
  const handleConfirmDelete = () => { if (userToDelete) deleteMutation.mutate(userToDelete.id); };
  
  const handleStatusToggle = (user: IUtilizador) => {
    if (user.id === adminUser?.id || user.perfil === 'PENDENTE') return;
    const newStatus = user.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    const updateData: IUpdateUtilizadorForm = { 
      ...user, 
      status: newStatus,
      perfil: user.perfil as 'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN',
    };
    updateMutation.mutate({ id: user.id, data: updateData });
  };

  const getStatusTag = (status: string, perfil: string) => {
    if (perfil === 'PENDENTE') return <Tag colorScheme="yellow">Pendente</Tag>;
    return status === 'ATIVO' ? <Tag colorScheme="green">Ativo</Tag> : <Tag colorScheme="red">Inativo</Tag>;
  };

  if (isLoading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (isError) return <Box p={8} textAlign="center"><Text color="red.500">Erro ao carregar utilizadores.</Text></Box>;

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Gestão de Utilizadores</Heading>
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
                  {user.perfil === 'PENDENTE' ? (
                    <Button leftIcon={<FiUserCheck />} colorScheme="green" size="sm" onClick={() => handleOpenActivation(user)}>Ativar</Button>
                  ) : (
                    <HStack spacing={1}>
                      {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
                      <Tooltip label={user.id === adminUser?.id ? 'Não pode desativar a si mesmo' : (user.status === 'ATIVO' ? 'Desativar usuário' : 'Ativar usuário')} hasArrow>
                        {/* Envolvemos o Switch em um Box para o Tooltip funcionar corretamente quando desabilitado */}
                        <Box as="span" display="inline-block">
                          <Switch 
                            isChecked={user.status === 'ATIVO'} 
                            onChange={() => handleStatusToggle(user)} 
                            colorScheme="green" 
                            isDisabled={user.id === adminUser?.id} 
                          />
                        </Box>
                      </Tooltip>
                      {/* ======================== FIM DA CORREÇÃO ========================= */}
                      <IconButton as={Link} href={`https://wa.me/55${user.telefone.replace(/\D/g, '' )}`} target="_blank" aria-label="WhatsApp" icon={<FaWhatsapp />} variant="ghost" colorScheme="whatsapp" />
                      <IconButton aria-label="Editar" icon={<FiEdit />} variant="ghost" onClick={() => handleOpenEdit(user)} />
                      <IconButton aria-label="Excluir" icon={<FiTrash2 />} variant="ghost" colorScheme="red" onClick={() => handleOpenDelete(user)} isDisabled={user.id === adminUser?.id} />
                    </HStack>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Modal de Ativação */}
      <Modal isOpen={isActivationModalOpen} onClose={onActivationModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ativar Acesso do Utilizador</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>Deseja ativar o acesso para <strong>{userToActivate?.nome}</strong>?</Text>
            <FormControl isRequired><FormLabel>Defina o perfil inicial:</FormLabel><Select value={activationProfile} onChange={(e) => setActivationProfile(e.target.value as any)}><option value="VENDEDOR">Vendedor</option><option value="GERENTE">Gerente</option><option value="ADMINISTRATIVO">Administrativo</option></Select></FormControl>
            <Text fontSize="sm" color="gray.600" mt={4}>Uma senha provisória será gerada para envio via WhatsApp.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onActivationModalClose}>Cancelar</Button>
            <Button colorScheme="green" onClick={handleConfirmActivation} isLoading={ativacaoMutation.isPending}>Sim, Ativar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Drawer de Edição */}
      {userToEdit && <FormularioEditarUtilizador isOpen={isEditDrawerOpen} onClose={onEditDrawerClose} utilizador={userToEdit} onSave={handleSaveEdit} isLoading={updateMutation.isPending} />}

      {/* Alerta de Exclusão */}
      <AlertDialog isOpen={isDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={onDeleteAlertClose} isCentered>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Exclusão</AlertDialogHeader>
          <AlertDialogBody>Tem certeza que deseja excluir o utilizador <strong>{userToDelete?.nome}</strong>? Esta ação não pode ser desfeita.</AlertDialogBody>
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
