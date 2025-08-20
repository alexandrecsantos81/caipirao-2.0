// frontend/src/pages/MovimentacoesPage.tsx

import {
  Box, Button, Flex, Heading, Input, Tab, TabList, TabPanel,
  TabPanels, Tabs, useDisclosure, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';

import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { IDespesa, deleteDespesa } from '../services/despesa.service';
import { IVenda, deleteVenda } from '../services/venda.service';
import { gerarComprovanteVendaPDF } from '../services/report.service';

import { FormularioNovaVenda } from '../components/FormularioNovaVenda';
import { FormularioNovaDespesa } from '../components/FormularioNovaDespesa';
import { TabelaVendas } from '../components/TabelaVendas';
import { TabelaDespesas } from '../components/TabelaDespesas';

const MovimentacoesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const { isOpen: isVendaDrawerOpen, onOpen: onVendaDrawerOpen, onClose: onVendaDrawerClose } = useDisclosure();
  const { isOpen: isDespesaDrawerOpen, onOpen: onDespesaDrawerOpen, onClose: onDespesaDrawerClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  
  const [vendaParaEditar, setVendaParaEditar] = useState<IVenda | null>(null);
  const [despesaParaEditar, setDespesaParaEditar] = useState<IDespesa | null>(null);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: number; tipo: 'venda' | 'despesa' } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [termoBuscaVendas, setTermoBuscaVendas] = useState('');
  const buscaVendasDebounced = useDebounce(termoBuscaVendas, 500);
  const [termoBuscaDespesas, setTermoBuscaDespesas] = useState('');
  const buscaDespesasDebounced = useDebounce(termoBuscaDespesas, 500);

  const pdfMutation = useMutation({
    mutationFn: gerarComprovanteVendaPDF,
    onSuccess: (blob, vendaId) => {
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
      toast({
        title: 'PDF Gerado',
        description: `O comprovante da venda #${vendaId} foi aberto em uma nova aba.`,
        status: 'success',
      });
    },
    onError: (error: any, vendaId) => {
      toast({
        title: 'Erro ao gerar PDF',
        description: error.response?.data?.error || `Não foi possível gerar o comprovante para a venda #${vendaId}.`,
        status: 'error',
      });
    },
  });

  const deleteVendaMutation = useMutation({ 
    mutationFn: deleteVenda, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['vendas'] }); 
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Venda excluída!', status: 'success' }); 
      onConfirmClose(); 
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir venda", description: error.response?.data?.error || error.message, status: "error" });
      onConfirmClose();
    }
  });

  const deleteDespesaMutation = useMutation({ 
    mutationFn: deleteDespesa, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['contasAPagar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: 'Despesa excluída!', status: 'success' }); 
      onConfirmClose(); 
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir despesa", description: error.response?.data?.error || error.message, status: "error" });
      onConfirmClose();
    }
  });
  
  const handleEditVenda = (venda: IVenda) => { setVendaParaEditar(venda); onVendaDrawerOpen(); };
  const handleEditDespesa = (despesa: IDespesa) => { setDespesaParaEditar(despesa); onDespesaDrawerOpen(); };
  const handleAddNewVenda = () => { setVendaParaEditar(null); onVendaDrawerOpen(); };
  const handleAddNewDespesa = () => { setDespesaParaEditar(null); onDespesaDrawerOpen(); };
  const handleDeleteClick = (id: number, tipo: 'venda' | 'despesa') => { setItemParaDeletar({ id, tipo }); onConfirmOpen(); };
  
  const handleGeneratePdf = (vendaId: number) => {
    toast({
      title: 'Gerando PDF...',
      description: 'Por favor, aguarde um momento.',
      status: 'info',
      duration: 1500,
    });
    pdfMutation.mutate(vendaId);
  };

  const handleConfirmDelete = () => {
    if (!itemParaDeletar) return;
    if (itemParaDeletar.tipo === 'venda') {
      deleteVendaMutation.mutate(itemParaDeletar.id);
    } else {
      deleteDespesaMutation.mutate(itemParaDeletar.id);
    }
  };

  return (
    <Box>
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="1em">
          <Tab>Vendas (Entradas)</Tab>
          {isAdmin && <Tab>Despesas (Saídas)</Tab>}
        </TabList>
        <TabPanels>
          <TabPanel>
            <Flex justify="space-between" mb={4} direction={{ base: 'column', md: 'row' }} gap={4}>
               <Heading size="md">Histórico de Vendas</Heading>
              <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewVenda}>Registrar Venda</Button>
            </Flex>
            <Box mb={6}>
              <InputGroup>
                <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
                <Input placeholder="Buscar por cliente ou vendedor..." value={termoBuscaVendas} onChange={(e) => setTermoBuscaVendas(e.target.value)} />
              </InputGroup>
            </Box>
            <TabelaVendas 
              buscaDebounced={buscaVendasDebounced}
              onEdit={handleEditVenda} 
              onDelete={(id) => handleDeleteClick(id, 'venda')} 
              onGeneratePdf={handleGeneratePdf}
            />
          </TabPanel>
          
          {isAdmin && (
           <TabPanel>
              <Flex justify="space-between" mb={4} direction={{ base: 'column', md: 'row' }} gap={4}>
                <Heading size="md">Histórico de Despesas</Heading>
                <Button leftIcon={<FiPlus />} colorScheme="red" onClick={handleAddNewDespesa}>Registrar Despesa</Button>
              </Flex>
              <Box mb={6}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
                  <Input placeholder="Buscar por discriminação ou fornecedor..." value={termoBuscaDespesas} onChange={(e) => setTermoBuscaDespesas(e.target.value)} />
                </InputGroup>
              </Box>
              <TabelaDespesas 
                buscaDebounced={buscaDespesasDebounced}
                onEdit={handleEditDespesa} 
                onDelete={(id) => handleDeleteClick(id, 'despesa')} 
              />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
      
      <FormularioNovaVenda isOpen={isVendaDrawerOpen} onClose={onVendaDrawerClose} vendaParaEditar={vendaParaEditar} />
      {isAdmin && <FormularioNovaDespesa isOpen={isDespesaDrawerOpen} onClose={onDespesaDrawerClose} despesaParaEditar={despesaParaEditar} />}
      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose}>
         <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Confirmar Exclusão</AlertDialogHeader>
          <AlertDialogBody>Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onConfirmClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={deleteVendaMutation.isPending || deleteDespesaMutation.isPending}>
              Sim, Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default MovimentacoesPage;
