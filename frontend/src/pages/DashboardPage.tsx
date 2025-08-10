import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Spinner, Text, Center, StatArrow, useBreakpointValue, VStack, HStack
} from '@chakra-ui/react';
import { useDashboardData } from '../hooks/useDashboard';
import { GraficoVendas } from '../components/GraficoVendas';
// CORREÇÃO: Remover 'FaUser' que não está sendo usado e importar o tipo correto.
import { FaCalendarAlt } from 'react-icons/fa';
import { IContasAPagar } from '../services/despesa.service';
// ... (funções formatCurrency e formatDate permanecem as mesmas) ...
const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


const DashboardPage = () => {
  const { kpisQuery, vendasPorDiaQuery, contasAPagarQuery } = useDashboardData();

  const { data: kpis, isLoading: isLoadingKPIs, isError: isErrorKPIs } = kpisQuery;
  const { data: vendasData, isLoading: isLoadingVendas, isError: isErrorVendas } = vendasPorDiaQuery;
  const { data: contasAPagar, isLoading: isLoadingContas, isError: isErrorContas } = contasAPagarQuery;

  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isLoadingKPIs) {
    return <Center p={8} minH="50vh"><Spinner size="xl" /></Center>;
  }

  if (isErrorKPIs) {
    return <Center p={8}><Text color="red.500" fontSize="lg">Erro ao carregar os dados do Dashboard.</Text></Center>;
  }

  const ContasAPagarComponent = () => {
    if (isLoadingContas) return <Center p={4}><Spinner /></Center>;
    if (isErrorContas) return <Center p={4}><Text color="red.500">Erro ao buscar contas a pagar.</Text></Center>;
    if (!contasAPagar || contasAPagar.length === 0) {
      return <Center p={4}><Text>Nenhuma conta a pagar pendente.</Text></Center>;
    }

    if (isMobile) {
      return (
        <VStack spacing={4} align="stretch">
          {contasAPagar.map((conta: IContasAPagar) => (
            <Box key={conta.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
              <HStack justify="space-between">
                <Text fontWeight="bold" noOfLines={1}>{conta.nome_fornecedor}</Text>
                <Text fontWeight="bold" color="red.500">{formatCurrency(conta.valor)}</Text>
              </HStack>
              <HStack mt={2} color="gray.500">
                <FaCalendarAlt />
                <Text fontSize="sm">Venc: {formatDate(conta.data_vencimento)}</Text>
              </HStack>
            </Box>
          ))}
        </VStack>
      );
    }

    return (
      <Box borderWidth={1} borderRadius="md" p={4}>
        {contasAPagar.map((conta: IContasAPagar) => (
          <HStack key={conta.id} justify="space-between" py={2} borderBottomWidth="1px">
            <Text>{conta.nome_fornecedor}</Text>
            <Text>{formatDate(conta.data_vencimento)}</Text>
            <Text color="red.500" fontWeight="bold">{formatCurrency(conta.valor)}</Text>
          </HStack>
        ))}
      </Box>
    );
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading as="h1" size="lg" mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {/* KPIs */}
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Receita (Mês)</StatLabel><StatNumber color="green.500">{formatCurrency(kpis?.totalVendasMes)}</StatNumber><StatHelpText>Total de vendas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Despesas (Mês)</StatLabel><StatNumber color="red.500">{formatCurrency(kpis?.totalDespesasMes)}</StatNumber><StatHelpText>Total de despesas no mês atual.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Saldo (Mês)</StatLabel><StatNumber color={kpis && kpis.saldoMes >= 0 ? 'blue.500' : 'red.500'}>{formatCurrency(kpis?.saldoMes)}</StatNumber><StatHelpText><StatArrow type={kpis && kpis.saldoMes >= 0 ? 'increase' : 'decrease'} />Balanço do mês atual</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Contas a Receber</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAReceber)}</StatNumber><StatHelpText>Total de vendas a prazo pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Contas a Pagar</StatLabel><StatNumber>{formatCurrency(kpis?.totalContasAPagar)}</StatNumber><StatHelpText>Total de despesas pendentes.</StatHelpText></Stat>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm"><StatLabel>Novos Clientes (Mês)</StatLabel><StatNumber>{kpis?.novosClientesMes ?? 'N/D'}</StatNumber><StatHelpText>Clientes cadastrados no mês atual.</StatHelpText></Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
        <Box borderWidth={1} borderRadius="md" p={4} boxShadow="sm">
          <Heading as="h2" size="md" mb={4}>Vendas e Despesas (Últimos 30 dias)</Heading>
          <GraficoVendas data={vendasData} isLoading={isLoadingVendas} isError={isErrorVendas} />
        </Box>
        <Box borderWidth={1} borderRadius="md" p={0} boxShadow="sm" overflow="hidden">
          <Heading as="h2" size="md" p={4} pb={2}>Contas a Pagar Pendentes</Heading>
          <ContasAPagarComponent />
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardPage;
