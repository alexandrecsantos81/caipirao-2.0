// src/pages/RelatoriosPage.tsx

import { useState } from 'react';
import {
  Box, Button, Flex, Heading, Input, Stack, Text, Tabs, TabList, TabPanels, Tab, TabPanel, Select,
} from '@chakra-ui/react';
import {
  startOfMonth, endOfMonth, subDays, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format,
} from 'date-fns';
import { useSalesSummary, useProductRanking, useClientRanking, useClientAnalysis, useSellerProductivity } from '@/hooks/useReports';
import { ReportKPIs } from '@/components/ReportKPIs';
import { SalesEvolutionChart } from '@/components/SalesEvolutionChart';
import { ProductRankingTable } from '@/components/ProductRankingTable';
import { ClientRankingTable } from '@/components/ClientRankingTable';
import { ClientAnalysis } from '@/components/ClientAnalysis';
import { SellerProductivityTable } from '@/components/SellerProductivityTable';

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

  const { data: salesSummaryData, isLoading: isLoadingSalesSummary } = useSalesSummary(filters, activeTab === 0);
  const { data: productRankingData, isLoading: isLoadingProductRanking } = useProductRanking(productFilters, activeTab === 1);
  const { data: clientRankingData, isLoading: isLoadingClientRanking } = useClientRanking(filters, activeTab === 2);
  const { data: clientAnalysisData, isLoading: isLoadingClientAnalysis } = useClientAnalysis(activeTab === 3);
  const { data: sellerProductivityData, isLoading: isLoadingSellerProductivity } = useSellerProductivity(filters, activeTab === 4);

  return (
    <Box>
      <Heading as="h1" mb={2}>Relatórios Gerenciais</Heading>
      <Text color="gray.500" mb={6}>Selecione um período para visualizar os relatórios de desempenho do negócio.</Text>

      <Stack spacing={4} p={4} borderWidth={1} borderRadius="md" mb={6} bg="gray.700">
        <Heading size="md">Filtrar por Período</Heading>
        <Flex wrap="wrap" gap={2}>
          <Button onClick={() => handleSetPeriod(startOfMonth(today), endOfMonth(today))}>Este Mês</Button>
          <Button onClick={() => handleSetPeriod(subDays(today, 30), today)}>Últimos 30 dias</Button>
          <Button onClick={() => handleSetPeriod(startOfQuarter(today), endOfQuarter(today))}>Este Trimestre</Button>
          <Button onClick={() => handleSetPeriod(startOfYear(today), endOfYear(today))}>Este Ano</Button>
        </Flex>
        <Flex gap={4} align="center">
          <Box>
            <Text fontSize="sm" mb={1}>Data de Início</Text>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg="gray.800" />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1}>Data de Fim</Text>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg="gray.800" />
          </Box>
          <Button colorScheme="teal" mt={6}>Exportar</Button>
        </Flex>
      </Stack>

      <Tabs isFitted variant="enclosed-colored" onChange={(index) => setActiveTab(index)}>
        <TabList>
          <Tab>Vendas Gerais</Tab>
          <Tab>Ranking de Produtos</Tab>
          <Tab>Ranking de Clientes</Tab>
          <Tab>Análise de Clientes</Tab>
          <Tab>Produtividade</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* AQUI ESTÁ A CORREÇÃO */}
            <ReportKPIs kpis={salesSummaryData?.kpis} isLoading={isLoadingSalesSummary} />
            <SalesEvolutionChart data={salesSummaryData?.evolucaoVendas} isLoading={isLoadingSalesSummary} />
          </TabPanel>
          <TabPanel>
            <Flex justify="flex-end" mb={4}>
              <Flex align="center" gap={2}>
                <Text>Ordenar por:</Text>
                <Select
                  w="200px"
                  value={productOrderBy}
                  onChange={(e) => setProductOrderBy(e.target.value as 'valor' | 'quantidade')}
                >
                  <option value="valor">Maior Valor (R$)</option>
                  <option value="quantidade">Maior Quantidade</option>
                </Select>
              </Flex>
            </Flex>
            <ProductRankingTable data={productRankingData} isLoading={isLoadingProductRanking} />
          </TabPanel>
          <TabPanel>
            <ClientRankingTable data={clientRankingData} isLoading={isLoadingClientRanking} />
          </TabPanel>
          <TabPanel>
            <ClientAnalysis data={clientAnalysisData} isLoading={isLoadingClientAnalysis} />
          </TabPanel>
          <TabPanel>
            <SellerProductivityTable data={sellerProductivityData} isLoading={isLoadingSellerProductivity} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default RelatoriosPage;
