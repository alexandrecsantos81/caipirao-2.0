// frontend/src/pages/FinancasPage.tsx

import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, VStack, HStack,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  FormControl, FormLabel, Input, FormErrorMessage,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogContent, AlertDialogOverlay,
  Center, useBreakpointValue, ModalHeader,
  Tabs, TabList, TabPanels, Tab, SimpleGrid, useColorModeValue,
  TabPanel
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';

import {
  IReceitaExterna, IReceitaExternaForm, getReceitasExternas, createReceitaExterna, updateReceitaExterna, deleteReceitaExterna
} from '../services/receitaExterna.service';
import { DashboardFinanceiro } from '../components/DashboardFinanceiro';

// Componente FormularioReceita (sem alterações, omitido para brevidade)
const FormularioReceita = ({ isOpen, onClose, receita, onSave, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  receita: IReceitaExterna | null;
  onSave: (data: IReceitaExternaForm, id?: number) => void;
  isLoading: boolean;
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IReceitaExternaForm>();
  const drawerSize = useBreakpointValue({ base: 'full', md: 'md' });

  useEffect(() => {
    if (isOpen) {
      if (receita) {
        reset({
          ...receita,
          data_recebimento: receita.data_recebimento.split('T')[0],
        });
      } else {
        reset({
          descricao: '',
          valor: undefined,
          data_recebimento: new Date().toISOString().split('T')[0],
          categoria: '',
        });
      }
    }
  }, [receita, isOpen, reset]);

  const onSubmit: SubmitHandler<IReceitaExternaForm> = (data) => {
    onSave(data, receita?.id);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader borderBottomWidth="1px">{receita ? 'Editar Receita' : 'Adicionar Nova Receita'}</DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.descricao}>
              <FormLabel>Descrição</FormLabel>
              <Input {...register('descricao', { required: 'Descrição é obrigatória' })} textTransform="uppercase" />
              <FormErrorMessage>{errors.descricao?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.valor}>
              <FormLabel>Valor (R$)</FormLabel>
              <Input type="number" step="0.01" {...register('valor', { required: 'Valor é obrigatório', valueAsNumber: true })} />
              <FormErrorMessage>{errors.valor?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.data_recebimento}>
              <FormLabel>Data de Recebimento</FormLabel>
              <Input type="date" {...register('data_recebimento', { required: 'Data é obrigatória' })} />
              <FormErrorMessage>{errors.data_recebimento?.message}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Input {...register('categoria')} placeholder="Ex: Salário, Aluguel, Freelance" textTransform="uppercase" />
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="teal" type="submit" isLoading={isLoading}>Salvar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};


// Componente TabelaReceitasExternas (sem alterações, omitido para brevidade)
const TabelaReceitasExternas = () => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    const [selectedReceita, setSelectedReceita] = useState<IReceitaExterna | null>(null);
    const [itemParaDeletar, setItemParaDeletar] = useState<IReceitaExterna | null>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['receitasExternas'],
        queryFn: () => getReceitasExternas(),
    });

    const saveMutation = useMutation({
        mutationFn: ({ data, id }: { data: IReceitaExternaForm; id?: number }) =>
        id ? updateReceitaExterna({ id, data }) : createReceitaExterna(data),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receitasExternas'] });
        toast({ title: `Receita salva com sucesso!`, status: 'success' });
        onDrawerClose();
        },
        onError: (error: any) => {
        toast({ title: 'Erro ao salvar receita', description: error.response?.data?.error || error.message, status: 'error' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteReceitaExterna,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receitasExternas'] });
        toast({ title: 'Receita excluída com sucesso!', status: 'success' });
        onConfirmClose();
        },
        onError: (error: any) => {
        toast({ title: 'Erro ao excluir receita', description: error.response?.data?.error || error.message, status: 'error' });
        }
    });

    const handleAddClick = () => { setSelectedReceita(null); onDrawerOpen(); };
    const handleEditClick = (receita: IReceitaExterna) => { setSelectedReceita(receita); onDrawerOpen(); };
    const handleDeleteClick = (receita: IReceitaExterna) => { setItemParaDeletar(receita); onConfirmOpen(); };
    const handleConfirmDelete = () => { if (itemParaDeletar) { deleteMutation.mutate(itemParaDeletar.id); } };
    const handleSave = (formData: IReceitaExternaForm, id?: number) => { saveMutation.mutate({ data: formData, id }); };

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Receitas Externas</Heading>
                <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>
                Adicionar Receita
                </Button>
            </Flex>

            {isLoading ? <Center p={8}><Spinner size="xl" /></Center> : isError ? <Center p={8}><Text color="red.500">Erro ao carregar receitas.</Text></Center> : (
                <TableContainer>
                <Table variant="striped">
                    <Thead><Tr><Th>Data</Th><Th>Descrição</Th><Th>Categoria</Th><Th isNumeric>Valor (R$)</Th><Th>Ações</Th></Tr></Thead>
                    <Tbody>
                    {data?.map((receita) => (
                        <Tr key={receita.id}><Td>{new Date(receita.data_recebimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td><Td>{receita.descricao}</Td><Td>{receita.categoria || '---'}</Td><Td isNumeric color="green.500" fontWeight="bold">{receita.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td><Td><HStack><IconButton aria-label="Editar" icon={<FiEdit />} onClick={() => handleEditClick(receita)} /><IconButton aria-label="Excluir" icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDeleteClick(receita)} /></HStack></Td></Tr>
                    ))}
                    </Tbody>
                </Table>
                </TableContainer>
            )}

            <FormularioReceita isOpen={isDrawerOpen} onClose={onDrawerClose} receita={selectedReceita} onSave={handleSave} isLoading={saveMutation.isPending} />
            <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose} isCentered>
                <AlertDialogOverlay /><AlertDialogContent><ModalHeader>Confirmar Exclusão</ModalHeader><AlertDialogBody>Tem certeza que deseja excluir a receita "<strong>{itemParaDeletar?.descricao}</strong>"?</AlertDialogBody><AlertDialogFooter><Button ref={cancelRef} onClick={onConfirmClose}>Cancelar</Button><Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </Box>
    )
}


