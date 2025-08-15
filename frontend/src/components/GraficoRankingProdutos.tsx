// frontend/src/components/GraficoRankingProdutos.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { IRankingProduto } from '../services/dashboard.service';

interface GraficoRankingProdutosProps {
  data: IRankingProduto[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const COLORS = ['#3182CE', '#63B3ED', '#4299E1'];

const renderLegend = (props: any) => {
  const { payload } = props;
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack spacing={2} align="center" mt={4}>
      {payload.map((entry: any, index: number) => (
        <HStack key={`item-${index}`} spacing={3} w="full" justifyContent="center">
          <Box w="12px" h="12px" bg={entry.color} borderRadius="sm" />
          <Text fontSize="sm" color={textColor} isTruncated maxW="150px">
            {entry.value}
          </Text>
          <Text fontSize="sm" fontWeight="bold" color={textColor}>
            ({formatCurrency(entry.payload.total_vendido)})
          </Text>
        </HStack>
      ))}
    </VStack>
  );
};

export const GraficoRankingProdutos = ({
  data,
  isLoading,
  isError,
}: GraficoRankingProdutosProps) => {
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');
  const labelTextColor = 'white';

  if (isLoading) {
    return <Center h="250px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="250px"><Text color="red.500">Erro ao carregar ranking.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return <Center h="250px"><Text color="gray.500">Nenhum produto vendido no mês.</Text></Center>;
  }

  return (
    <Box h="250px">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: 'md',
              boxShadow: 'md',
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            dataKey="total_vendido"
            nameKey="nome"
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={data.length > 1 ? 5 : 0}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
            }) => {
              if (percent < 0.07) return null;
              const radius = (innerRadius + outerRadius) / 2.5;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                <text
                  x={x}
                  y={y}
                  fill={labelTextColor}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14px"
                  fontWeight="bold"
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {/* ✅ CORREÇÃO: Substituído 'entry' por '_' para indicar que não é utilizado. */}
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={tooltipBg} />
            ))}
          </Pie>
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};
