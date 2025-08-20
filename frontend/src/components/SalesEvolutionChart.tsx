// frontend/src/components/SalesEvolutionChart.tsx

import { Box, Center, Heading, Skeleton, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// CORREÇÃO: A interface importada deve ser ISalesEvolution
import { ISalesEvolution } from '@/services/report.service';

// CORREÇÃO: A interface de props deve usar ISalesEvolution
interface SalesEvolutionChartProps {
  data: ISalesEvolution[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Ajuste para garantir que a data seja exibida corretamente, independentemente do fuso horário
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// CORREÇÃO: O nome do componente e suas props estão corretos agora
export const SalesEvolutionChart = ({ data, isLoading, isError }: SalesEvolutionChartProps) => {
  return (
    <Box as={Skeleton} isLoaded={!isLoading} p={5} borderWidth={1} borderRadius={8} boxShadow="sm" h="400px">
      <Heading size="md" mb={4}>Evolução das Vendas</Heading>
      
      {isError ? (
        <Center h="90%">
          <Text color="red.500">Erro ao carregar dados do gráfico.</Text>
        </Center>
      ) : !data || data.length === 0 ? (
        <Center h="90%">
          <Text color="gray.500">Nenhum dado de venda encontrado para o período selecionado.</Text>
        </Center>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" tickFormatter={formatDate} />
            <YAxis tickFormatter={formatCurrency} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="faturamento" fill="#38B2AC" name="Faturamento" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default SalesEvolutionChart;
