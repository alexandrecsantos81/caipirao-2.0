// frontend/src/components/GraficoRankingClientes.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useColorModeValue,
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
import { IRankingCliente } from '../services/dashboard.service';

interface GraficoRankingClientesProps {
  data: IRankingCliente[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact', // Formato compacto (ex: R$ 1,5 mil) para economizar espaço
    maximumFractionDigits: 1,
  }).format(value);

const formatCurrencyTooltip = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const GraficoRankingClientes = ({
  data,
  isLoading,
  isError,
}: GraficoRankingClientesProps) => {
  const barColor = useColorModeValue('#3182CE', '#63B3ED');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.300', 'gray.600');

  if (isLoading) {
    return <Center h="250px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="250px"><Text color="red.500">Erro ao carregar ranking.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return <Center h="250px"><Text color="gray.500">Nenhum cliente realizou compras no mês.</Text></Center>;
  }

  // Revertendo a ordem dos dados para que o maior valor apareça primeiro (da esquerda para a direita)
  const reversedData = [...data].reverse();

  return (
    <Box h="250px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={reversedData}
          margin={{ top: 20, right: 20, left: 20, bottom: 40 }} // Aumenta a margem inferior para os rótulos
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
          
          {/* ✅ CORREÇÃO: Eixo X agora mostra os nomes dos clientes, rotacionados */}
          <XAxis
            dataKey="nome"
            stroke={textColor}
            fontSize={12}
            tick={{ fill: textColor }}
            angle={-45} // Rotaciona os rótulos
            textAnchor="end" // Alinha o final do texto ao ponto
            height={50} // Aumenta a altura para acomodar a rotação
            interval={0} // Garante que todos os rótulos sejam exibidos
          />
          
          {/* ✅ CORREÇÃO: Eixo Y agora mostra os valores em R$ */}
          <YAxis
            stroke={textColor}
            fontSize={12}
            tick={{ fill: textColor }}
            tickFormatter={formatCurrency}
          />
          
          <Tooltip
            cursor={{ fill: useColorModeValue('#00000010', '#ffffff10') }}
            formatter={(value: number) => [formatCurrencyTooltip(value), 'Total Gasto']}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: 'md',
              boxShadow: 'lg',
            }}
          />
          <Bar dataKey="total_comprado" fill={barColor} radius={[4, 4, 0, 0]}>
            {/* ✅ CORREÇÃO: LabelList agora posiciona o valor acima da barra */}
            <LabelList
              dataKey="total_comprado"
              position="top"
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
