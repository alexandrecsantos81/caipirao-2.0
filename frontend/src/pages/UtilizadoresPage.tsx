// frontend/src/pages/UtilizadoresPage.tsx

import {
  Box, Button, Flex, Heading, IconButton, Link, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Table, TableContainer,
  Tag, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, Select, FormErrorMessage
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiUserCheck, FiUserX } from 'react-icons/fi'; // Removido FiMessageSquare e Icon
import { FaWhatsapp } from 'react-icons/fa';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react'; // <-- CORREÇÃO: Importando o useState do React

import {
  IUtilizador, ICreateUtilizadorForm, getUtilizadores, createUtilizador, ativarUtilizador
} from '../services/utilizador.service';

// --- COMPONENTE: FORMULÁRIO DE ADICIONAR UTILIZADOR (NO DRAWER) ---
const FormularioUtilizador = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ICreateUtilizadorForm>();

  const mutation = useMutation({
    mutationFn: createUtilizador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilizadores'] });
      toast({ title: 'Utilizador criado com sucesso!', status: 'success' });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar utilizador', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

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
              <FormControl isRequired isInvalid={!!errors.senha}><FormLabel>Senha Provisória</FormLabel><Input type="password" {...register('senha', { required: 'Senha é obrigatória' })} /><FormErrorMessage>{errors.senha?.message}</FormErrorMessage></FormControl>
              <FormControl isRequired isInvalid={!!errors.perfil}><FormLabel>Perfil</FormLabel><Select placeholder="Selecione um perfil" {...register('perfil', { required: 'Perfil é obrigatório' })}><option value="VENDEDOR">Vendedor</option><option value="GERENTE">Gerente</option><option value="ADMINISTRATIVO">Administrativo</option><option value="ADMIN">Admin</option></Select><FormErrorMessage>{errors.perfil?.message}</FormErrorMessage></FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderBottomWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={mutation.isPending}>Salvar</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};


// --- PÁGINA PRINCIPAL DE GESTÃO DE UTILIZADORES ---
const UtilizadoresPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isAddDrawerOpen, onOpen: onAddDrawerOpen, onClose: onAddDrawerClose } = useDisclosure();
  const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();
  
  const [selectedUser, setSelectedUser] = useState<IUtilizador | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<'VENDEDOR' | 'GERENTE' | 'ADMINISTRATIVO'>('VENDEDOR');

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
      const urlWhatsApp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem )}`;
      window.open(urlWhatsApp, '_blank');

      onConfirmModalClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao ativar', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleActivationClick = (user: IUtilizador) => {
    setSelectedUser(user);
    onConfirmModalOpen();
  };

  const handleConfirmActivation = () => {
    if (selectedUser) {
      ativacaoMutation.mutate({ id: selectedUser.id, perfil: selectedProfile });
    }
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
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onAddDrawerOpen}>Adicionar Utilizador</Button>
      </Flex>

      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email / Telefone</Th>
              <Th>Perfil</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {utilizadores?.map((user) => (
              <Tr key={user.id}>
                <Td fontWeight="medium">{user.nome}</Td>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text>{user.email}</Text>
                    <Text fontSize="sm" color="gray.500">{user.telefone}</Text>
                  </VStack>
                </Td>
                <Td>{user.perfil}</Td>
                <Td>{getStatusTag(user.status, user.perfil)}</Td>
                <Td>
                  {user.status === 'INATIVO' ? (
                    <Button
                      leftIcon={<FiUserCheck />}
                      colorScheme="green"
                      size="sm"
                      onClick={() => handleActivationClick(user)}
                    >
                      Ativar
                    </Button>
                  ) : (
                    <HStack>
                      <IconButton aria-label="Desativar" icon={<FiUserX />} isDisabled />
                      <IconButton as={Link} href={`https://wa.me/55${user.telefone.replace(/\D/g, '' )}`} target="_blank" aria-label="WhatsApp" icon={<FaWhatsapp />} colorScheme="whatsapp" />
                    </HStack>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isConfirmModalOpen} onClose={onConfirmModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ativar Acesso do Utilizador</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>Deseja realmente ativar o acesso para <strong>{selectedUser?.nome}</strong>?</Text>
            <FormControl isRequired>
              <FormLabel>Defina o perfil inicial:</FormLabel>
              <Select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value as any)}>
                <option value="VENDEDOR">Vendedor</option>
                <option value="GERENTE">Gerente</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
              </Select>
            </FormControl>
            <Text fontSize="sm" color="gray.600" mt={4}>
              Uma senha provisória será gerada e você será redirecionado para o WhatsApp para enviá-la.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmModalClose}>Cancelar</Button>
            <Button colorScheme="green" onClick={handleConfirmActivation} isLoading={ativacaoMutation.isPending}>
              Sim, Ativar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <FormularioUtilizador isOpen={isAddDrawerOpen} onClose={onAddDrawerClose} />
    </Box>
  );
};

export default UtilizadoresPage;
