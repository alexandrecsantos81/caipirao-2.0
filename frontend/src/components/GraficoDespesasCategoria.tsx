import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Heading,
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { IDespesaPorCategoria } from '../services/financas.service';

interface GraficoDespesasCategoriaProps {
  data: IDespesaPorCategoria[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const COLORS = [
  '#3182CE', '#DD6B20', '#38A169', '#D53F8C', '#805AD5',
  '#E53E3E', '#D69E2E', '#319795', '#5A67D8', '#B7791F'
];

const renderLegend = (props: any) => {
  const { payload } = props;
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack spacing={2} align="start" mt={4}>
      {payload.map((entry: any, index: number) => (
        <HStack key={`item-${index}`} spacing={3} w="full">
          <Box w="12px" h="12px" bg={entry.color} borderRadius="sm" />
          <Text fontSize="sm" color={textColor} isTruncated maxW="150px">
            {entry.value}
          </Text>
          <Text fontSize="sm" fontWeight="bold" color={textColor}>
            ({formatCurrency(entry.payload.value)})
          </Text>
        </HStack>
      ))}
    </VStack>
  );
};

export const GraficoDespesasCategoria = ({
  data,
  isLoading,
  isError,
}: GraficoDespesasCategoriaProps) => {
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');
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
            <Heading size="md" mb={4}>Despesas por Categoria</Heading>
            <Center h="80%">
                <Text color="gray.500">Nenhuma despesa pessoal encontrada no período.</Text>
            </Center>
        </Box>
    );
  }

  return (
    <Box p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder} h="350px">
        <Heading size="md" mb={4}>Despesas por Categoria</Heading>
        <ResponsiveContainer width="100%" height="90%">
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
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={data.length > 1 ? 2 : 0}
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
                {/* ✅ CORREÇÃO APLICADA AQUI */}
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
