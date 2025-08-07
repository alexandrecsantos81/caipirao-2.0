// frontend/src/pages/login.tsx

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Container,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';

// CORREÇÃO: Verifique se o nome do arquivo é exatamente 'auth.service.ts'
import { login, LoginCredentials } from '../services/auth.service'; 

interface LoginResponse {
  token: string;
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const toast = useToast();

  const loginMutation = useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      toast({
        title: 'Login bem-sucedido!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      window.location.href = '/'; 
    },
    
    onError: (error) => {
      toast({
        title: 'Erro no login',
        description: error.message || 'E-mail ou senha inválidos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, senha });
  };

  return (
    <Container centerContent>
      <Box
        p={8}
        mt={20}
        maxWidth="400px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        <VStack as="form" onSubmit={handleSubmit} spacing={4}>
          <Heading as="h1" size="lg" textAlign="center">
            Login Caipirão 3.0
          </Heading>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
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
      </Box>
    </Container>
  );
};

export default Login;
