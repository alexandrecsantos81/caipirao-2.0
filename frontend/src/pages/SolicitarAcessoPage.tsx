// frontend/src/pages/SolicitarAcessoPage.tsx

import {
  Box, Button, Container, FormControl, FormErrorMessage, FormLabel, Heading, Input,
  Link as ChakraLink, Text, useToast, VStack
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { ISolicitacaoAcessoForm, solicitarAcesso } from '../services/utilizador.service';

const SolicitarAcessoPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ISolicitacaoAcessoForm>();

  const mutation = useMutation({
    mutationFn: solicitarAcesso,
    onSuccess: (data) => {
      toast({
        title: 'Solicitação Enviada!',
        description: data.message,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
      navigate('/login'); // Redireciona para a página de login após o sucesso
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na Solicitação',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    }
  });

  const onSubmit: SubmitHandler<ISolicitacaoAcessoForm> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Container centerContent>
      <Box p={8} mt={20} maxWidth="450px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <Heading as="h1" size="lg" textAlign="center">Solicitar Acesso</Heading>
            <Text textAlign="center" color="gray.600">Preencha seus dados. Um administrador irá analisar e liberar seu acesso.</Text>
            
            <FormControl isRequired isInvalid={!!errors.nome}>
              <FormLabel>Nome Completo</FormLabel>
              <Input {...register('nome', { required: 'Nome é obrigatório' })} />
              <FormErrorMessage>{errors.nome?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type="email" {...register('email', { required: 'Email é obrigatório' })} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.telefone}>
              <FormLabel>Telefone (com DDD)</FormLabel>
              <Input type="tel" placeholder="Ex: 62999998888" {...register('telefone', { required: 'Telefone é obrigatório' })} />
              <FormErrorMessage>{errors.telefone?.message}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="teal"
              width="full"
              isLoading={mutation.isPending}
            >
              Enviar Solicitação
            </Button>
          </VStack>
        </form>
        <Text mt={6} textAlign="center">
          Já tem uma conta?{' '}
          <ChakraLink as={RouterLink} to="/login" color="teal.500" fontWeight="bold">
            Fazer Login
          </ChakraLink>
        </Text>
      </Box>
    </Container>
  );
};

export default SolicitarAcessoPage;
