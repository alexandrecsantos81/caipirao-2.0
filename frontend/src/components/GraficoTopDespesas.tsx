// frontend/src/components/GraficoTopDespesas.tsx

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
import { ITopDespesa } from '../services/financas.service';

interface GraficoTopDespesasProps {
  data: ITopDespesa[] | undefined;
  isLoading: boolean;
  isError: boolean;
  barColor: string; // <-- Propriedade de cor adicionada
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

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

export const GraficoTopDespesas = ({
  data,
  isLoading,
  isError,
  barColor, // <-- Cor recebida via props
}: GraficoTopDespesasProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.300', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');

  if (isLoading) {
    return <Center h="350px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="350px"><Text color="red.500">Erro ao carregar dados do gráfico.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return (
        <Box p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder} h="350px">
            <Heading size="md" mb={4}>Top 5 Despesas Individuais</Heading>
            <Center h="80%">
                <Text color="gray.500">Nenhuma despesa para exibir no ranking.</Text>
            </Center>
        </Box>
    );
  }

  const reversedData = [...data].reverse();

  return (
    <Box p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder} h="350px">
        <Heading size="md" mb={4}>Top 5 Despesas Individuais</Heading>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart
                data={reversedData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={textColor} fontSize={12} tick={{ fill: textColor }} tickFormatter={formatCurrency} />
                <YAxis
                    type="category"
                    dataKey="descricao"
                    stroke={textColor}
                    fontSize={12}
                    tick={{ fill: textColor }}
                    tickFormatter={(value) => truncateText(value, 25)}
                    width={150}
                />
                <Tooltip
                    cursor={{ fill: useColorModeValue('#00000010', '#ffffff10') }}
                    formatter={(value: number) => [formatCurrencyTooltip(value), 'Valor']}
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: 'md',
                        boxShadow: 'lg',
                    }}
                />
                <Bar dataKey="valor" fill={barColor} name="Valor" radius={[0, 4, 4, 0]}>
                    <LabelList
                        dataKey="valor"
                        position="right"
                        formatter={formatCurrency}
                        fill={labelColor}
                        fontSize={12}
                        fontWeight="bold"
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </Box>
  );
};
