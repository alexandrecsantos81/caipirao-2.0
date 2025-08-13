import { Box, Center, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { IRankingProduto } from '../services/dashboard.service';

interface GraficoRankingProdutosProps {
  data: IRankingProduto[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const GraficoRankingProdutos = ({ data, isLoading, isError }: GraficoRankingProdutosProps) => {
  const barColor = useColorModeValue("#4299E1", "#63B3ED"); // Blue
  const textColor = useColorModeValue("gray.600", "gray.400");
  const labelColor = useColorModeValue("#1A202C", "white");

  if (isLoading) {
    return <Center h="350px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center h="350px"><Text color="red.500">Erro ao carregar ranking.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return <Center h="350px"><Text color="gray.500">Nenhum produto vendido no mês.</Text></Center>;
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
          <Bar dataKey="total_vendido" fill={barColor} radius={[0, 4, 4, 0]}>
            <LabelList 
              dataKey="total_vendido" 
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
