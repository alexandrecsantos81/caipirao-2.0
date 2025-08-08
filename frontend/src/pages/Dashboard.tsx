// frontend/src/pages/DashboardPage.tsx

import {
  Box, Flex, Heading, SimpleGrid, Spinner, Stat, StatLabel, StatNumber,
  Icon, Text, useColorModeValue, Center, HStack, Input, Button, useToast,
  VStack, Link,
  IconButton, // <-- CORREÇÃO: Adicionando a importação que faltava
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown, FaEquals, FaWhatsapp } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

import { getFinancialSummary, getProdutosMaisVendidos, IFinancialSummary, IProdutoMaisVendido, IDateFilter } from '../services/reports.service';
import { IContaAReceber, getContasAReceber, registrarPagamento } from '../services/venda.service';

// --- COMPONENTES STATCARD E GRÁFICO (sem alterações) ---
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
const GraficoProdutosMaisVendidos = ({ filters }: { filters: IDateFilter }) => {
  const { data: produtos, isLoading, isError } = useQuery<IProdutoMaisVendido[]>({
    queryKey: ['produtosMaisVendidos', filters],
    queryFn: () => getProdutosMaisVendidos(filters),
  });
  if (isLoading) return <Center height="350px"><Spinner size="xl" /></Center>;
  if (isError) return <Center height="350px"><Text color="red.500">Erro ao carregar gráfico.</Text></Center>;
  if (!produtos || produtos.length === 0) return <Center height="350px"><Text>Sem dados de vendas para o período.</Text></Center>;
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={produtos} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="nome" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [value, 'Unidades']} /><Legend /><Bar dataKey="total_vendido" fill="#319795" name="Qtd. Vendida" /></BarChart>
    </ResponsiveContainer>
  );
};


// --- COMPONENTE: CARD DE CONTAS A RECEBER ---
const ContasAReceberCard = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const { data: contas, isLoading, isError } = useQuery<IContaAReceber[]>({
        queryKey: ['contasAReceber'],
        queryFn: getContasAReceber,
    });

    const { mutate: pagarConta, isPending: isPagando, variables: idPagando } = useMutation({
        mutationFn: registrarPagamento,
        onSuccess: () => {
            toast({ title: 'Pagamento registrado!', status: 'success', duration: 3000, isClosable: true });
            queryClient.invalidateQueries({ queryKey: ['contasAReceber'] });
            queryClient.invalidateQueries({ queryKey: ['financialSummary'] });
        },
        onError: (error: any) => {
            toast({ title: 'Erro ao registrar pagamento', description: error.message, status: 'error', duration: 5000, isClosable: true });
        }
    });

    const openWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank' );
    };

    return (
        <Box mt={10} p={{base: 4, md: 6}} shadow={'xl'} border={'1px solid'} borderColor={useColorModeValue('gray.200', 'gray.700')} rounded={'lg'}>
            <Heading size="md" mb={4}>Contas a Receber (Próximos 5 dias)</Heading>
            {isLoading && <Center><Spinner /></Center>}
            {isError && <Text color="red.500">Não foi possível carregar as contas a receber.</Text>}
            {!isLoading && !isError && (
                <VStack spacing={4} align="stretch">
                    {contas && contas.length > 0 ? (
                        contas.map(conta => (
                            <Flex key={conta.id} justify="space-between" align="center" p={3} borderWidth={1} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Box>
                                    <Text fontWeight="bold">{conta.cliente_nome}</Text>
                                    <Text fontSize="sm">Vence em: {new Date(conta.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
                                    <Text fontSize="lg" color="green.500" fontWeight="bold">{conta.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                                </Box>
                                <HStack>
                                    {conta.cliente_telefone && (
                                        <IconButton as={Link} onClick={() => openWhatsApp(conta.cliente_telefone)} icon={<FaWhatsapp />} aria-label="Chamar no WhatsApp" colorScheme="whatsapp" isRound />
                                    )}
                                    <Button 
                                        colorScheme="teal" 
                                        size="sm"
                                        onClick={() => pagarConta(conta.id)}
                                        isLoading={isPagando && idPagando === conta.id}
                                    >
                                        Registrar Pagamento
                                    </Button>
                                </HStack>
                            </Flex>
                        ))
                    ) : (
                        <Text color="gray.500">Nenhuma conta a receber nos próximos 5 dias.</Text>
                    )}
                </VStack>
            )}
        </Box>
    );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA DO DASHBOARD ---
const DashboardPage = () => {
  const toast = useToast();
  const [dateFilters, setDateFilters] = useState<IDateFilter>({});
  const [tempFilters, setTempFilters] = useState<IDateFilter>({ de: '', ate: '' });

  const { data: summaryData, isLoading: isLoadingSummary, isError: isErrorSummary, error: summaryError } = useQuery<IFinancialSummary, Error>({
    queryKey: ['financialSummary', dateFilters],
    queryFn: () => getFinancialSummary(dateFilters),
  });

  const handleFilter = () => {
    if (tempFilters.de && tempFilters.ate) {
        setDateFilters(tempFilters);
    } else {
        toast({ title: "Datas incompletas", status: "warning", duration: 3000, isClosable: true });
    }
  };

  const formatCurrency = (value: number | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

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
            <StatCard title={'Receita Total'} stat={formatCurrency(summaryData?.receitaTotal)} icon={FaArrowUp} changeType="increase" />
            <StatCard title={'Despesa Total'} stat={formatCurrency(summaryData?.despesaTotal)} icon={FaArrowDown} changeType="decrease" />
            <StatCard title={'Saldo (Lucro)'} stat={formatCurrency(summaryData?.saldo)} icon={FaEquals} changeType="neutral" />
        </SimpleGrid>
      )}

      <ContasAReceberCard />

      <Box mt={10} p={{base: 4, md: 6}} shadow={'xl'} border={'1px solid'} borderColor={useColorModeValue('gray.200', 'gray.700')} rounded={'lg'}>
        <Heading size="md" mb={4}>Produtos Mais Vendidos</Heading>
        <GraficoProdutosMaisVendidos filters={dateFilters} />
      </Box>
    </Box>
  );
};

export default DashboardPage;
