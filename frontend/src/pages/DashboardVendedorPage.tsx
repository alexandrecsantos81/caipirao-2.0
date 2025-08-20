import {
  Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  useColorModeValue, Heading, Center, Text, Spinner, VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiDollarSign, FiShoppingCart, FiUsers } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
// 1. Importar a função de serviço real e a interface
import { getVendedorKPIs, IVendedorKPIs } from '@/services/dashboard.service';

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DashboardVendedorPage = () => {
  const { user } = useAuth();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 2. Substituir a função de mock pela chamada real da API usando react-query
  const { data: kpis, isLoading, isError } = useQuery<IVendedorKPIs, Error>({
    // A chave da query inclui o ID do usuário para garantir que os dados sejam buscados novamente se o usuário mudar
    queryKey: ['dashboardVendedor', user?.id],
    // A função de query agora chama o nosso serviço real
    queryFn: () => getVendedorKPIs(user!.id),
    // A query só será executada se houver um usuário logado (user.id existe)
    enabled: !!user,
  });

  if (isLoading) {
    return <Center p={8} minH="50vh"><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center p={8}><Text color="red.500" fontSize="lg">Erro ao carregar seus dados de desempenho.</Text></Center>;
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
          <StatLabel>Comissão Prevista (5%)</StatLabel>
          <StatNumber color="blue.500">{formatCurrency(kpis?.comissaoPrevista)}</StatNumber>
          <StatHelpText><FiDollarSign /> Valor estimado de comissão</StatHelpText>
        </Stat>

        <Stat p={5} borderWidth={1} borderRadius={8} boxShadow="sm" bg={cardBg} borderColor={borderColor}>
          <StatLabel>Novos Clientes Captados</StatLabel>
          <StatNumber>{kpis?.novosClientesMes ?? 0}</StatNumber>
          <StatHelpText><FiUsers /> Clientes cadastrados por você</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardVendedorPage;
