// frontend/src/components/GraficoDespesasCategoria.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
  HStack, // 'VStack' foi removido daqui
  Heading,
  Wrap,
  WrapItem,
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
  colors?: string[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const DEFAULT_COLORS = [
  '#3182CE', '#DD6B20', '#38A169', '#D53F8C', '#805AD5',
  '#E53E3E', '#D69E2E', '#319795', '#5A67D8', '#B7791F'
];

const renderLegend = (props: any) => {
  const { payload } = props;
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Wrap justify="center" spacing="15px" mt={4}>
      {payload.map((entry: any, index: number) => (
        <WrapItem key={`item-${index}`}>
          <HStack spacing={2}>
            <Box w="12px" h="12px" bg={entry.color} borderRadius="sm" />
            <Text fontSize="xs" color={textColor}>
              {entry.value}
            </Text>
            <Text fontSize="xs" fontWeight="bold" color={textColor}>
              ({formatCurrency(entry.payload.value)})
            </Text>
          </HStack>
        </WrapItem>
      ))}
    </Wrap>
  );
};

export const GraficoDespesasCategoria = ({
  data,
  isLoading,
  isError,
  colors,
}: GraficoDespesasCategoriaProps) => {
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');

  if (isLoading) {
    return <Center h="400px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="400px"><Text color="red.500">Erro ao carregar dados do gráfico.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return (
        <Box p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder} h="400px">
            <Heading size="md" mb={4}>Despesas por Categoria</Heading>
            <Center h="80%">
                <Text color="gray.500">Nenhuma despesa pessoal encontrada no período.</Text>
            </Center>
        </Box>
    );
  }

  const palette = colors ?? DEFAULT_COLORS;

  return (
    <Box p={5} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={cardBorder} h="400px">
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
                  outerRadius="80%"
                  fill="#8884d8"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                  {data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={palette[index % palette.length]} 
                      stroke={tooltipBg} 
                    />
                  ))}
              </Pie>
              
              <Legend 
                content={renderLegend} 
                verticalAlign="bottom" 
                wrapperStyle={{
                  width: '100%',
                  position: 'absolute',
                  bottom: -5,
                  left: 0,
                }}
              />
            </PieChart>
        </ResponsiveContainer>
    </Box>
  );
};
