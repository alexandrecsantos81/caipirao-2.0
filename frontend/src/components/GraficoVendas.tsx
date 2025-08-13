import { Box, Center, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IVendasPorDia } from '../services/dashboard.service';

interface GraficoVendasProps {
  data: IVendasPorDia[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Função para formatar os valores do eixo Y como moeda
const formatarMoeda = (valor: number) => {
  if (typeof valor !== 'number') return '';
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export const GraficoVendas = ({ data, isLoading, isError }: GraficoVendasProps) => {
  const barColor = useColorModeValue("#38B2AC", "#4FD1C5");
  const gridColor = useColorModeValue("#E2E8F0", "#4A5568");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const tooltipBg = useColorModeValue("white", "gray.700");

  if (isLoading) {
    return <Center h="350px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="350px"><Text color="red.500">Erro ao carregar dados do gráfico.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return <Center h="350px"><Text color="gray.500">Nenhum dado de venda nos últimos 30 dias.</Text></Center>;
  }

  return (
    <Box h="350px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="dia" stroke={textColor} fontSize={12} />
          <YAxis tickFormatter={formatarMoeda} stroke={textColor} fontSize={12} width={70} />
          <Tooltip
            formatter={(value: number) => 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            }
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderRadius: '8px',
              borderColor: gridColor,
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="total" fill={barColor} name="Total de Vendas" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
