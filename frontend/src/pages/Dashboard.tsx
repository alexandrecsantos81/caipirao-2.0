// frontend/src/pages/Dashboard.tsx

import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Text,
  useColorModeValue,
  Center,
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { getFinancialSummary, getProdutosMaisVendidos, IFinancialSummary, IProdutoMaisVendido } from '../services/reports.service';

// Componente para um único card do dashboard (sem alterações)
const StatCard = ({ title, stat, icon, changeType }: { title: string; stat: string; icon: React.ElementType; changeType: 'increase' | 'decrease' | 'neutral' }) => {
  const changeColor = {
    increase: 'green.500',
    decrease: 'red.500',
    neutral: 'gray.500',
  };

  return (
    <Stat
      px={{ base: 4, md: 8 }}
      py={'5'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      rounded={'lg'}
    >
      <Flex justifyContent={'space-between'}>
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight={'medium'} isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
            {stat}
          </StatNumber>
        </Box>
        <Box
          my={'auto'}
          color={changeColor[changeType]}
          alignContent={'center'}
        >
          <Icon as={icon} w={10} h={10} />
        </Box>
      </Flex>
    </Stat>
  );
};

// --- NOVO COMPONENTE PARA O GRÁFICO ---
const GraficoProdutosMaisVendidos = () => {
  // Usamos o React Query para buscar e gerenciar os dados do novo endpoint
  const { data: produtos, isLoading, isError } = useQuery<IProdutoMaisVendido[]>({
    queryKey: ['produtosMaisVendidos'], // Chave única para o cache desta query
    queryFn: getProdutosMaisVendidos,
    staleTime: 1000 * 60 * 5, // Considera os dados "frescos" por 5 minutos
  });

  if (isLoading) {
    return <Center height="350px"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center height="350px"><Text color="red.500">Não foi possível carregar os dados do gráfico.</Text></Center>;
  }

  if (!produtos || produtos.length === 0) {
    return <Center height="350px"><Text color="gray.500">Ainda não há dados de vendas para exibir.</Text></Center>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={produtos}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" />
        <YAxis allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
          formatter={(value) => [value, 'Unidades']}
        />
        <Legend />
        <Bar dataKey="total_vendido" fill="#319795" name="Quantidade Vendida" />
      </BarChart>
    </ResponsiveContainer>
  );
};


// Componente principal da página do Dashboard
const DashboardPage = () => {
  const { data: summaryData, isLoading: isLoadingSummary, isError: isErrorSummary, error: summaryError } = useQuery<IFinancialSummary, Error>({
    queryKey: ['financialSummary'],
    queryFn: getFinancialSummary,
    staleTime: 1000 * 60 * 5,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoadingSummary) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isErrorSummary) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Box textAlign="center">
          <Heading color="red.500">Acesso Negado ou Erro na Conexão</Heading>
          <Text mt={4}>
            Você precisa ser um administrador para ver esta página, ou houve um problema ao buscar os dados.
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            Detalhes: {summaryError?.message}
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading mb={6}>Dashboard Financeiro</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
        <StatCard
          title={'Receita Total'}
          stat={formatCurrency(summaryData?.receitaTotal ?? 0)}
          icon={FaArrowUp}
          changeType="increase"
        />
        <StatCard
          title={'Despesa Total'}
          stat={formatCurrency(summaryData?.despesaTotal ?? 0)}
          icon={FaArrowDown}
          changeType="decrease"
        />
        <StatCard
          title={'Saldo (Lucro)'}
          stat={formatCurrency(summaryData?.saldo ?? 0)}
          icon={FaEquals}
          changeType="neutral"
        />
      </SimpleGrid>

      {/* Área para o novo gráfico */}
      <Box mt={10} p={{base: 4, md: 6}} shadow={'xl'} border={'1px solid'} borderColor={useColorModeValue('gray.200', 'gray.700')} rounded={'lg'}>
        <Heading size="md" mb={4}>Produtos Mais Vendidos</Heading>
        <GraficoProdutosMaisVendidos />
      </Box>
    </Box>
  );
};

export default DashboardPage;
