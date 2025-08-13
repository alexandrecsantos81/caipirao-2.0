// frontend/src/components/GraficoVendas.tsx

import { Box, Heading, Center, Spinner, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IVendasPorDia } from '../services/dashboard.service';

// Definindo a interface de props para o componente
interface GraficoVendasProps {
  data: IVendasPorDia[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Função para formatar os valores do eixo Y como moeda
const formatarMoeda = (valor: number) => {
  if (typeof valor !== 'number') return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
};

// O componente agora usa a interface de props definida acima
export const GraficoVendas = ({ data, isLoading, isError }: GraficoVendasProps) => {
  if (isLoading) {
    return (
      <Center h="350px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="350px">
        <Text color="red.500">Erro ao carregar dados do gráfico.</Text>
      </Center>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Center h="350px">
        <Text color="gray.500">Nenhum dado de venda nos últimos 30 dias.</Text>
      </Center>
    );
  }

  return (
    <Box p={5} borderWidth={1} borderRadius={8} boxShadow="sm" h="100%">
      <Heading size="md" mb={4}>Vendas nos Últimos 30 Dias</Heading>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dia" />
          <YAxis tickFormatter={formatarMoeda} width={90} />
          <Tooltip formatter={(value: number) => formatarMoeda(value)} />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Bar dataKey="total" fill="#38B2AC" name="Total de Vendas" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
