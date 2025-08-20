import {
  Box, Button, Flex, Heading, Input, Tab, TabList, TabPanel,
  TabPanels, Tabs, useDisclosure,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { FiPlus, FiSearch, FiClock } from 'react-icons/fi';

import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { IVenda, deleteVenda, reprogramarVencimentoVenda } from '../services/venda.service';
import { IDespesa, IDespesaForm } from '../services/despesa.service';
import { gerarComprovanteVendaPDF } from '../services/report.service';

// 1. Importar os novos hooks de despesa
import { useSaveDespesa, useDeleteDespesa } from '../hooks/useDespesas';

import { FormularioNovaVenda } from '../components/FormularioNovaVenda';
import { FormularioNovaDespesa } from '../components/FormularioNovaDespesa';
import { TabelaVendas } from '../components/TabelaVendas';
import { TabelaDespesas } from '../components/TabelaDespesas';

import { useDashboardData } from '../hooks/useDashboard';

const formatCurrency = (value: number | undefined | null): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StatCard = ({ title, value, helpText, colorScheme }: { title: string; value: string; helpText: string; colorScheme?: string }) => (
  <Stat as={Skeleton} isLoaded={!!value} p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
    <StatLabel>{title}</StatLabel>
    <StatNumber color={colorScheme ? `${colorScheme}.500` : 'inherit'}>{value}</StatNumber>
    <StatHelpText>{helpText}</StatHelpText>
  </Stat>
);


const MovimentacoesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const { isOpen: isVendaDrawerOpen, onOpen: onVendaDrawerOpen, onClose: onVendaDrawerClose } = useDisclosure();
  const { isOpen: isDespesaDrawerOpen, onOpen: onDespesaDrawerOpen, onClose: onDespesaDrawerClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isReprogramarOpen, onOpen: onReprogramarOpen, onClose: onReprogramarClose } = useDisclosure();
  
  const [vendaParaEditar, setVendaParaEditar] = useState<IVenda | null>(null);
  const [despesaParaEditar, setDespesaParaEditar] = useState<IDespesa | null>(null);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: number; tipo: 'venda' | 'despesa' } | null>(null);
  const [itemParaReprogramar, setItemParaReprogramar] = useState<IVenda | null>(null);
  const [novaData, setNovaData] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [termoBuscaVendas, setTermoBuscaVendas] = useState('');
  const buscaVendasDebounced = useDebounce(termoBuscaVendas, 500);
  const [termoBuscaDespesas, setTermoBuscaDespesas] = useState('');
  const buscaDespesasDebounced = useDebounce(termoBuscaDespesas, 500);

  const [tabIndex, setTabIndex] = useState(0);

  const { kpisQuery } = useDashboardData();
  const { data: kpis } = kpisQuery;

  // 2. Instanciar os hooks de despesa
  const saveDespesaMutation = useSaveDespesa();
  const deleteDespesaMutation = useDeleteDespesa();

  const pdfMutation = useMutation({
    mutationFn: gerarComprovanteVendaPDF,
    onSuccess: (blob, vendaId) => {
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
      toast({ title: 'PDF Gerado', description: `O comprovante da venda #${vendaId} foi aberto.`, status: 'success' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar PDF', description: error.response?.data?.error, status: 'error' });
    },
  });

  const deleteVendaMutation = useMutation({ 
    mutationFn: deleteVenda, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['vendas'] }); 
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
      toast({ title: 'Venda excluída!', status: 'success' }); 
      onConfirmClose(); 
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir venda", description: error.response?.data?.error, status: "error" });
      onConfirmClose();
    }
  });

  const reprogramarMutation = useMutation({
    mutationFn: reprogramarVencimentoVenda,
    onSuccess: () => {
      toast({ title: 'Vencimento reprogramado!', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      onReprogramarClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao reprogramar', description: error.response?.data?.error, status: 'error' });
    }
  });
  
  const handleEditVenda = (venda: IVenda) => { setVendaParaEditar(venda); onVendaDrawerOpen(); };
  const handleEditDespesa = (despesa: IDespesa) => { setDespesaParaEditar(despesa); onDespesaDrawerOpen(); };
  const handleAddNewVenda = () => { setVendaParaEditar(null); onVendaDrawerOpen(); };
  const handleAddNewDespesa = () => { setDespesaParaEditar(null); onDespesaDrawerOpen(); };
  const handleDeleteClick = (id: number, tipo: 'venda' | 'despesa') => { setItemParaDeletar({ id, tipo }); onConfirmOpen(); };
  
  const handleGeneratePdf = (vendaId: number) => {
    toast({ title: 'Gerando PDF...', status: 'info', duration: 1500 });
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

  const handleOpenReprogramar = (venda: IVenda) => {
    setItemParaReprogramar(venda);
    setNovaData(venda.data_vencimento.split('T')[0]);
    onReprogramarOpen();
  };

  const handleConfirmReprogramar = () => {
    if (itemParaReprogramar && novaData) {
      reprogramarMutation.mutate({ id: itemParaReprogramar.id, novaDataVencimento: novaData });
    }
  };

  // 3. Criar a função de callback para salvar despesa
  const handleSaveDespesa = (despesaData: IDespesaForm, id?: number) => {
    saveDespesaMutation.mutate({ despesaData, id });
    if (!id) { // Se for criação, fecha o drawer
        onDespesaDrawerClose();
    }
  };

  return (
    <Box>
      <Box mb={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {tabIndex === 0 && (
            <>
              <StatCard 
                title="Receitas Pagas (Mês)" 
                value={formatCurrency(kpis?.totalVendasMes)} 
                helpText="Valores recebidos no mês atual."
                colorScheme="green"
              />
              <StatCard 
                title="Receita a Receber" 
                value={formatCurrency(kpis?.totalContasAReceber)} 
                helpText="Total de vendas a prazo pendentes."
              />
            </>
          )}
          {tabIndex === 1 && isAdmin && (
            <>
              <StatCard 
                title="Despesas Pagas (Mês)" 
                value={formatCurrency(kpis?.totalDespesasMes)} 
                helpText="Valores pagos no mês atual."
                colorScheme="red"
              />
              <StatCard 
                title="Contas a Pagar" 
                value={formatCurrency(kpis?.totalContasAPagar)} 
                helpText="Total de despesas pendentes."
              />
            </>
          )}
        </SimpleGrid>
      </Box>

      <Tabs isFitted variant="enclosed-colored" onChange={(index) => setTabIndex(index)}>
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
              onReprogramar={handleOpenReprogramar}
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
      
      {/* 4. Passar as props corretas para o formulário */}
      {isAdmin && 
        <FormularioNovaDespesa 
          isOpen={isDespesaDrawerOpen} 
          onClose={onDespesaDrawerClose} 
          despesaParaEditar={despesaParaEditar}
          onSave={handleSaveDespesa}
          isLoading={saveDespesaMutation.isPending}
        />
      }
      
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

      <Modal isOpen={isReprogramarOpen} onClose={onReprogramarClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reprogramar Vencimento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                A venda para o cliente <strong>{itemParaReprogramar?.cliente_nome}</strong> está vencida.
              </Text>
              <FormControl isRequired>
                <FormLabel>Selecione a nova data de vencimento:</FormLabel>
                <Input 
                  type="date" 
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReprogramarClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="orange" 
              leftIcon={<FiClock />}
              onClick={handleConfirmReprogramar}
              isLoading={reprogramarMutation.isPending}
            >
              Reprogramar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MovimentacoesPage;
