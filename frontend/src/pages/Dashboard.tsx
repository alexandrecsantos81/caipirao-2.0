import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Spinner, Text, Center, StatArrow
} from '@chakra-ui/react';
import { useDashboardData } from '../hooks/useDashboard';
import { CardContasAPagar } from '../components/CardContasAPagar'; // Reutilizaremos o card existente
import { GraficoVendas } from '../components/GraficoVendas'; // Importamos nosso novo gráfico

// Função para formatar valores como moeda brasileira
const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DashboardPage = () => {
  // Usamos nosso hook para buscar os dados
  const { kpisQuery, vendasPorDiaQuery } = useDashboardData();

  // Extraímos os dados, status de loading e erro de cada query
  const { data: kpis, isLoading: isLoadingKPIs, isError: isErrorKPIs } = kpisQuery;
  const { data: vendasData, isLoading: isLoadingVendas, isError: isErrorVendas } = vendasPorDiaQuery;

  // Se os KPIs ainda estiverem carregando, mostramos um spinner central
  if (isLoadingKPIs) {
    return <Center p={8} minH="50vh"><Spinner size="xl" /></Center>;
  }

  // Se houver um erro ao buscar os KPIs, mostramos uma mensagem de erro
  if (isErrorKPIs) {
    return <Center p={8}><Text color="red.500" fontSize="lg">Erro ao carregar os dados do Dashboard.</Text></Center>;
  }

  return (
    <Box p={8}>
      <Heading mb={6}></Heading>
      
      {/* Grade de Cards com os KPIs */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Receita (Mês)</StatLabel>
          <StatNumber color="green.500">{formatCurrency(kpis?.totalVendasMes)}</StatNumber>
          <StatHelpText>Total de vendas no mês atual.</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Despesas (Mês)</StatLabel>
          <StatNumber color="red.500">{formatCurrency(kpis?.totalDespesasMes)}</StatNumber>
          <StatHelpText>Total de despesas no mês atual.</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Saldo (Mês)</StatLabel>
          <StatNumber color={kpis && kpis.saldoMes >= 0 ? 'blue.500' : 'red.500'}>
            {formatCurrency(kpis?.saldoMes)}
          </StatNumber>
          <StatHelpText>
            <StatArrow type={kpis && kpis.saldoMes >= 0 ? 'increase' : 'decrease'} />
            Balanço do mês atual
          </StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Contas a Receber</StatLabel>
          <StatNumber>{formatCurrency(kpis?.totalContasAReceber)}</StatNumber>
          <StatHelpText>Total de vendas a prazo pendentes.</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Contas a Pagar</StatLabel>
          <StatNumber>{formatCurrency(kpis?.totalContasAPagar)}</StatNumber>
          <StatHelpText>Total de despesas pendentes.</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
          <StatLabel>Novos Clientes (Mês)</StatLabel>
          <StatNumber>{kpis?.novosClientesMes ?? 'N/D'}</StatNumber>
          <StatHelpText>Clientes cadastrados no mês atual.</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Grade para os componentes maiores (Gráfico e Contas a Pagar) */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        <GraficoVendas data={vendasData} isLoading={isLoadingVendas} isError={isErrorVendas} />
        <CardContasAPagar />
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
