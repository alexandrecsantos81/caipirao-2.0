import { Box, Center, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { IRankingCliente } from '../services/dashboard.service';

interface GraficoRankingClientesProps {
  data: IRankingCliente[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const GraficoRankingClientes = ({ data, isLoading, isError }: GraficoRankingClientesProps) => {
  const barColor = useColorModeValue("#3182CE", "#63B3ED"); // Blue
  const textColor = useColorModeValue("gray.600", "gray.400");
  const labelColor = useColorModeValue("#1A202C", "white");

  if (isLoading) {
    return <Center h="350px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="350px"><Text color="red.500">Erro ao carregar ranking.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return <Center h="350px"><Text color="gray.500">Nenhum cliente realizou compras no mês.</Text></Center>;
  }

  return (
    <Box h="350px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="nome" 
            stroke={textColor} 
            fontSize={12} 
            width={100} 
            axisLine={false} 
            tickLine={false}
            interval={0}
            tick={{ width: 110, textAnchor: 'start' }}
          />
          <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="total_comprado" fill={barColor} name="Total Comprado" radius={[0, 4, 4, 0]}>
            <LabelList 
              dataKey="total_comprado" 
              position="right" 
              formatter={(value: number) => formatCurrency(value)}
              fill={labelColor}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
