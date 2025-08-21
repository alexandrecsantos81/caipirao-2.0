// frontend/src/pages/FinancasPage.tsx

import {
  Box, Button, Flex, Heading, Input, Text,
  Tabs, TabList, TabPanels, Tab, SimpleGrid, useColorModeValue,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Icon,
  useToast
} from '@chakra-ui/react';
import { useState } from 'react';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { FiDownload, FiSearch } from 'react-icons/fi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getDespesasPessoaisPdf, getReceitasPessoaisPdf, getAnaliseFinanceira } from '../services/financas.service';
import { DashboardFinanceiro } from '../components/DashboardFinanceiro';
import { TabelaReceitasExternas } from '../components/TabelaReceitasExternas';
import { TabelaDespesasPessoais } from '../components/TabelaDespesasPessoais';
import { useDebounce } from '../hooks/useDebounce';
import { GraficoDespesasCategoria } from '../components/GraficoDespesasCategoria';
import { GraficoBalancoMensal } from '../components/GraficoBalancoMensal';
import { GraficoTopDespesas } from '../components/GraficoTopDespesas';
import { CardDespesasPessoaisPendentes } from '../components/CardDespesasPessoaisPendentes';

const FinancasPage = () => {
  const today = new Date();
  const toast = useToast();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState(0);
  const [termoBusca, setTermoBusca] = useState('');
  const buscaDebounced = useDebounce(termoBusca, 500);

  // ==================================================================
  // Paleta de cores em HEX (compatível com Recharts)
  // ==================================================================
  const receitaColor = useColorModeValue('#48BB78', '#68D391'); // green
  const despesaColor = useColorModeValue('#F56565', '#FC8181'); // red
  const topDespesaColor = useColorModeValue('#ED8936', '#F6AD55'); // orange
  const categoriaColors = [
    '#3182CE', '#DD6B20', '#38A169', '#D53F8C', '#805AD5',
    '#E53E3E', '#D69E2E', '#319795', '#5A67D8', '#B7791F'
  ];
  // ==================================================================

  const handleSetPeriod = (start: Date, end: Date) => {
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const { data: analiseData, isLoading: isAnaliseLoading, isError: isAnaliseError } = useQuery({
    queryKey: ['analiseFinanceira', { startDate, endDate }],
    queryFn: () => getAnaliseFinanceira({ startDate, endDate }),
    enabled: !!startDate && !!endDate,
  });

  const onPdfSuccess = (blob: Blob) => {
    const pdfUrl = URL.createObjectURL(blob);
    window.open(pdfUrl, '_blank');
    toast({ title: 'Relatório Gerado', description: 'O PDF foi aberto em uma nova aba.', status: 'success' });
  };
  const onPdfError = (error: any) => {
    toast({ title: 'Erro ao gerar PDF', description: error.response?.data?.error || 'Não foi possível gerar o relatório.', status: 'error' });
  };

  const despesasPdfMutation = useMutation({ mutationFn: getDespesasPessoaisPdf, onSuccess: onPdfSuccess, onError: onPdfError });
  const receitasPdfMutation = useMutation({ mutationFn: getReceitasPessoaisPdf, onSuccess: onPdfSuccess, onError: onPdfError });
  
  const handleGeneratePDF = () => {
    toast({ title: 'Gerando relatório...', status: 'info', duration: 1500 });
    const filters = { startDate, endDate };
    if (activeTab === 1) {
      receitasPdfMutation.mutate(filters);
    } else if (activeTab === 2) {
      despesasPdfMutation.mutate(filters);
    }
  };

  const isPdfLoading = despesasPdfMutation.isPending || receitasPdfMutation.isPending;
  const isPdfSupported = activeTab === 1 || activeTab === 2;

  const baseTabStyles = {
    fontWeight: 'semibold',
    px: { base: 3, md: 6 },
    py: 3,
    borderRadius: 'md',
    transition: 'all 0.2s ease-in-out',
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading as="h1" mb={2}>Centro Financeiro</Heading>
      <Text color="gray.500" mb={6}>Analise os dados consolidados do negócio e das suas finanças pessoais.</Text>

      {/* ========================== FILTRO GLOBAL ========================== */}
      <Box p={4} borderWidth={1} borderRadius="md" my={6} bg={useColorModeValue('gray.50', 'gray.700')}>
        <Heading size="md" mb={4}>Filtrar Período Global</Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={2} mb={4}>
          <Button onClick={() => handleSetPeriod(startOfMonth(today), endOfMonth(today))}>Este Mês</Button>
          <Button onClick={() => handleSetPeriod(subDays(today, 30), today)}>Últimos 30 dias</Button>
          <Button 
            leftIcon={<Icon as={FiDownload} />} 
            colorScheme="teal"
            onClick={handleGeneratePDF}
            isLoading={isPdfLoading}
            isDisabled={!isPdfSupported}
            loadingText="Gerando..."
          >
            Exportar PDF
          </Button>
        </SimpleGrid>
        <Flex gap={4} align="flex-end" direction={{ base: 'column', md: 'row' }}>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Início</Text><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Fim</Text><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
        </Flex>
      </Box>

      {/* ========================== TABS ========================== */}
      <Tabs variant="unstyled" align="center" onChange={(index) => setActiveTab(index)}>
        <TabList gap={3}>
          <Tab 
            {...baseTabStyles} 
            _selected={{ color: 'white', bg: 'teal.400', boxShadow: 'md' }} 
            _hover={{ bg: useColorModeValue('teal.50', 'gray.600'), color: useColorModeValue('gray.800', 'white') }}
          >
            Dashboard
          </Tab>
          <Tab 
            {...baseTabStyles} 
            _selected={{ color: 'white', bg: 'green.400', boxShadow: 'md' }} 
            _hover={{ bg: useColorModeValue('green.50', 'green.800'), color: useColorModeValue('gray.800', 'white') }}
          >
            Receitas Pessoais
          </Tab>
          <Tab 
            {...baseTabStyles} 
            _selected={{ color: 'white', bg: 'red.400', boxShadow: 'md' }} 
            _hover={{ bg: useColorModeValue('red.50', 'red.800'), color: useColorModeValue('gray.800', 'white') }}
          >
            Despesas Pessoais
          </Tab>
        </TabList>

        <TabPanels mt={5}>
          {/* ========================== DASHBOARD ========================== */}
          <TabPanel>
            <DashboardFinanceiro filters={{ startDate, endDate }} />
            
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
              <CardDespesasPessoaisPendentes />
              <GraficoDespesasCategoria 
                data={analiseData?.despesasPorCategoria}
                isLoading={isAnaliseLoading}
                isError={isAnaliseError}
                colors={categoriaColors} // <<< cores dinâmicas
              />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
              <GraficoTopDespesas
                data={analiseData?.top5Despesas}
                isLoading={isAnaliseLoading}
                isError={isAnaliseError}
                barColor={topDespesaColor}
              />
              <GraficoBalancoMensal 
                data={analiseData?.balancoMensal}
                isLoading={isAnaliseLoading}
                isError={isAnaliseError}
                receitaColor={receitaColor}
                despesaColor={despesaColor}
              />
            </SimpleGrid>
          </TabPanel>

          {/* ========================== RECEITAS ========================== */}
          <TabPanel>
            <Box mb={6}>
              <InputGroup>
                <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
                <Input placeholder="Buscar por descrição ou categoria..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
              </InputGroup>
            </Box>
            <TabelaReceitasExternas />
          </TabPanel>

          {/* ========================== DESPESAS ========================== */}
          <TabPanel>
            <Box mb={6}>
              <InputGroup>
                <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
                <Input placeholder="Buscar por descrição ou categoria..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
              </InputGroup>
            </Box>
            <TabelaDespesasPessoais filters={{ startDate, endDate }} termoBusca={buscaDebounced} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FinancasPage;
