import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, FormErrorMessage,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, useEffect } from 'react';

import {
  IFornecedor, IFornecedorForm, getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor
} from '../services/fornecedor.service';
import { useAuth } from '../hooks/useAuth';

// --- COMPONENTE: FORMULÁRIO DE FORNECEDOR (NO DRAWER) ---
// Adicionamos 'export' para que ele possa ser usado em outras páginas (como MovimentacoesPage)
export const FormularioFornecedor = ({ isOpen, onClose, fornecedor }: { isOpen: boolean; onClose: () => void; fornecedor: IFornecedor | null; }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<IFornecedorForm>();

  useEffect(() => {
    if (fornecedor) {
      setValue('nome', fornecedor.nome);
      setValue('cnpj_cpf', fornecedor.cnpj_cpf || '');
      setValue('telefone', fornecedor.telefone || '');
      setValue('email', fornecedor.email || '');
      setValue('endereco', fornecedor.endereco || '');
    } else {
      reset({ nome: '', cnpj_cpf: '', telefone: '', email: '', endereco: '' });
    }
  }, [fornecedor, setValue, reset]);

  const mutation = useMutation({
    mutationFn: (data: IFornecedorForm) => {
      if (fornecedor) {
        return updateFornecedor({ id: fornecedor.id, ...data });
      }
      return createFornecedor(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast({ title: `Fornecedor ${fornecedor ? 'atualizado' : 'criado'} com sucesso!`, status: 'success' });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar fornecedor', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const onSubmit: SubmitHandler<IFornecedorForm> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader borderBottomWidth="1px">{fornecedor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.nome}><FormLabel>Nome</FormLabel><Input {...register('nome', { required: 'Nome é obrigatório' })} /><FormErrorMessage>{errors.nome?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.cnpj_cpf}><FormLabel>CNPJ/CPF</FormLabel><Input {...register('cnpj_cpf')} /><FormErrorMessage>{errors.cnpj_cpf?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.telefone}><FormLabel>Telefone</FormLabel><Input {...register('telefone')} /><FormErrorMessage>{errors.telefone?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.email}><FormLabel>Email</FormLabel><Input type="email" {...register('email')} /><FormErrorMessage>{errors.email?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.endereco}><FormLabel>Endereço</FormLabel><Input {...register('endereco')} /><FormErrorMessage>{errors.endereco?.message}</FormErrorMessage></FormControl>
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

// --- PÁGINA PRINCIPAL DE GESTÃO DE FORNECEDORES ---
const FornecedoresPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();
  
  const [selectedFornecedor, setSelectedFornecedor] = useState<IFornecedor | null>(null);

  const { data: fornecedores, isLoading, isError } = useQuery<IFornecedor[]>({
    queryKey: ['fornecedores'],
    queryFn: getFornecedores,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast({ title: 'Fornecedor excluído com sucesso!', status: 'success' });
      onConfirmModalClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir fornecedor', description: error.response?.data?.error || error.message, status: 'error' });
    }
  });

  const handleAddClick = () => {
    setSelectedFornecedor(null);
    onDrawerOpen();
  };

  const handleEditClick = (fornecedor: IFornecedor) => {
    setSelectedFornecedor(fornecedor);
    onDrawerOpen();
  };

  const handleDeleteClick = (fornecedor: IFornecedor) => {
    setSelectedFornecedor(fornecedor);
    onConfirmModalOpen();
  };

  const handleConfirmDelete = () => {
    if (selectedFornecedor) {
      deleteMutation.mutate(selectedFornecedor.id);
    }
  };

  if (isLoading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (isError) return <Box p={8} textAlign="center"><Text color="red.500">Erro ao carregar fornecedores.</Text></Box>;

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading></Heading>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddClick}>Adicionar Fornecedor</Button>
      </Flex>

      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>CNPJ/CPF</Th>
              <Th>Contato</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fornecedores?.map((fornecedor) => (
              <Tr key={fornecedor.id}>
                <Td fontWeight="medium">{fornecedor.nome}</Td>
                <Td>{fornecedor.cnpj_cpf || 'N/A'}</Td>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text>{fornecedor.email || '---'}</Text>
                    <Text fontSize="sm" color="gray.500">{fornecedor.telefone || '---'}</Text>
                  </VStack>
                </Td>
                <Td>
                  <HStack>
                    <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleEditClick(fornecedor)} />
                    {user?.perfil === 'ADMIN' && (
                      <IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(fornecedor)} />
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isConfirmModalOpen} onClose={onConfirmModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Exclusão</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Tem certeza que deseja excluir o fornecedor <strong>{selectedFornecedor?.nome}</strong>?</Text>
            <Text fontSize="sm" color="red.500" mt={2}>Atenção: Esta ação não pode ser desfeita.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmModalClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} isLoading={deleteMutation.isPending}>
              Sim, Excluir
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {isDrawerOpen && (
        <FormularioFornecedor isOpen={isDrawerOpen} onClose={onDrawerClose} fornecedor={selectedFornecedor} />
      )}
    </Box>
  );
};

export default FornecedoresPage;
