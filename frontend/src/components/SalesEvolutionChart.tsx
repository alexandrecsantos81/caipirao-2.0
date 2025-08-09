// src/components/SalesEvolutionChart.tsx

import { Box, Center, Heading, Skeleton, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ISalesEvolution } from '@/services/report.service';

interface SalesEvolutionChartProps {
  data: ISalesEvolution[] | undefined;
  isLoading: boolean;
}

// Função para formatar os valores do eixo Y como moeda
const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Função para formatar a data no eixo X
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Adiciona 1 dia para corrigir o fuso horário que pode causar a data "um dia antes"
    date.setDate(date.getDate() + 1); 
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const SalesEvolutionChart = ({ data, isLoading }: SalesEvolutionChartProps) => {
  return (
    <Box as={Skeleton} isLoaded={!isLoading} p={5} borderWidth={1} borderRadius={8} boxShadow="sm" h="400px">
      <Heading size="md" mb={4}>Evolução das Vendas</Heading>
      {data && data.length > 0 ? (
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
      ) : (
        <Center h="90%">
          <Text color="gray.500">Nenhum dado de venda encontrado para o período selecionado.</Text>
        </Center>
      )}
    </Box>
  );
};
