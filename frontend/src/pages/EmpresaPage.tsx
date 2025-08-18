// frontend/src/pages/EmpresaPage.tsx

import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getEmpresaDados, updateEmpresaDados, IEmpresaForm } from '@/services/empresa.service';

const EmpresaPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: empresaDados, isLoading, isError, error } = useQuery({
    queryKey: ['empresaDados'],
    queryFn: getEmpresaDados,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IEmpresaForm>();

  useEffect(() => {
    if (empresaDados) {
      reset(empresaDados);
    }
  }, [empresaDados, reset]);

  const mutation = useMutation({
    mutationFn: updateEmpresaDados,
    // AQUI ESTÁ A CORREÇÃO: 'data' foi removido pois não era usado.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresaDados'] });
      toast({
        title: 'Sucesso!',
        description: 'Os dados da empresa foram atualizados.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const onSubmit: SubmitHandler<IEmpresaForm> = (data) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
        <Text mt={4}>Carregando dados da empresa...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box textAlign="center" mt={10} color="red.500">
        <Heading size="md">Ocorreu um erro</Heading>
        <Text mt={2}>{error.message}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading as="h1" size="xl" mb={8}>
        Dados da Empresa
      </Heading>

      <Box as="form" onSubmit={handleSubmit(onSubmit)} p={8} borderWidth={1} borderRadius="md" boxShadow="lg" bg="white" _dark={{ bg: 'gray.700' }}>
        <VStack spacing={6}>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} w="100%">
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isInvalid={!!errors.nome_fantasia} isRequired>
                <FormLabel htmlFor="nome_fantasia">Nome Fantasia</FormLabel>
                <Input
                  id="nome_fantasia"
                  {...register('nome_fantasia', { required: 'Nome Fantasia é obrigatório' })}
                />
                <FormErrorMessage>{errors.nome_fantasia?.message}</FormErrorMessage>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl isInvalid={!!errors.razao_social}>
                <FormLabel htmlFor="razao_social">Razão Social</FormLabel>
                <Input id="razao_social" {...register('razao_social')} />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl isInvalid={!!errors.cnpj}>
                <FormLabel htmlFor="cnpj">CNPJ</FormLabel>
                <Input id="cnpj" {...register('cnpj')} />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl isInvalid={!!errors.inscricao_estadual}>
                <FormLabel htmlFor="inscricao_estadual">Inscrição Estadual</FormLabel>
                <Input id="inscricao_estadual" {...register('inscricao_estadual')} />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl isInvalid={!!errors.telefone}>
                <FormLabel htmlFor="telefone">Telefone</FormLabel>
                <Input id="telefone" {...register('telefone')} />
              </FormControl>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel htmlFor="email">Email de Contato</FormLabel>
                <Input id="email" type="email" {...register('email')} />
              </FormControl>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isInvalid={!!errors.endereco_completo}>
                <FormLabel htmlFor="endereco_completo">Endereço Completo</FormLabel>
                <Textarea id="endereco_completo" {...register('endereco_completo')} />
              </FormControl>
            </GridItem>
          </Grid>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting || mutation.isPending}
            loadingText="Salvando..."
            size="lg"
            w="full"
            mt={4}
          >
            Salvar Alterações
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default EmpresaPage;
