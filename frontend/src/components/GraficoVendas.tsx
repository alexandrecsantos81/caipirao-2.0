// frontend/src/components/GraficoVendas.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { IVendasPorDia } from '../services/dashboard.service';

interface GraficoVendasProps {
  data: IVendasPorDia[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatarMoeda = (valor: number) => {
  if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
};

export const GraficoVendas = ({ data, isLoading, isError }: GraficoVendasProps) => {
  const chartBgColor = useColorModeValue('gray.100', 'gray.800');

  const gradientStartColor = useColorModeValue('teal.400', 'teal.200');
  const gradientEndColor = useColorModeValue('blue.500', 'blue.300');
  const lineColor = useColorModeValue('teal.600', 'teal.100');

  const textColor = useColorModeValue('gray.700', 'gray.300');
  const gridColor = useColorModeValue('gray.400', 'gray.500'); // mais visível
  const tooltipBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.800'); // mais sólido
  const tooltipBorder = useColorModeValue('gray.400', 'gray.500');

  if (isLoading) {
    return (
      <Center h="350px" bg={chartBgColor} borderRadius="md">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="350px" bg={chartBgColor} borderRadius="md">
        <Text color="red.500">Erro ao carregar dados do gráfico.</Text>
      </Center>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Center h="350px" bg={chartBgColor} borderRadius="md">
        <Text color={textColor}>Nenhum dado de venda nos últimos 30 dias.</Text>
      </Center>
    );
  }

  return (
    <Box h="350px" bg={chartBgColor} p={4} borderRadius="md">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="highContrastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientStartColor} stopOpacity={0.95} /> {/* Mais visível */}
              <stop offset="95%" stopColor={gradientEndColor} stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={gridColor} strokeDasharray="2 2" opacity={0.8} />
          <XAxis dataKey="dia" stroke={textColor} fontSize={12} tick={{ fill: textColor }} />
          <YAxis
            tickFormatter={formatarMoeda}
            stroke={textColor}
            fontSize={12}
            width={80}
            tick={{ fill: textColor }}
          />
          <Tooltip
            formatter={(value: number) => [formatarMoeda(value), 'Vendas']}
            labelStyle={{ color: textColor, fontWeight: 'bold' }}
            itemStyle={{ color: lineColor, fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: 'md',
              boxShadow: 'lg',
              backdropFilter: 'blur(5px)',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={lineColor}
            strokeWidth={3} // Linha mais grossa
            fill="url(#highContrastGradient)"
            name="Vendas"
            dot={{ r: 5, fill: lineColor, stroke: chartBgColor, strokeWidth: 2 }} // Pontos maiores
            activeDot={{ r: 9, fill: lineColor, stroke: chartBgColor, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};
