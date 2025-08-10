// frontend/src/pages/Login.tsx

import { useState } from 'react';
import {
  Box, Button, Container, FormControl, FormLabel, Input, VStack, Heading, useToast, Text, Link as ChakraLink
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';

import { login } from '../services/auth.service'; // <-- CORREÇÃO: Removida a importação de LoginCredentials
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [credencial, setCredencial] = useState('');
  const [senha, setSenha] = useState('');
  const toast = useToast();
  const { login: authLogin } = useAuth();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      authLogin(data.token);
      toast({
        title: 'Login bem-sucedido!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no login',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ credencial, senha });
  };

  return (
    <Container centerContent>
      <Box p={8} mt={20} maxWidth="400px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Heading as="h1" size="lg" textAlign="center">Login Caipirão 3.0</Heading>
            <FormControl isRequired>
              <FormLabel>Email, Nickname ou Telefone</FormLabel>
              <Input
                value={credencial}
                onChange={(e) => setCredencial(e.target.value)}
                placeholder="Digite sua credencial"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Senha</FormLabel>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="********"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="teal"
              width="full"
              isLoading={loginMutation.isPending}
            >
              Entrar
            </Button>
          </VStack>
        </form>
        <Text mt={6} textAlign="center">
          É novo por aqui?{' '}
          <ChakraLink as={RouterLink} to="/solicitar-acesso" color="teal.500" fontWeight="bold">
            Solicitar Acesso
          </ChakraLink>
        </Text>
      </Box>
    </Container>
  );
};

export default LoginPage;
