// frontend/src/pages/RelatoriosPage.tsx

import {
  Box, Button, Flex, Heading, Input, Text, Tabs, TabList, TabPanels, Tab, TabPanel, Select,
  SimpleGrid,
  useColorModeValue,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { 
  startOfMonth, endOfMonth, subDays, startOfQuarter, startOfYear, format, endOfQuarter, endOfYear,
} from 'date-fns';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FiDownload } from 'react-icons/fi';

import { 
  getProductRankingPdf,
  getClientRankingPdf,
  getSellerProductivityPdf,
  getStockEntriesPdf,
  IProductRankingFilter,
  IReportDateFilter,
} from '@/services/report.service'; 

import { 
  useSalesSummary, 
  useProductRanking, 
  useClientRanking, 
  useClientAnalysis,
  useSellerProductivity,
  useStockEntriesReport,
} from '@/hooks/useReports';
import { ReportKPIs } from '@/components/ReportKPIs';
import { SalesEvolutionChart } from '@/components/SalesEvolutionChart';
import { ProductRankingTable } from '@/components/ProductRankingTable';
import { ClientRankingTable } from '@/components/ClientRankingTable';
import { ClientAnalysis } from '@/components/ClientAnalysis';
import { SellerProductivityTable } from '@/components/SellerProductivityTable';
import { StockEntriesTable } from '@/components/StockEntriesTable';

const formatDateForAPI = (date: Date): string => format(date, 'yyyy-MM-dd');

const RelatoriosPage = () => {
  const today = new Date();
  const toast = useToast();
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

  // Função genérica para lidar com o resultado da mutation
  const onPdfSuccess = (blob: Blob) => {
    const pdfUrl = URL.createObjectURL(blob);
    window.open(pdfUrl, '_blank');
    toast({ title: 'Relatório Gerado', description: 'O PDF foi aberto em uma nova aba.', status: 'success' });
  };
  const onPdfError = (error: any) => {
    toast({ title: 'Erro ao gerar PDF', description: error.response?.data?.error || 'Não foi possível gerar o relatório.', status: 'error' });
  };

  // Mutations para cada tipo de PDF
  const productPdfMutation = useMutation<Blob, Error, IProductRankingFilter>({ mutationFn: getProductRankingPdf, onSuccess: onPdfSuccess, onError: onPdfError });
  const clientPdfMutation = useMutation<Blob, Error, IReportDateFilter>({ mutationFn: getClientRankingPdf, onSuccess: onPdfSuccess, onError: onPdfError });
  const sellerPdfMutation = useMutation<Blob, Error, IReportDateFilter>({ mutationFn: getSellerProductivityPdf, onSuccess: onPdfSuccess, onError: onPdfError });
  const stockPdfMutation = useMutation<Blob, Error, IReportDateFilter>({ mutationFn: getStockEntriesPdf, onSuccess: onPdfSuccess, onError: onPdfError });

  const handleGeneratePDF = () => {
    toast({ title: 'Gerando relatório...', status: 'info', duration: 1500 });
    switch (activeTab) {
      case 1: // Produtos
        productPdfMutation.mutate(productFilters);
        break;
      case 2: // Clientes
        clientPdfMutation.mutate(filters);
        break;
      case 4: // Produtividade
        sellerPdfMutation.mutate(filters);
        break;
      case 5: // Estoque
        stockPdfMutation.mutate(filters);
        break;
      default:
        toast({ title: 'Aviso', description: 'Este relatório não possui uma exportação para PDF.', status: 'warning' });
    }
  };
  
  const isPdfLoading = productPdfMutation.isPending || clientPdfMutation.isPending || sellerPdfMutation.isPending || stockPdfMutation.isPending;
  const isPdfSupported = [1, 2, 4, 5].includes(activeTab);

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={2} direction={{base: 'column', md: 'row'}} gap={4}>
        <Box>
          <Heading as="h1">Relatórios Gerenciais</Heading>
          <Text color="gray.500">Selecione um período para visualizar os relatórios de desempenho do negócio.</Text>
        </Box>
        <Button 
          leftIcon={<Icon as={FiDownload} />} 
          colorScheme="teal"
          onClick={handleGeneratePDF}
          isLoading={isPdfLoading}
          isDisabled={!isPdfSupported}
          loadingText="Gerando..."
          w={{base: 'full', md: 'auto'}}
        >
          Gerar Relatório
        </Button>
      </Flex>

      <Box p={4} borderWidth={1} borderRadius="md" my={6} bg={useColorModeValue('gray.50', 'gray.700')}>
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
          <TabPanel>
            <Flex justify="flex-end" mb={4}>
              <Flex align="center" gap={2}>
                <Text>Ordenar por:</Text>
                <Select w="200px" value={productOrderBy} onChange={(e) => setProductOrderBy(e.target.value as 'valor' | 'quantidade')}>
                  <option value="valor">Maior Valor (R$)</option>
                  <option value="quantidade">Maior Quantidade</option>
                </Select>
              </Flex>
            </Flex>
            <ProductRankingTable data={productRankingData} isLoading={isLoadingProductRanking} />
          </TabPanel>
          <TabPanel><ClientRankingTable data={clientRankingData} isLoading={isLoadingClientRanking} /></TabPanel>
          <TabPanel><ClientAnalysis data={clientAnalysisData} isLoading={isLoadingClientAnalysis} isError={isErrorClientAnalysis} /></TabPanel>
          <TabPanel><SellerProductivityTable data={sellerProductivityData} isLoading={isLoadingSellerProductivity} isError={isErrorSellerProductivity} /></TabPanel>
          <TabPanel><StockEntriesTable data={stockEntriesData} isLoading={isLoadingStockEntries} isError={isErrorStockEntries} /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default RelatoriosPage;
