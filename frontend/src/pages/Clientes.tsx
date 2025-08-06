// frontend/src/pages/Clientes.tsx

import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import React, { useState, useEffect, useRef } from 'react';
import {
  Cliente,
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from '../services/cliente.service';

const PaginaClientes = () => {
  // --- ESTADOS E HOOKS ---
  const { isOpen, onOpen, onClose } = useDisclosure(); // Controla o Drawer
  const toast = useToast(); // Para exibir notificações
  const btnRef = useRef<HTMLButtonElement>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]); // Armazena a lista de clientes
  const [clienteAtual, setClienteAtual] = useState<Partial<Cliente>>({}); // Dados do formulário
  const [isEditing, setIsEditing] = useState(false); // Controla se o formulário é de edição ou criação
  const [isLoading, setIsLoading] = useState(true); // Controla o feedback de carregamento
  const [error, setError] = useState<string | null>(null); // Armazena mensagens de erro

  // --- FUNÇÕES DE DADOS ---

  // Função para buscar os clientes da API
  const carregarClientes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      setError('Falha ao carregar os clientes. Verifique se o backend está rodando.');
      toast({ title: 'Erro', description: error, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect para carregar os clientes quando o componente é montado
  useEffect(() => {
    // Para testar, precisamos de um token. Crie um usuário e faça login no Postman/Insomnia.
    // Copie o token gerado e cole no localStorage do seu navegador.
    // 1. Abra o DevTools (F12) -> Aba "Application" -> localStorage
    // 2. Adicione uma nova chave "token" com o valor "SEU_TOKEN_JWT_AQUI"
    carregarClientes();
  }, []);

  // --- FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ---

  const handleAdicionar = () => {
    setIsEditing(false);
    setClienteAtual({});
    onOpen();
  };

  const handleEditar = (cliente: Cliente) => {
    setIsEditing(true);
    setClienteAtual(cliente);
    onOpen();
  };

  const handleDeletar = async (id: number) => {
    try {
      await deleteCliente(id);
      toast({ title: 'Sucesso', description: 'Cliente deletado com sucesso.', status: 'success' });
      carregarClientes(); // Recarrega a lista após deletar
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao deletar o cliente.', status: 'error' });
    }
  };

  const handleSalvar = async () => {
    const { nome, email, telefone } = clienteAtual;
    if (!nome || !email || !telefone) {
      toast({ title: 'Erro de Validação', description: 'Nome, email e telefone são obrigatórios.', status: 'warning' });
      return;
    }

    try {
      if (isEditing) {
        await updateCliente(clienteAtual.id!, clienteAtual as Omit<Cliente, 'id'>);
        toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso.', status: 'success' });
      } else {
        await createCliente(clienteAtual as Omit<Cliente, 'id'>);
        toast({ title: 'Sucesso', description: 'Cliente criado com sucesso.', status: 'success' });
      }
      onClose();
      carregarClientes(); // Recarrega a lista após salvar
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || `Falha ao salvar o cliente.`;
      toast({ title: 'Erro', description: errorMsg, status: 'error' });
    }
  };

  // --- RENDERIZAÇÃO ---

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Text color="red.500">{error}</Text>
      </Flex>
    );
  }

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Gestão de Clientes</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={handleAdicionar} ref={btnRef}>Novo Cliente</Button>
      </Flex>

      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>Nome</Th><Th>Email</Th><Th>Telefone</Th><Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {clientes.map((cliente) => (
            <Tr key={cliente.id}>
              <Td>{cliente.nome}</Td>
              <Td>{cliente.email}</Td>
              <Td>{cliente.telefone}</Td>
              <Td>
                <Button size="sm" mr={2} onClick={() => handleEditar(cliente)}><EditIcon /></Button>
                <Button size="sm" colorScheme="red" onClick={() => handleDeletar(cliente.id)}><DeleteIcon /></Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={btnRef} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{isEditing ? 'Editar Cliente' : 'Criar Novo Cliente'}</DrawerHeader>
          <DrawerBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input placeholder="Nome completo" value={clienteAtual.nome || ''} onChange={(e) => setClienteAtual({ ...clienteAtual, nome: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" placeholder="email@dominio.com" value={clienteAtual.email || ''} onChange={(e) => setClienteAtual({ ...clienteAtual, email: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Telefone</FormLabel>
                <Input placeholder="(99) 99999-9999" value={clienteAtual.telefone || ''} onChange={(e) => setClienteAtual({ ...clienteAtual, telefone: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Coordenada X</FormLabel>
                <Input type="number" placeholder="Opcional" value={clienteAtual.coordenada_x || ''} onChange={(e) => setClienteAtual({ ...clienteAtual, coordenada_x: p
