// frontend/src/components/SellerProductivityChart.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
  Heading,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { ISellerProductivityItem } from '@/services/report.service';

interface SellerProductivityChartProps {
  data: ISellerProductivityItem[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const formatCurrencyTooltip = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const SellerProductivityChart = ({ data, isLoading }: SellerProductivityChartProps) => {
  const barColor = useColorModeValue('teal.500', 'teal.300');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.300', 'gray.600');

  if (isLoading) {
    return <Center h="350px"><Spinner size="xl" /></Center>;
  }

  // Filtra os vendedores que não tiveram vendas para não poluir o gráfico
  const chartData = data?.filter(item => item.valorTotalVendido > 0).sort((a, b) => a.valorTotalVendido - b.valorTotalVendido) || [];

  if (chartData.length === 0) {
    return (
      <Center h="350px" mt={8}>
        <Text color="gray.500">Nenhum dado de produtividade para exibir no gráfico.</Text>
      </Center>
    );
  }

  return (
    <Box h="350px" mt={8}>
      <Heading size="md" mb={4} textAlign="center">
        Desempenho por Vendedor (Valor Total)
      </Heading>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke={textColor} fontSize={12} tick={{ fill: textColor }} tickFormatter={formatCurrency} />
          <YAxis
            type="category"
            dataKey="nome"
            stroke={textColor}
            fontSize={12}
            tick={{ fill: textColor }}
            width={120}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: useColorModeValue('#00000010', '#ffffff10') }}
            formatter={(value: number) => [formatCurrencyTooltip(value), 'Total Vendido']}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: 'md',
            }}
          />
          <Bar dataKey="valorTotalVendido" fill={barColor} name="Valor Vendido" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="valorTotalVendido"
              position="right"
              formatter={formatCurrency}
              fill={textColor}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Adiciona a exportação padrão para compatibilidade com a importação
export default SellerProductivityChart;
