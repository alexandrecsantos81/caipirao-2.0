import {
  Box, Button, Flex, Heading, IconButton, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast, HStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogContent, AlertDialogOverlay,
  Center, AlertDialogHeader // <--- CORREÇÃO APLICADA AQUI
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useState, useRef } from 'react';

import {
  IReceitaExterna, IReceitaExternaForm, getReceitasExternas, createReceitaExterna, updateReceitaExterna, deleteReceitaExterna
} from '../services/receitaExterna.service';
import { FormularioReceita } from './FormularioReceita';

export const TabelaReceitasExternas = () => {
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
          queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
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
          queryClient.invalidateQueries({ queryKey: ['dashboardConsolidado'] });
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
                <Button leftIcon={<FiPlus />} colorScheme="green" onClick={handleAddClick} w={{ base: 'full', md: 'auto' }}>
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

            <FormularioReceita 
                isOpen={isDrawerOpen} 
                onClose={onDrawerClose} 
                receita={selectedReceita} 
                onSave={handleSave} 
                isLoading={saveMutation.isPending} 
            />
            
            <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose} isCentered>
                <AlertDialogOverlay />
                <AlertDialogContent>
                    {/* O erro estava aqui, pois AlertDialogHeader não estava importado */}
                    <AlertDialogHeader>Confirmar Exclusão</AlertDialogHeader>
                    <AlertDialogBody>Tem certeza que deseja excluir a receita "<strong>{itemParaDeletar?.descricao}</strong>"?</AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onConfirmClose}>Cancelar</Button>
                        <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteMutation.isPending}>Sim, Excluir</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
};
