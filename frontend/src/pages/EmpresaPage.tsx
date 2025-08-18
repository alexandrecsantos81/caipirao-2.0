// frontend/src/pages/EmpresaPage.tsx

import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast,
  Spinner, Text, Center, Image, VisuallyHidden, Icon, Flex
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { FiUploadCloud } from 'react-icons/fi';

import { getEmpresaData, updateEmpresaData, uploadLogoEmpresa } from '@/services/empresa.service';
import { IEmpresaDados } from '@/types/empresa.types';

const EmpresaPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: empresaData, isLoading, isError } = useQuery<IEmpresaDados>({
    queryKey: ['empresaDados'],
    queryFn: getEmpresaData,
  });

  const { register, handleSubmit, reset } = useForm<IEmpresaDados>();

  useEffect(() => {
    if (empresaData) {
      reset(empresaData); // Preenche o formulário com os dados do backend
      setPreview(empresaData.logo_url || null); // Define a pré-visualização inicial
    }
  }, [empresaData, reset]);

  const updateMutation = useMutation({
    mutationFn: updateEmpresaData,
    onSuccess: (data) => {
      queryClient.setQueryData(['empresaDados'], data);
      toast({ title: 'Dados da empresa atualizados com sucesso!', status: 'success' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar dados', description: error.message, status: 'error' });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadLogoEmpresa,
    onSuccess: (data) => {
      queryClient.setQueryData(['empresaDados'], (oldData: IEmpresaDados | undefined) => 
        oldData ? { ...oldData, logo_url: data.logoUrl } : { logo_url: data.logoUrl }
      );
      setPreview(data.logoUrl);
      toast({ title: 'Logo atualizado com sucesso!', status: 'success' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro no upload do logo', description: error.message, status: 'error' });
    },
  });

  const onSubmit: SubmitHandler<IEmpresaDados> = (data) => {
    updateMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      uploadMutation.mutate(file);
    }
  };

  if (isLoading) return <Center h="200px"><Spinner size="xl" /></Center>;
  if (isError) return <Center h="200px"><Text color="red.500">Erro ao carregar dados da empresa.</Text></Center>;

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading mb={6}>Minha Empresa</Heading>
      <Flex direction={{ base: 'column', md: 'row' }} gap={10}>
        
        {/* Coluna do Logo */}
        <VStack spacing={4} w={{ base: '100%', md: '300px' }}>
          <FormLabel>Logo da Empresa</FormLabel>
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="md"
            p={4}
            w="250px"
            h="250px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            position="relative"
            overflow="hidden"
            bg={preview ? 'transparent' : 'gray.50'}
          >
            <VisuallyHidden>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
              />
            </VisuallyHidden>
            {uploadMutation.isPending ? (
              <Spinner />
            ) : preview ? (
              <Image src={preview} alt="Pré-visualização do logo" maxW="100%" maxH="100%" objectFit="contain" />
            ) : (
              <VStack>
                <Icon as={FiUploadCloud} boxSize={10} color="gray.500" />
                <Text textAlign="center" color="gray.500">Clique para enviar</Text>
              </VStack>
            )}
          </Box>
        </VStack>

        {/* Coluna do Formulário */}
        <Box as="form" onSubmit={handleSubmit(onSubmit)} flex="1">
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Nome Fantasia</FormLabel>
              <Input {...register('nome_fantasia')} />
            </FormControl>
            <FormControl>
              <FormLabel>Razão Social</FormLabel>
              <Input {...register('razao_social')} />
            </FormControl>
            <FormControl>
              <FormLabel>CNPJ</FormLabel>
              <Input {...register('cnpj')} />
            </FormControl>
            <FormControl>
              <FormLabel>Inscrição Estadual</FormLabel>
              <Input {...register('inscricao_estadual')} />
            </FormControl>
            <FormControl>
              <FormLabel>Telefone</FormLabel>
              <Input {...register('telefone')} />
            </FormControl>
            <FormControl>
              <FormLabel>Endereço Completo</FormLabel>
              <Input {...register('endereco_completo')} />
            </FormControl>
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={updateMutation.isPending}
              loadingText="Salvando..."
              size="lg"
              w="full"
              mt={4}
            >
              Salvar Alterações
            </Button>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default EmpresaPage;