// Componente Principal da Página com Abas
const FinancasPage = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

  const handleSetPeriod = (start: Date, end: Date) => {
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  // --- INÍCIO DA ALTERAÇÃO ---
  // Estilos para as abas
  const tabStyles = {
    fontWeight: 'semibold',
    px: { base: 3, md: 6 },
    py: 3,
    borderRadius: 'md',
    transition: 'all 0.2s ease-in-out',
    _hover: {
      bg: useColorModeValue('teal.50', 'gray.600'),
    },
    _selected: {
      color: 'white',
      bg: 'teal.400',
      boxShadow: 'md',
    },
  };
  // --- FIM DA ALTERAÇÃO ---

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading as="h1" mb={2}>Centro Financeiro</Heading>
      <Text color="gray.500" mb={6}>Analise os dados consolidados do negócio e das suas finanças pessoais.</Text>

      <Box p={4} borderWidth={1} borderRadius="md" my={6} bg={useColorModeValue('gray.50', 'gray.700')}>
        <Heading size="md" mb={4}>Filtrar Período Global</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={4}>
          <Button onClick={() => handleSetPeriod(startOfMonth(today), endOfMonth(today))}>Este Mês</Button>
          <Button onClick={() => handleSetPeriod(subDays(today, 30), today)}>Últimos 30 dias</Button>
        </SimpleGrid>
        <Flex gap={4} align="flex-end" direction={{ base: 'column', md: 'row' }}>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Início</Text><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Fim</Text><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
        </Flex>
      </Box>

      {/* Variante 'unstyled' para remover o estilo padrão e aplicar o nosso */}
      <Tabs variant="unstyled" align="center" >
        <TabList gap={3}>
          {/* Aplicando os estilos customizados em cada Tab */}
          <Tab {...tabStyles}>Dashboard Consolidado</Tab>
          <Tab {...tabStyles}>Receitas Externas</Tab>
        </TabList>

        <TabPanels mt={5}>
          <TabPanel>
            <DashboardFinanceiro filters={{ startDate, endDate }} />
          </TabPanel>
          <TabPanel>
            <TabelaReceitasExternas />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FinancasPage;
