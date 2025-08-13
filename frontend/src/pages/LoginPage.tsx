import { useState } from 'react';
import {
  Box, Button, FormControl, FormErrorMessage, FormLabel, Input, VStack, Heading, useToast, Text, Link as ChakraLink,
  Flex,
  InputGroup,         // <-- Importar
  InputRightElement,  // <-- Importar
  IconButton,         // <-- Importar
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'; // <-- Importar ícones
import { useMutation } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';

import { login } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [credencial, setCredencial] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <-- Estado para controlar a visibilidade
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
    onError: (error: any) => {
      toast({
        title: 'Erro no login',
        description: error.response?.data?.error || 'Falha na autenticação. Verifique suas credenciais.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credencial || !senha) {
        toast({ title: 'Atenção', description: 'Por favor, preencha todos os campos.', status: 'warning', duration: 3000, isClosable: true });
        return;
    }
    loginMutation.mutate({ credencial, senha });
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
    >
      <Box p={8} width="full" maxWidth="400px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Heading as="h1" size="lg" textAlign="center">Login Caipirão 3.0</Heading>
            <FormControl isRequired isInvalid={loginMutation.isError}>
              <FormLabel>Email, Nickname ou Telefone</FormLabel>
              <Input
                value={credencial}
                onChange={(e) => setCredencial(e.target.value)}
                placeholder="Digite sua credencial"
              />
            </FormControl>

            {/* CAMPO DE SENHA MODIFICADO */}
            <FormControl isRequired isInvalid={loginMutation.isError}>
              <FormLabel>Senha</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'} // <-- Tipo dinâmico
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="********"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    variant="ghost"
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    // Revela a senha ao pressionar e oculta ao soltar
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)} // Para dispositivos móveis
                    onTouchEnd={() => setShowPassword(false)}   // Para dispositivos móveis
                  />
                </InputRightElement>
              </InputGroup>
              {loginMutation.isError && (
                  <FormErrorMessage>Credenciais inválidas. Tente novamente.</FormErrorMessage>
              )}
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
    </Flex>
  );
};

export default LoginPage;
