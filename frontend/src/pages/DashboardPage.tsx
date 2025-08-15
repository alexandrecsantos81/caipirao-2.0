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
} from '@chakra-ui/react';
import { useDashboardData } from '../hooks/useDashboard';
import { GraficoFluxoCaixa } from '../components/GraficoFluxoCaixa';
import { GraficoRankingProdutos } from '../components/GraficoRankingProdutos';
import { GraficoRankingClientes } from '../components/GraficoRankingClientes';
import { CardContasAPagar } from '../components/CardContasAPagar';

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

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
    fluxoCaixaQuery,
  } = useDashboardData();

  const { data: kpis, isLoading: isLoadingKPIs, isError: isErrorKPIs } = kpisQuery;
  const { data: rankingProdutosData, isLoading: isLoadingRankingProdutos, isError: isErrorRankingProdutos } = rankingProdutosQuery;
  const { data: rankingClientesData, isLoading: isLoadingRankingClientes, isError: isErrorRankingClientes } = rankingClientesQuery;
  const { data: fluxoCaixaData, isLoading: isLoadingFluxoCaixa, isError: isErrorFluxoCaixa } = fluxoCaixaQuery;

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
        {/* Aplicando o efeito de hover nos cards de KPI */}
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}><StatLabel>Receita (Mês)</StatLabel><StatNumber color="green.500">{formatCurrency(kpis?.totalVendasMes)}</StatNumber><StatHelpText>Total de vendas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}><StatLabel>Despesas (Mês)</StatLabel><StatNumber color="red.500">{formatCurrency(kpis?.totalDespesasMes)}</StatNumber><StatHelpText>Total de despesas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}><StatLabel>Saldo (Mês)</StatLabel><StatNumber color={kpis && kpis.saldoMes >= 0 ? 'blue.500' : 'red.500'}>{formatCurrency(kpis?.saldoMes)}</StatNumber><StatHelpText><StatArrow type={kpis && kpis.saldoMes >= 0 ? 'increase' : 'decrease'} />Balanço do mês atual</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}><StatLabel>Contas a Receber</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAReceber)}</StatNumber><StatHelpText>Total de vendas a prazo pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}><StatLabel>Contas a Pagar</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAPagar)}</StatNumber><StatHelpText>Total de despesas pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}><StatLabel>Novos Clientes (Mês)</StatLabel><StatNumber>{kpis?.novosClientesMes ?? 'N/D'}</StatNumber><StatHelpText>Clientes cadastrados no mês atual.</StatHelpText></Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        {/* Aplicando o efeito de hover no card do gráfico de Fluxo de Caixa */}
        <Box borderWidth={1} borderRadius="md" p={4} boxShadow="sm" minH="400px" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}>
          <Heading as="h2" size="md" mb={4}>Fluxo de Caixa (Últimos 30 Dias)</Heading>
          <GraficoFluxoCaixa 
            data={fluxoCaixaData} 
            isLoading={isLoadingFluxoCaixa} 
            isError={isErrorFluxoCaixa} 
          />
        </Box>

        {/* O CardContasAPagar já tem o efeito, então não precisa de mudanças aqui */}
        <CardContasAPagar />
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        {/* Aplicando o efeito de hover nos cards dos gráficos de Ranking */}
        <Box w="full" borderWidth={1} borderRadius="md" p={4} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}>
          <Heading as="h2" size="md" mb={4}>Top 2 Produtos (Mês)</Heading>
          <GraficoRankingProdutos
            data={rankingProdutosData}
            isLoading={isLoadingRankingProdutos}
            isError={isErrorRankingProdutos}
          />
        </Box>
        <Box w="full" borderWidth={1} borderRadius="md" p={4} boxShadow="sm" transition="all 0.2s ease-in-out" _hover={cardHoverEffect}>
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
