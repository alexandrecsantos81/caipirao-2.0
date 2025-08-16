import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Text,
  Center,
  StatArrow,
  VStack,
  useColorModeValue,
  Input,
  HStack,
  Button,
  Flex,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

import { useDashboardData } from '../hooks/useDashboard';
import { getFluxoCaixaDiario, IFluxoCaixaDiario } from '../services/dashboard.service';
import { GraficoFluxoCaixa } from '../components/GraficoFluxoCaixa';
import { GraficoRankingProdutos } from '../components/GraficoRankingProdutos';
import { GraficoRankingClientes } from '../components/GraficoRankingClientes';
import { CardContasAPagar } from '../components/CardContasAPagar';

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para formatar a data para a API (yyyy-MM-dd)
const formatDateForAPI = (date: Date): string => format(date, 'yyyy-MM-dd');

// Estilo de hover reutilizável para os cards
const cardHoverEffect = {
  transform: 'translateY(-4px)',
  boxShadow: 'xl',
};

const DashboardPage = () => {
  const { 
    kpisQuery, 
    rankingProdutosQuery,
    rankingClientesQuery,
  } = useDashboardData();

  // Estado para os filtros de data do gráfico de fluxo de caixa
  const [dateFilters, setDateFilters] = useState({
    startDate: formatDateForAPI(subDays(new Date(), 29)),
    endDate: formatDateForAPI(new Date()),
  });
  const [activeFilter, setActiveFilter] = useState<'30d' | 'week' | '15d' | 'month' | 'custom'>('30d');

  const { data: kpis, isLoading: isLoadingKPIs, isError: isErrorKPIs } = kpisQuery;
  const { data: rankingProdutosData, isLoading: isLoadingRankingProdutos, isError: isErrorRankingProdutos } = rankingProdutosQuery;
  const { data: rankingClientesData, isLoading: isLoadingRankingClientes, isError: isErrorRankingClientes } = rankingClientesQuery;

  // Hook useQuery para o fluxo de caixa, que agora reage às mudanças de data
  const { data: fluxoCaixaData, isLoading: isLoadingFluxoCaixa, isError: isErrorFluxoCaixa } = useQuery<IFluxoCaixaDiario[], Error>({
    queryKey: ['dashboardFluxoCaixa', dateFilters], // A chave da query agora depende das datas
    queryFn: () => getFluxoCaixaDiario(dateFilters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Funções para manipular os filtros de data
  const handleSetPeriod = (start: Date, end: Date, filterName: typeof activeFilter) => {
    setDateFilters({
      startDate: formatDateForAPI(start),
      endDate: formatDateForAPI(end),
    });
    setActiveFilter(filterName);
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
    setDateFilters(prev => ({ ...prev, [field]: e.target.value }));
    setActiveFilter('custom');
  };

  if (isLoadingKPIs) {
    return <Center p={8} minH="50vh"><Spinner size="xl" /></Center>;
  }

  if (isErrorKPIs) {
    return <Center p={8}><Text color="red.500" fontSize="lg">Erro ao carregar os dados do Dashboard.</Text></Center>;
  }

  return (
    <Box>
      <Heading as="h1" size="lg" mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}><StatLabel>Receita (Mês)</StatLabel><StatNumber color="green.500">{formatCurrency(kpis?.totalVendasMes)}</StatNumber><StatHelpText>Total de vendas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}><StatLabel>Despesas (Mês)</StatLabel><StatNumber color="red.500">{formatCurrency(kpis?.totalDespesasMes)}</StatNumber><StatHelpText>Total de despesas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}><StatLabel>Saldo (Mês)</StatLabel><StatNumber color={kpis && kpis.saldoMes >= 0 ? 'blue.500' : 'red.500'}>{formatCurrency(kpis?.saldoMes)}</StatNumber><StatHelpText><StatArrow type={kpis && kpis.saldoMes >= 0 ? 'increase' : 'decrease'} />Balanço do mês atual</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}><StatLabel>Contas a Receber</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAReceber)}</StatNumber><StatHelpText>Total de vendas a prazo pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}><StatLabel>Contas a Pagar</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAPagar)}</StatNumber><StatHelpText>Total de despesas pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}><StatLabel>Novos Clientes (Mês)</StatLabel><StatNumber>{kpis?.novosClientesMes ?? 'N/D'}</StatNumber><StatHelpText>Clientes cadastrados no mês atual.</StatHelpText></Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        <Box borderWidth={1} borderRadius="md" p={4} boxShadow="sm" minH="400px" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}>
          <Flex justify="space-between" align="center" mb={4} direction={{ base: 'column', md: 'row' }} gap={2}>
            <Heading as="h2" size="md">
              Fluxo de Caixa
            </Heading>
            <HStack>
              <Button size="xs" colorScheme={activeFilter === 'week' ? 'teal' : 'gray'} onClick={() => handleSetPeriod(startOfWeek(new Date()), endOfWeek(new Date()), 'week')}>7 dias</Button>
              <Button size="xs" colorScheme={activeFilter === '15d' ? 'teal' : 'gray'} onClick={() => handleSetPeriod(subDays(new Date(), 14), new Date(), '15d')}>15 dias</Button>
              <Button size="xs" colorScheme={activeFilter === 'month' ? 'teal' : 'gray'} onClick={() => handleSetPeriod(startOfMonth(new Date()), endOfMonth(new Date()), 'month')}>Mês</Button>
            </HStack>
          </Flex>
          
          <HStack mb={4} spacing={2}>
            <Input type="date" size="sm" value={dateFilters.startDate} onChange={(e) => handleCustomDateChange(e, 'startDate')} />
            <Text>até</Text>
            <Input type="date" size="sm" value={dateFilters.endDate} onChange={(e) => handleCustomDateChange(e, 'endDate')} />
          </HStack>

          <GraficoFluxoCaixa 
            data={fluxoCaixaData} 
            isLoading={isLoadingFluxoCaixa} 
            isError={isErrorFluxoCaixa} 
          />
        </Box>
        <CardContasAPagar />
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        <Box w="full" borderWidth={1} borderRadius="md" p={4} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}>
          <Heading as="h2" size="md" mb={4}>Top 2 Produtos (Mês)</Heading>
          <GraficoRankingProdutos
            data={rankingProdutosData}
            isLoading={isLoadingRankingProdutos}
            isError={isErrorRankingProdutos}
          />
        </Box>
        <Box w="full" borderWidth={1} borderRadius="md" p={4} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect} borderColor={useColorModeValue('blue.200', 'blue.600')}>
          <Heading as="h2" size="md" mb={4}>Top 5 Clientes (Mês)</Heading>
          <GraficoRankingClientes
            data={rankingClientesData}
            isLoading={isLoadingRankingClientes}
            isError={isErrorRankingClientes}
          />
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
