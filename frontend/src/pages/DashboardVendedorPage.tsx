// frontend/src/pages/DashboardVendedorPage.tsx

import {
  Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  useColorModeValue, Heading, Center, Text, Spinner, VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiDollarSign, FiShoppingCart, FiUsers } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

// Simulação de uma interface e função de serviço para buscar os dados do vendedor
// Em um projeto real, isso viria de um arquivo de serviço (ex: dashboard.service.ts)
interface IVendedorKPIs {
  totalVendasMes: number;
  novosClientesMes: number;
  comissaoPrevista: number;
}

// Função de mock para simular a busca de dados
const getVendedorKPIs = async (userId: number): Promise<IVendedorKPIs> => {
  console.log(`Buscando dados para o vendedor com ID: ${userId}`);
  // Em um cenário real, a chamada seria:
  // const response = await apiClient.get(`/dashboard/vendedor/${userId}`);
  // return response.data;

  // Retornando dados de exemplo para demonstração
  return new Promise(resolve => setTimeout(() => {
    resolve({
      totalVendasMes: 15340.75,
      novosClientesMes: 8,
      comissaoPrevista: 15340.75 * 0.05, // Exemplo de comissão de 5%
    });
  }, 1000));
};

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DashboardVendedorPage = () => {
  const { user } = useAuth();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const { data: kpis, isLoading, isError } = useQuery<IVendedorKPIs, Error>({
    queryKey: ['dashboardVendedor', user?.id],
    queryFn: () => getVendedorKPIs(user!.id),
    enabled: !!user, // A query só roda se o usuário estiver definido
  });

  if (isLoading) {
    return <Center p={8} minH="50vh"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center p={8}><Text color="red.500" fontSize="lg">Erro ao carregar seus dados.</Text></Center>;
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="lg">Seu Desempenho</Heading>
        <Text>Olá, {user?.nome}! Aqui está um resumo de suas atividades este mês.</Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={8}>
        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" bg={cardBg} borderColor={borderColor}>
          <StatLabel>Total Vendido no Mês</StatLabel>
          <StatNumber color="green.500">{formatCurrency(kpis?.totalVendasMes)}</StatNumber>
          <StatHelpText><FiShoppingCart /> Suas vendas no mês atual</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" bg={cardBg} borderColor={borderColor}>
          <StatLabel>Comissão Prevista</StatLabel>
          <StatNumber color="blue.500">{formatCurrency(kpis?.comissaoPrevista)}</StatNumber>
          <StatHelpText><FiDollarSign /> Valor estimado de comissão</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" bg={cardBg} borderColor={borderColor}>
          <StatLabel>Novos Clientes Captados</StatLabel>
          <StatNumber>{kpis?.novosClientesMes ?? 0}</StatNumber>
          <StatHelpText><FiUsers /> Clientes cadastrados por você</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Aqui poderíamos adicionar mais componentes, como um ranking pessoal ou metas */}
    </Box>
  );
};

export default DashboardVendedorPage;
