// frontend/src/components/DashboardFinanceiro.tsx

import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Skeleton,
  useColorModeValue,
  Heading,
  Center,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardConsolidado, IDateFilter } from '../services/financas.service';

interface DashboardFinanceiroProps {
  filters: IDateFilter;
}

const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const DashboardFinanceiro = ({ filters }: DashboardFinanceiroProps) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardConsolidado', filters],
    queryFn: () => getDashboardConsolidado(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  const kpis = data?.kpis;

  return (
    <Box>
      <Heading size="lg" mb={6}>Dashboard Consolidado</Heading>
      
      <Skeleton isLoaded={!isLoading} minH="150px" borderRadius="md">
        {isError ? (
            <Center h="150px" bg="red.50" borderRadius="md">
                <Text color="red.500">Erro ao carregar os indicadores.</Text>
            </Center>
        ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Stat p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder}>
            <StatLabel>Receita Total (Caipirão + Pessoal)</StatLabel>
            <StatNumber color="green.500">{formatCurrency(kpis?.receitaTotalConsolidada)}</StatNumber>
            <StatHelpText>Soma de todas as entradas</StatHelpText>
          </Stat>

          <Stat p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder}>
            <StatLabel>Despesas do Negócio (Caipirão)</StatLabel>
            <StatNumber color="red.500">{formatCurrency(kpis?.despesasCaipirao)}</StatNumber>
            <StatHelpText>Total de saídas operacionais</StatHelpText>
          </Stat>

          <Stat p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder}>
            <StatLabel>Saldo Consolidado</StatLabel>
            <StatNumber color={kpis && kpis.saldoConsolidado >= 0 ? 'blue.500' : 'red.500'}>
                {formatCurrency(kpis?.saldoConsolidado)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type={kpis && kpis.saldoConsolidado >= 0 ? 'increase' : 'decrease'} />
              Balanço do período
            </StatHelpText>
          </Stat>
        </SimpleGrid>
        )}
      </Skeleton>

      {/* Futuramente, aqui entrarão os gráficos consolidados */}
      <Center h="200px" mt={8} borderWidth="2px" borderStyle="dashed" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.800')}>
        <Text color="gray.500">Área reservada para futuros gráficos consolidados.</Text>
      </Center>
    </Box>
  );
};
