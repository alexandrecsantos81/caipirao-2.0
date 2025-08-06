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
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';
import { useFinancialSummary } from '../hooks/useReports';

// Componente para um único card do dashboard
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

// Componente principal da página do Dashboard
const DashboardPage = () => {
  const { data, isLoading, isError, error } = useFinancialSummary();

  // Formata um número para o padrão monetário brasileiro
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Box textAlign="center">
          <Heading color="red.500">Acesso Negado ou Erro na Conexão</Heading>
          <Text mt={4}>
            Você precisa ser um administrador para ver esta página, ou houve um problema ao buscar os dados.
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            Detalhes: {error?.message}
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
          stat={formatCurrency(data?.receitaTotal ?? 0)}
          icon={FaArrowUp}
          changeType="increase"
        />
        <StatCard
          title={'Despesa Total'}
          stat={formatCurrency(data?.despesaTotal ?? 0)}
          icon={FaArrowDown}
          changeType="decrease"
        />
        <StatCard
          title={'Saldo (Lucro)'}
          stat={formatCurrency(data?.saldo ?? 0)}
          icon={FaEquals}
          changeType="neutral"
        />
      </SimpleGrid>

      {/* Área para futuros gráficos */}
      <Box mt={10}>
        <Heading size="md">Análise Detalhada (em breve)</Heading>
        <Flex
          mt={4}
          p={10}
          border="2px dashed"
          borderColor="gray.300"
          rounded="lg"
          justify="center"
          align="center"
          height="300px"
        >
          <Text color="gray.500">Área reservada para gráficos de vendas por período, etc.</Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default DashboardPage;
