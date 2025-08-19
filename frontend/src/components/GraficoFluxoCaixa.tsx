import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
  useToken, // 1. Importar o hook useToken
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
  // Define os nomes das cores com base no modo (claro/escuro)
  const receitaColorName = useColorModeValue('green.500', 'green.300');
  const despesaColorName = useColorModeValue('red.500', 'red.300');

  // 2. Usa o useToken para obter os valores de cor reais (ex: #38A169)
  const [receitaColor, despesaColor] = useToken('colors', [
    receitaColorName,
    despesaColorName,
  ]);

  // Cores para os outros elementos do gráfico (não precisam de useToken se forem strings diretas)
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
        <BarChart
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
          <Bar
            dataKey="receitas"
            fill={receitaColor} // 3. Agora 'receitaColor' contém o valor hexadecimal correto
            name="Receitas"
          />
          <Bar
            dataKey="despesas"
            fill={despesaColor} // 4. E 'despesaColor' também
            name="Despesas"
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
