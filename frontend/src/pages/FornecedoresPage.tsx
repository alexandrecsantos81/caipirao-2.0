// frontend/src/pages/FornecedoresPage.tsx

import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, FormErrorMessage,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  useBreakpointValue,
  Divider,
  Center,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import {
  IFornecedor, IFornecedorForm, getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor
} from '../services/fornecedor.service';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/Pagination';

export const FormularioFornecedor = ({ isOpen, onClose, fornecedor, onSave, isLoading }: { 
  isOpen: boolean; 
  onClose: () => void; 
  fornecedor: IFornecedor | null; 
  onSave: (data: IFornecedorForm, id?: number) => void;
  isLoading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IFornecedorForm>();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });
  
  useEffect(() => {
    if (isOpen) {
      if (fornecedor) {
        reset(fornecedor);
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
                  textTransform="uppercase" // ✅ Caixa alta
                />
                <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.cnpj_cpf}><FormLabel>CNPJ/CPF</FormLabel><Input {...register('cnpj_cpf')} /><FormErrorMessage>{errors.cnpj_cpf?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.telefone}><FormLabel>Telefone</FormLabel><Input {...register('telefone')} /><FormErrorMessage>{errors.telefone?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.email}><FormLabel>Email</FormLabel><Input type="email" {...register('email')} /><FormErrorMessage>{errors.email?.message}</FormErrorMessage></FormControl>
              <FormControl isInvalid={!!errors.endereco}>
                <FormLabel>Endereço</FormLabel>
                <Input 
                  {...register('endereco')} 
                  textTransform="uppercase" // ✅ Caixa alta
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

const FornecedoresPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();
  
  const [selectedFornecedor, setSelectedFornecedor] = useState<IFornecedor | null>(null);
  const [pagina, setPagina] = useState(1);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fornecedores', pagina],
    queryFn: () => getFornecedores(pagina, 10),
    placeholderData: keepPreviousData,
  });

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

  const handleSave = (formData: IFornecedorForm, id?: number) => {
    saveMutation.mutate({ data: formData, id });
  };

  if (isLoading) return <Center p={8}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={8}><Text color="red.500">Erro ao carregar fornecedores.</Text></Center>;

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Fornecedores</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>Adicionar Fornecedor</Button>
      </Flex>

      {isMobile ? (
        <VStack spacing={4} align="stretch">
          {data?.dados.map((fornecedor) => (
            <Box key={fornecedor.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
              <Flex justify="space-between" align="center">
                <Heading size="sm" noOfLines={1}>{fornecedor.nome}</Heading>
                <HStack spacing={1}>
                  <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => handleEditClick(fornecedor)} />
                  {user?.perfil === 'ADMIN' && (
                    <IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" size="sm" onClick={() => handleDeleteClick(fornecedor)} />
                  )}
                </HStack>
              </Flex>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">CNPJ/CPF:</Text>
                <Text>{fornecedor.cnpj_cpf || 'Não informado'}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">Telefone:</Text>
                <Text>{fornecedor.telefone || 'Não informado'}</Text>
              </HStack>
            </Box>
          ))}
        </VStack>
      ) : (
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
              {data?.dados.map((fornecedor) => (
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
      )}

      <Pagination
        paginaAtual={data?.pagina || 1}
        totalPaginas={data?.totalPaginas || 1}
        onPageChange={(page) => setPagina(page)}
      />

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
