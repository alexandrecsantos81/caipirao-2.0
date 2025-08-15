// frontend/src/pages/DashboardPage.tsx

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
  HStack,
} from '@chakra-ui/react';
import { FaCalendarAlt } from 'react-icons/fa';
import { useDashboardData } from '../hooks/useDashboard';
import { GraficoFluxoCaixa } from '../components/GraficoFluxoCaixa';
import { GraficoRankingProdutos } from '../components/GraficoRankingProdutos';
import { GraficoRankingClientes } from '../components/GraficoRankingClientes';
import { IContasAPagar } from '../services/despesa.service';

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const DashboardPage = () => {
  const { 
    kpisQuery, 
    rankingProdutosQuery,
    rankingClientesQuery,
    contasAPagarQuery,
    fluxoCaixaQuery,
  } = useDashboardData();

  const { data: kpis, isLoading: isLoadingKPIs, isError: isErrorKPIs } = kpisQuery;
  const { data: rankingProdutosData, isLoading: isLoadingRankingProdutos, isError: isErrorRankingProdutos } = rankingProdutosQuery;
  const { data: rankingClientesData, isLoading: isLoadingRankingClientes, isError: isErrorRankingClientes } = rankingClientesQuery;
  const { data: contasAPagar, isLoading: isLoadingContas, isError: isErrorContas } = contasAPagarQuery;
  const { data: fluxoCaixaData, isLoading: isLoadingFluxoCaixa, isError: isErrorFluxoCaixa } = fluxoCaixaQuery;

  if (isLoadingKPIs) {
    return <Center p={8} minH="50vh"><Spinner size="xl" /></Center>;
  }

  if (isErrorKPIs) {
    return <Center p={8}><Text color="red.500" fontSize="lg">Erro ao carregar os dados do Dashboard.</Text></Center>;
  }

  const ContasAPagarComponent = () => {
    const renderContent = () => {
      if (isLoadingContas) return <Center h="250px"><Spinner /></Center>;
      if (isErrorContas) return <Center h="250px"><Text color="red.500">Erro ao buscar contas.</Text></Center>;
      if (!contasAPagar || contasAPagar.length === 0) {
        return <Center h="250px"><Text>Nenhuma conta a pagar pendente.</Text></Center>;
      }

      return (
        <VStack spacing={3} align="stretch" mt={4}>
          {contasAPagar.map((conta: IContasAPagar) => (
            <HStack key={conta.id} justify="space-between" py={2} borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}>
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium" noOfLines={1}>{conta.nome_fornecedor || 'Despesa avulsa'}</Text>
                <HStack color="gray.500">
                  <FaCalendarAlt size="12px" />
                  <Text fontSize="sm">Venc: {formatDate(conta.data_vencimento)}</Text>
                </HStack>
              </VStack>
              <Text color="red.500" fontWeight="bold">{formatCurrency(conta.valor)}</Text>
            </HStack>
          ))}
        </VStack>
      );
    };

    return (
      <Box borderWidth={1} borderRadius="md" p={4} boxShadow="sm" h="100%">
        <Heading as="h2" size="md" mb={2}>Contas a Pagar Pendentes</Heading>
        {renderContent()}
      </Box>
    );
  };

  return (
    <Box>
      <Heading as="h1" size="lg" mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Receita (Mês)</StatLabel><StatNumber color="green.500">{formatCurrency(kpis?.totalVendasMes)}</StatNumber><StatHelpText>Total de vendas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Despesas (Mês)</StatLabel><StatNumber color="red.500">{formatCurrency(kpis?.totalDespesasMes)}</StatNumber><StatHelpText>Total de despesas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Saldo (Mês)</StatLabel><StatNumber color={kpis && kpis.saldoMes >= 0 ? 'blue.500' : 'red.500'}>{formatCurrency(kpis?.saldoMes)}</StatNumber><StatHelpText><StatArrow type={kpis && kpis.saldoMes >= 0 ? 'increase' : 'decrease'} />Balanço do mês atual</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Contas a Receber</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAReceber)}</StatNumber><StatHelpText>Total de vendas a prazo pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Contas a Pagar</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAPagar)}</StatNumber><StatHelpText>Total de despesas pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Novos Clientes (Mês)</StatLabel><StatNumber>{kpis?.novosClientesMes ?? 'N/D'}</StatNumber><StatHelpText>Clientes cadastrados no mês atual.</StatHelpText></Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        {/* ✅ CORREÇÃO: Adicionada altura mínima (minH) ao Box do gráfico */}
        <Box borderWidth={1} borderRadius="md" p={4} boxShadow="sm" minH="400px">
          <Heading as="h2" size="md" mb={4}>Fluxo de Caixa (Últimos 30 Dias)</Heading>
          <GraficoFluxoCaixa 
            data={fluxoCaixaData} 
            isLoading={isLoadingFluxoCaixa} 
            isError={isErrorFluxoCaixa} 
          />
        </Box>

        <VStack spacing={6}>
          <Box w="full" borderWidth={1} borderRadius="md" p={4} boxShadow="sm">
            <Heading as="h2" size="md" mb={4}>Top 2 Produtos (Mês)</Heading>
            <GraficoRankingProdutos
              data={rankingProdutosData}
              isLoading={isLoadingRankingProdutos}
              isError={isErrorRankingProdutos}
            />
          </Box>
          <Box w="full" borderWidth={1} borderRadius="md" p={4} boxShadow="sm">
            <Heading as="h2" size="md" mb={4}>Top 5 Clientes (Mês)</Heading>
            <GraficoRankingClientes
              data={rankingClientesData}
              isLoading={isLoadingRankingClientes}
              isError={isErrorRankingClientes}
            />
          </Box>
        </VStack>
      </SimpleGrid>
      
      <Box mt={6}>
        <ContasAPagarComponent />
      </Box>
    </Box>
  );
};

export default DashboardPage;
