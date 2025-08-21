// frontend/src/components/GraficoBalancoMensal.tsx

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
  Legend,
} from 'recharts';
import { IBalancoMensal } from '../services/financas.service';

interface GraficoBalancoMensalProps {
  data: IBalancoMensal[] | undefined;
  isLoading: boolean;
  isError: boolean;
  receitaColor: string; // <-- Propriedade de cor adicionada
  despesaColor: string; // <-- Propriedade de cor adicionada
}

const formatCurrencyAxis = (value: number) => {
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

export const GraficoBalancoMensal = ({
  data,
  isLoading,
  isError,
  receitaColor, // <-- Cor recebida via props
  despesaColor, // <-- Cor recebida via props
}: GraficoBalancoMensalProps) => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
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
            <Heading size="md" mb={4}>Balanço Mensal (Receitas x Despesas)</Heading>
            <Center h="80%">
                <Text color="gray.500">Nenhum dado financeiro encontrado no período.</Text>
            </Center>
        </Box>
    );
  }

  return (
    <Box p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder} h="350px">
        <Heading size="md" mb={4}>Balanço Mensal (Receitas x Despesas)</Heading>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke={textColor} fontSize={12} tick={{ fill: textColor }} />
            <YAxis
                stroke={textColor}
                fontSize={12}
                tick={{ fill: textColor }}
                tickFormatter={formatCurrencyAxis}
                width={80}
            />
            <Tooltip
                cursor={{ fill: useColorModeValue('#00000010', '#ffffff10') }}
                formatter={(value: number) => formatCurrencyTooltip(value)}
                contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 'md',
                boxShadow: 'lg',
                }}
            />
            <Legend wrapperStyle={{ color: textColor, paddingTop: '10px' }} />
            <Bar dataKey="receitas" fill={receitaColor} name="Receitas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill={despesaColor} name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </Box>
  );
};
