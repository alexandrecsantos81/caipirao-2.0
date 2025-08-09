import {
  Box, Button, Center, Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel,
  Heading, IconButton, Input, NumberInput, NumberInputField, Select, Spinner,
  Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import {
  IProduto, createProduto, deleteProduto, getProdutos, updateProduto, IProdutoForm,
} from '../services/produto.service';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../hooks/useAuth'; // 1. IMPORTAR O HOOK

type ProdutoFormData = IProdutoForm & {
  outra_unidade_medida?: string;
};

const FormularioProduto = ({ isOpen, onClose, produto, onSave, isLoading }: {
  isOpen: boolean; onClose: () => void; produto: IProduto | null; onSave: (data: ProdutoFormData) => void; isLoading: boolean;
}) => {
  const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm<ProdutoFormData>();
  const unidadeMedida = watch('unidade_medida');

  useEffect(() => {
    if (isOpen) {
      if (produto) {
        setValue('nome', produto.nome);
        setValue('price', produto.price);
        const unidadesPadrao = ['un', 'kg'];
        if (unidadesPadrao.includes(produto.unidade_medida)) {
          setValue('unidade_medida', produto.unidade_medida);
          setValue('outra_unidade_medida', '');
        } else {
          setValue('unidade_medida', 'outros');
          setValue('outra_unidade_medida', produto.unidade_medida);
        }
      } else {
        reset({ nome: '', price: undefined, unidade_medida: 'un', outra_unidade_medida: '' });
      }
    }
  }, [isOpen, produto, setValue, reset]);

  const handleFormSubmit = (data: ProdutoFormData) => {
    const finalData = { ...data };
    if (data.unidade_medida === 'outros' && data.outra_unidade_medida) {
      finalData.unidade_medida = data.outra_unidade_medida;
    }
    onSave(finalData);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{produto ? 'Editar Produto' : 'Criar Novo Produto'}</DrawerHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DrawerBody>
            <Stack spacing={4}>
              <FormControl isInvalid={!!errors.nome}>
                <FormLabel htmlFor="nome">Nome do Produto</FormLabel>
                <Input
                  id="nome"
                  placeholder="Informe o nome do produto"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                />
                {errors.nome && <Text color="red.500" fontSize="sm" mt={1}>{errors.nome.message}</Text>}
              </FormControl>

              <FormControl isInvalid={!!errors.unidade_medida}>
                <FormLabel htmlFor="unidade_medida">Unidade de Medida</FormLabel>
                <Select id="unidade_medida" {...register('unidade_medida', { required: 'Unidade de medida é obrigatória' })}>
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="outros">Outros</option>
                </Select>
              </FormControl>

              {unidadeMedida === 'outros' && (
                <FormControl isInvalid={!!errors.outra_unidade_medida}>
                  <FormLabel htmlFor="outra_unidade_medida">Especifique a Unidade (ex: dz, cx)</FormLabel>
                  <Input id="outra_unidade_medida" {...register('outra_unidade_medida', { required: unidadeMedida === 'outros' ? 'Especifique a unidade' : false })} />
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.price}>
                <FormLabel htmlFor="price">Preço (R$)</FormLabel>
                <Controller
                  name="price"
                  control={control}
                  rules={{ required: 'Preço é obrigatório', min: { value: 0, message: 'Preço não pode ser negativo' } }}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <NumberInput
                      id="price"
                      onChange={(_valAsString, valAsNumber) => onChange(valAsNumber)}
                      onBlur={onBlur}
                      value={value}
                      ref={ref}
                      precision={2}
                      step={0.1}
                      min={0}
                    >
                      <NumberInputField placeholder="Informe o valor" />
                    </NumberInput>
                  )}
                />
                {errors.price && <Text color="red.500" fontSize="sm" mt={1}>{errors.price.message}</Text>}
              </FormControl>
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

const ProdutosPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [editingProduto, setEditingProduto] = useState<IProduto | null>(null);
  const { user } = useAuth(); // 2. OBTER O USUÁRIO
  const isAdmin = user?.perfil === 'ADMIN'; // 3. CRIAR A VARIÁVEL DE VERIFICAÇÃO

  const { data, isLoading } = useQuery({
    queryKey: ['produtos', pagina],
    queryFn: () => getProdutos(pagina, 10),
  });
  
  const deleteMutation = useMutation({ mutationFn: deleteProduto, onSuccess: async () => { toast({ title: 'Produto deletado!', status: 'success', duration: 3000, isClosable: true }); await queryClient.invalidateQueries({ queryKey: ['produtos'] }); }, onError: (error: any) => { toast({ title: 'Erro ao deletar.', description: error.message, status: 'error', duration: 5000, isClosable: true }); } });
  const saveMutation = useMutation({ mutationFn: (data: { formData: IProdutoForm; id?: number }) => (data.id ? updateProduto(data.id, data.formData) : createProduto(data.formData)), onSuccess: async () => { toast({ title: `Produto salvo com sucesso!`, status: 'success', duration: 3000, isClosable: true }); await queryClient.invalidateQueries({ queryKey: ['produtos'] }); onClose(); }, onError: (error: any) => { toast({ title: `Erro ao salvar produto.`, description: error.message, status: 'error', duration: 5000, isClosable: true }); } });
  const handleSave = (formData: IProdutoForm) => { saveMutation.mutate({ formData, id: editingProduto?.id }); };
  const handleOpenForCreate = () => { setEditingProduto(null); onOpen(); };
  const handleOpenForEdit = (produto: IProduto) => { setEditingProduto(produto); onOpen(); };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading></Heading>
        {/* 4. RENDERIZAÇÃO CONDICIONAL DO BOTÃO "NOVO PRODUTO" */}
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleOpenForCreate}>
            Novo Produto
          </Button>
        )}
      </Flex>
      {isLoading && <Center><Spinner size="xl" /></Center>}
      {!isLoading && data && (
        <>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome</Th>
                <Th>Unidade</Th>
                <Th isNumeric>Preço (R$)</Th>
                {/* 5. RENDERIZAÇÃO CONDICIONAL DA COLUNA DE AÇÕES */}
                {isAdmin && <Th>Ações</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {data.dados.map((produto) => (
                <Tr key={produto.id}>
                  <Td>{produto.nome}</Td>
                  <Td>{produto.unidade_medida}</Td>
                  <Td isNumeric>{typeof produto.price === 'number' ? produto.price.toFixed(2) : '0.00'}</Td>
                  {/* 6. RENDERIZAÇÃO CONDICIONAL DOS BOTÕES DE AÇÃO */}
                  {isAdmin && (
                    <Td>
                      <IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleOpenForEdit(produto)} mr={2} />
                      <IconButton aria-label="Deletar" icon={<FiTrash2 />} colorScheme="red" onClick={() => deleteMutation.mutate(produto.id)} isLoading={deleteMutation.isPending && deleteMutation.variables === produto.id} />
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination paginaAtual={pagina} totalPaginas={data.totalPaginas || 1} onPageChange={(page) => setPagina(page)} />
        </>
      )}
      {!isLoading && !data && (<Center p={10}><Text color="red.500" fontWeight="bold">Falha ao carregar os produtos. Verifique se o servidor backend está rodando.</Text></Center>)}
      
      {/* 7. RENDERIZAÇÃO CONDICIONAL DO FORMULÁRIO */}
      {isAdmin && (
        <FormularioProduto isOpen={isOpen} onClose={onClose} produto={editingProduto} onSave={handleSave} isLoading={saveMutation.isPending} />
      )}
    </Box>
  );
};

export default ProdutosPage;
