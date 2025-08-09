// src/components/ReportKPIs.tsx

import { SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Skeleton } from '@chakra-ui/react';
import { ISalesSummaryKPIs } from '@/services/report.service';

interface ReportKPIsProps {
  kpis: ISalesSummaryKPIs | undefined;
  isLoading: boolean;
}

// Função para formatar valores como moeda
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const ReportKPIs = ({ kpis, isLoading }: ReportKPIsProps) => {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
      <Stat as={Skeleton} isLoaded={!isLoading} p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
        <StatLabel>Faturamento Total</StatLabel>
        <StatNumber color="green.500">{formatCurrency(kpis?.faturamentoTotal ?? 0)}</StatNumber>
        <StatHelpText>Receita no período</StatHelpText>
      </Stat>

      <Stat as={Skeleton} isLoaded={!isLoading} p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
        <StatLabel>Peso Total Vendido</StatLabel>
        <StatNumber>{(kpis?.pesoTotalVendido ?? 0).toFixed(2)} kg/un</StatNumber>
        <StatHelpText>Soma das quantidades</StatHelpText>
      </Stat>

      <Stat as={Skeleton} isLoaded={!isLoading} p={5} borderWidth={1} borderRadius={8} boxShadow="sm">
        <StatLabel>Total de Transações</StatLabel>
        <StatNumber>{kpis?.totalTransacoes ?? 0}</StatNumber>
        <StatHelpText>Vendas realizadas</StatHelpText>
      </Stat>
    </SimpleGrid>
  );
};
