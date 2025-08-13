import {
  Box, Button, Flex, Heading, Input, Text, Tabs, TabList, TabPanels, Tab, TabPanel, Select,
  SimpleGrid,
  useColorModeValue,
  Center,
} from '@chakra-ui/react';
import { 
  startOfMonth, endOfMonth, subDays, startOfQuarter, startOfYear, endOfYear, format, endOfQuarter,
} from 'date-fns';
import { useState } from 'react';
import { 
  useSalesSummary, 
  useProductRanking, 
  useClientRanking, 
  useClientAnalysis,
  useSellerProductivity,
  useStockEntriesReport, // <-- Importar o último hook
} from '@/hooks/useReports';
import { ReportKPIs } from '@/components/ReportKPIs';
import { SalesEvolutionChart } from '@/components/SalesEvolutionChart';
import { ProductRankingTable } from '@/components/ProductRankingTable';
import { ClientRankingTable } from '@/components/ClientRankingTable';
import { ClientAnalysis } from '@/components/ClientAnalysis';
import { SellerProductivityTable } from '@/components/SellerProductivityTable';
import { StockEntriesTable } from '@/components/StockEntriesTable'; // <-- Importar o último componente

const formatDateForAPI = (date: Date): string => format(date, 'yyyy-MM-dd');

const RelatoriosPage = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(formatDateForAPI(startOfMonth(today)));
  const [endDate, setEndDate] = useState(formatDateForAPI(endOfMonth(today)));
  const [productOrderBy, setProductOrderBy] = useState<'valor' | 'quantidade'>('valor');
  const [activeTab, setActiveTab] = useState(0);

  const handleSetPeriod = (start: Date, end: Date) => {
    setStartDate(formatDateForAPI(start));
    setEndDate(formatDateForAPI(end));
  };

  const filters = { startDate, endDate };
  const productFilters = { ...filters, orderBy: productOrderBy };

  // Hooks para buscar os dados de cada relatório
  const { data: salesSummaryData, isLoading: isLoadingSalesSummary, isError: isErrorSalesSummary } = useSalesSummary(filters, activeTab === 0);
  const { data: productRankingData, isLoading: isLoadingProductRanking } = useProductRanking(productFilters, activeTab === 1);
  const { data: clientRankingData, isLoading: isLoadingClientRanking } = useClientRanking(filters, activeTab === 2);
  const { data: clientAnalysisData, isLoading: isLoadingClientAnalysis, isError: isErrorClientAnalysis } = useClientAnalysis(activeTab === 3);
  const { data: sellerProductivityData, isLoading: isLoadingSellerProductivity, isError: isErrorSellerProductivity } = useSellerProductivity(filters, activeTab === 4);
  const { data: stockEntriesData, isLoading: isLoadingStockEntries, isError: isErrorStockEntries } = useStockEntriesReport(filters, activeTab === 5);

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading as="h1" mb={2}>Relatórios Gerenciais</Heading>
      <Text color="gray.500" mb={6}>Selecione um período para visualizar os relatórios de desempenho do negócio.</Text>

      {/* Seção de Filtros */}
      <Box p={4} borderWidth={1} borderRadius="md" mb={6} bg={useColorModeValue('gray.50', 'gray.700')}>
        <Heading size="md" mb={4}>Filtrar por Período</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={4}>
          <Button onClick={() => handleSetPeriod(startOfMonth(today), endOfMonth(today))}>Este Mês</Button>
          <Button onClick={() => handleSetPeriod(subDays(today, 30), today)}>Últimos 30 dias</Button>
          <Button onClick={() => handleSetPeriod(startOfQuarter(today), endOfQuarter(today))}>Este Trimestre</Button>
          <Button onClick={() => handleSetPeriod(startOfYear(today), endOfYear(today))}>Este Ano</Button>
        </SimpleGrid>
        <Flex gap={4} align="flex-end" direction={{ base: 'column', md: 'row' }}>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Início</Text><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Fim</Text><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
        </Flex>
      </Box>

      {/* Sistema de Abas */}
      <Tabs isFitted variant="enclosed-colored" onChange={(index) => setActiveTab(index)}>
        <TabList overflowX="auto" overflowY="hidden" sx={{ '&::-webkit-scrollbar': { display: 'none' }, 'scrollbarWidth': 'none' }}>
          <Tab>Vendas Gerais</Tab>
          <Tab>Produtos</Tab>
          <Tab>Clientes</Tab>
          <Tab>Análise</Tab>
          <Tab>Produtividade</Tab>
          <Tab>Estoque</Tab>
        </TabList>
        <TabPanels>
          <TabPanel><ReportKPIs kpis={salesSummaryData?.kpis} isLoading={isLoadingSalesSummary} /><SalesEvolutionChart data={salesSummaryData?.evolucaoVendas} isLoading={isLoadingSalesSummary} isError={isErrorSalesSummary} /></TabPanel>
          <TabPanel><Flex justify="flex-end" mb={4}><Flex align="center" gap={2}><Text>Ordenar por:</Text><Select w="200px" value={productOrderBy} onChange={(e) => setProductOrderBy(e.target.value as 'valor' | 'quantidade')}><option value="valor">Maior Valor (R$)</option><option value="quantidade">Maior Quantidade</option></Select></Flex></Flex><ProductRankingTable data={productRankingData} isLoading={isLoadingProductRanking} /></TabPanel>
          <TabPanel><ClientRankingTable data={clientRankingData} isLoading={isLoadingClientRanking} /></TabPanel>
          <TabPanel><ClientAnalysis data={clientAnalysisData} isLoading={isLoadingClientAnalysis} isError={isErrorClientAnalysis} /></TabPanel>
          <TabPanel><SellerProductivityTable data={sellerProductivityData} isLoading={isLoadingSellerProductivity} isError={isErrorSellerProductivity} /></TabPanel>
          <TabPanel>
            <StockEntriesTable data={stockEntriesData} isLoading={isLoadingStockEntries} isError={isErrorStockEntries} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default RelatoriosPage;
