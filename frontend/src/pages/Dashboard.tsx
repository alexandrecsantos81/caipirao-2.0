import {
  Box, Flex, Heading, SimpleGrid, Spinner, Stat, StatLabel, StatNumber,
  Icon, Text, useColorModeValue, Center, HStack, Input, Button, useToast
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

import { getFinancialSummary, getProdutosMaisVendidos, IFinancialSummary, IProdutoMaisVendido, IDateFilter } from '../services/reports.service';

// Componente StatCard (sem alterações)
const StatCard = ({ title, stat, icon, changeType }: { title: string; stat: string; icon: React.ElementType; changeType: 'increase' | 'decrease' | 'neutral' }) => {
    const changeColor = { increase: 'green.500', decrease: 'red.500', neutral: 'gray.500' };
    return (
      <Stat px={{ base: 4, md: 8 }} py={'5'} shadow={'xl'} border={'1px solid'} borderColor={useColorModeValue('gray.200', 'gray.700')} rounded={'lg'}>
        <Flex justifyContent={'space-between'}>
          <Box pl={{ base: 2, md: 4 }}><StatLabel fontWeight={'medium'} isTruncated>{title}</StatLabel><StatNumber fontSize={'2xl'} fontWeight={'medium'}>{stat}</StatNumber></Box>
          <Box my={'auto'} color={changeColor[changeType]} alignContent={'center'}><Icon as={icon} w={10} h={10} /></Box>
        </Flex>
      </Stat>
    );
};

// Componente do Gráfico (modificado para aceitar filtros)
const GraficoProdutosMaisVendidos = ({ filters }: { filters: IDateFilter }) => {
  const { data: produtos, isLoading, isError } = useQuery<IProdutoMaisVendido[]>({
    queryKey: ['produtosMaisVendidos', filters], // A chave da query agora inclui os filtros
    queryFn: () => getProdutosMaisVendidos(filters),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <Center height="350px"><Spinner size="xl" /></Center>;
  if (isError) return <Center height="350px"><Text color="red.500">Não foi possível carregar os dados do gráfico.</Text></Center>;
  if (!produtos || produtos.length === 0) return <Center height="350px"><Text color="gray.500">Sem dados de vendas para o período.</Text></Center>;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={produtos} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" />
        <YAxis allowDecimals={false} />
        <Tooltip cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }} formatter={(value) => [value, 'Unidades']} />
        <Legend />
        <Bar dataKey="total_vendido" fill="#319795" name="Quantidade Vendida" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Componente principal da página do Dashboard
const DashboardPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // 1. Estado para armazenar as datas do filtro
  const [dateFilters, setDateFilters] = useState<IDateFilter>({});
  const [tempFilters, setTempFilters] = useState<IDateFilter>({
    de: '',
    ate: ''
  });

  // 2. Hook useQuery modificado para usar o estado do filtro
  const { data: summaryData, isLoading: isLoadingSummary, isError: isErrorSummary, error: summaryError } = useQuery<IFinancialSummary, Error>({
    queryKey: ['financialSummary', dateFilters], // A chave da query também inclui os filtros
    queryFn: () => getFinancialSummary(dateFilters),
    staleTime: 1000 * 60 * 5,
  });

  const handleFilter = () => {
    if (tempFilters.de && tempFilters.ate) {
        setDateFilters(tempFilters);
        // Invalida as queries para forçar o refetch com os novos filtros
        queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
        queryClient.invalidateQueries({ queryKey: ['produtosMaisVendidos'] });
    } else {
        toast({
            title: "Datas incompletas",
            description: "Por favor, selecione a data de início e de fim.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isErrorSummary) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Box textAlign="center">
          <Heading color="red.500">Acesso Negado ou Erro</Heading>
          <Text mt={4}>Você precisa ser administrador ou houve um problema ao buscar os dados.</Text>
          <Text fontSize="sm" color="gray.500" mt={2}>Detalhes: {summaryError?.message}</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Flex justify="space-between" align="center" mb={4} wrap="wrap">
        <Heading mb={{ base: 4, md: 0 }}>Dashboard Financeiro</Heading>
        {/* 3. Formulário de Filtro de Data */}
        <HStack spacing={2}>
            <Input type="date" value={tempFilters.de} onChange={(e) => setTempFilters({...tempFilters, de: e.target.value})} />
            <Text>até</Text>
            <Input type="date" value={tempFilters.ate} onChange={(e) => setTempFilters({...tempFilters, ate: e.target.value})} />
            <Button colorScheme="teal" onClick={handleFilter}>Filtrar</Button>
        </HStack>
      </Flex>

      {isLoadingSummary ? (
        <Center p={10}><Spinner size="xl" /></Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
            <StatCard title={'Receita Total'} stat={formatCurrency(summaryData?.receitaTotal ?? 0)} icon={FaArrowUp} changeType="increase" />
            <StatCard title={'Despesa Total'} stat={formatCurrency(summaryData?.despesaTotal ?? 0)} icon={FaArrowDown} changeType="decrease" />
            <StatCard title={'Saldo (Lucro)'} stat={formatCurrency(summaryData?.saldo ?? 0)} icon={FaEquals} changeType="neutral" />
        </SimpleGrid>
      )}

      <Box mt={10} p={{base: 4, md: 6}} shadow={'xl'} border={'1px solid'} borderColor={useColorModeValue('gray.200', 'gray.700')} rounded={'lg'}>
        <Heading size="md" mb={4}>Produtos Mais Vendidos</Heading>
        {/* 4. Passa os filtros para o componente do gráfico */}
        <GraficoProdutosMaisVendidos filters={dateFilters} />
      </Box>
    </Box>
  );
};

export default DashboardPage;
