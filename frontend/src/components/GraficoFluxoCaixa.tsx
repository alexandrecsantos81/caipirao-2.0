// frontend/src/components/GraficoFluxoCaixa.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { IFluxoCaixaDiario } from '../services/dashboard.service';

interface GraficoFluxoCaixaProps {
  data: IFluxoCaixaDiario[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatCurrencyTooltip = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const GraficoFluxoCaixa = ({ data, isLoading, isError }: GraficoFluxoCaixaProps) => {
  // Cores para as linhas e elementos do gráfico
  const receitaColor = useColorModeValue('green.500', 'green.300');
  const despesaColor = useColorModeValue('red.500', 'red.300');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.300', 'gray.600');

  if (isLoading) {
    return <Center h="350px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="350px"><Text color="red.500">Erro ao carregar dados do gráfico.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return <Center h="350px"><Text color="gray.500">Não há dados de fluxo de caixa para exibir.</Text></Center>;
  }

  return (
    <Box h="350px">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="dia" stroke={textColor} fontSize={12} tick={{ fill: textColor }} />
          <YAxis
            tickFormatter={formatCurrency}
            stroke={textColor}
            fontSize={12}
            width={80}
            tick={{ fill: textColor }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrencyTooltip(value), name]}
            labelStyle={{ color: textColor, fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: 'md',
              boxShadow: 'lg',
            }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          <Line
            type="monotone"
            dataKey="receitas"
            stroke={receitaColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            name="Receitas"
          />
          <Line
            type="monotone"
            dataKey="despesas"
            stroke={despesaColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            name="Despesas"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
