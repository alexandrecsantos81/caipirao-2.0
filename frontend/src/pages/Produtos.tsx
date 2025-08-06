// frontend/src/pages/Produtos.tsx

import {
  Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel,
  Heading, IconButton, Input, NumberDecrementStepper, NumberIncrementStepper,
  NumberInput, NumberInputField, NumberInputStepper, Stack, Table, Tbody, Td,
  Text, Th, Thead, Tr, useDisclosure, useToast
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import { IProduto, createProduto, deleteProduto, getProdutos, updateProduto } from '../services/produto.service';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react'; // <<< CORREÇÃO: Importar o useState do React

type ProdutoFormData = Omit<IProduto, 'id' | 'criado_em'>;

const Produtos = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProdutoFormData>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // State para saber se estamos editando ou criando
  const [editingProduto, setEditingProduto] = useState<IProduto | null>(null);

  // Query para buscar os produtos
  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: getProdutos,
  });

  // Mutation para deletar um produto
  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Produto deletado com sucesso!', status: 'success', duration: 3000, isClosable: true });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao deletar produto.', description: error.response?.data?.msg || error.message, status: 'error', duration: 5000, isClosable: true });
    }
  });

  // Mutation para criar ou atualizar um produto
  const saveMutation = useMutation({
    mutationFn: (data: ProdutoFormData) => {
      // Corrigindo a chamada para usar o ID do estado
      if (editingProduto) {
        return updateProduto(editingProduto.id, data);
      }
      return createProduto(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: `Produto ${editingProduto ? 'atualizado' : 'criado'} com sucesso!`, status: 'success', duration: 3000, isClosable: true });
      handleCloseDrawer();
    },
    onError: (error: any) => {
      toast({ title: `Erro ao salvar produto.`, description: error.response?.data?.msg || error.message, status: 'error', duration: 5000, isClosable: true });
    }
  });

  const handleOpenDrawerForCreate = () => {
    setEditingProduto(null);
    reset({ nome: '', descricao: '', preco: 0, estoque: 0 });
    onOpen();
  };

  const handleOpenDrawerForEdit = (produto: IProduto) => {
    setEditingProduto(produto);
    // Usando os valores do produto para preencher o formulário
    setValue('nome', produto.nome);
    setValue('descricao', produto.descricao || '');
    setValue('preco', produto.preco);
    setValue('estoque', produto.estoque || 0);
    onOpen();
  };

  const handleCloseDrawer = () => {
    setEditingProduto(null);
    reset();
    onClose();
  };

  const onSubmit = (data: ProdutoFormData) => {
    const payload = {
      ...data,
      preco: Number(data.preco),
      estoque: Number(data.estoque),
    };
    saveMutation.mutate(payload);
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Produtos</Heading>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleOpenDrawerForCreate}>
            Novo Produto
          </Button>
        )}
      </Flex>

      {isLoading ? (
        <Text>Carregando produtos...</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Descrição</Th>
              <Th isNumeric>Preço (R$)</Th>
              <Th isNumeric>Estoque</Th>
              {isAdmin && <Th>Ações</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {produtos?.map((produto) => (
              <Tr key={produto.id}>
                <Td>{produto.nome}</Td>
                <Td>{produto.descricao}</Td>
                {/* <<< CORREÇÃO: Garantir que o preço seja sempre um número para toFixed */}
                <Td isNumeric>{typeof produto.preco === 'number' ? produto.preco.toFixed(2) : '0.00'}</Td>
                <Td isNumeric>{produto.estoque}</Td>
                {isAdmin && (
                  <Td>
                    <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenDrawerForEdit(produto)} mr={2} />
                    <IconButton 
                      aria-label="Deletar" 
                      icon={<FiTrash2 />} 
                      colorScheme="red" 
                      onClick={() => deleteMutation.mutate(produto.id)}
                      isLoading={deleteMutation.isPending && deleteMutation.variables === produto.id} // <<< MELHORIA: Mostra loading no botão de deletar
                    />
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Drawer para Formulário de Criação/Edição */}
      <Drawer isOpen={isOpen} placement="right" onClose={handleCloseDrawer} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{editingProduto ? 'Editar Produto' : 'Criar Novo Produto'}</DrawerHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DrawerBody>
              <Stack spacing={4}>
                <FormControl isInvalid={!!errors.nome}>
                  <FormLabel htmlFor="nome">Nome do Produto</FormLabel>
                  <Input id="nome" {...register('nome', { required: 'Nome é obrigatório' })} />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="descricao">Descrição</FormLabel>
                  <Input id="descricao" {...register('descricao')} />
                </FormControl>
                <FormControl isInvalid={!!errors.preco}>
                  <FormLabel htmlFor="preco">Preço</FormLabel>
                  <NumberInput defaultValue={0} precision={2} step={0.1}>
                    <NumberInputField id="preco" {...register('preco', { required: 'Preço é obrigatório', valueAsNumber: true, min: { value: 0.01, message: 'Preço deve ser positivo' } })} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="estoque">Estoque</FormLabel>
                  <NumberInput defaultValue={0} min={0}>
                    <NumberInputField id="estoque" {...register('estoque', { valueAsNumber: true })} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Stack>
            </DrawerBody>
            <DrawerFooter borderTopWidth="1px">
              <Button variant="outline" mr={3} onClick={handleCloseDrawer}>
                Cancelar
              </Button>
              <Button colorScheme="teal" type="submit" isLoading={saveMutation.isPending}>
                Salvar
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Produtos;
