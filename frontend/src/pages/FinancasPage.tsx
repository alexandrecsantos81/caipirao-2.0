// frontend/src/pages/FinancasPage.tsx

import {
  Box, Button, Flex, Heading, Input, Text,
  Tabs, TabList, TabPanels, Tab, SimpleGrid, useColorModeValue,
  TabPanel
} from '@chakra-ui/react';
import { useState } from 'react';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';

// Importando os componentes de seus próprios arquivos
import { DashboardFinanceiro } from '../components/DashboardFinanceiro';
import { TabelaReceitasExternas } from '../components/TabelaReceitasExternas';
import { TabelaDespesasPessoais } from '../components/TabelaDespesasPessoais';

const FinancasPage = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

  const handleSetPeriod = (start: Date, end: Date) => {
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const baseTabStyles = {
    fontWeight: 'semibold',
    px: { base: 3, md: 6 },
    py: 3,
    borderRadius: 'md',
    transition: 'all 0.2s ease-in-out',
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading as="h1" mb={2}>Centro Financeiro</Heading>
      <Text color="gray.500" mb={6}>Analise os dados consolidados do negócio e das suas finanças pessoais.</Text>

      <Box p={4} borderWidth={1} borderRadius="md" my={6} bg={useColorModeValue('gray.50', 'gray.700')}>
        <Heading size="md" mb={4}>Filtrar Período Global</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} mb={4}>
          <Button onClick={() => handleSetPeriod(startOfMonth(today), endOfMonth(today))}>Este Mês</Button>
          <Button onClick={() => handleSetPeriod(subDays(today, 30), today)}>Últimos 30 dias</Button>
        </SimpleGrid>
        <Flex gap={4} align="flex-end" direction={{ base: 'column', md: 'row' }}>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Início</Text><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
          <Box flex={1} w="full"><Text fontSize="sm" mb={1}>Data de Fim</Text><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} bg={useColorModeValue('white', 'gray.800')} /></Box>
        </Flex>
      </Box>

      <Tabs variant="unstyled" align="center" >
        <TabList gap={3}>
          <Tab {...baseTabStyles} _selected={{ color: 'white', bg: 'teal.400', boxShadow: 'md' }} _hover={{ bg: useColorModeValue('teal.50', 'gray.600') }}>Dashboard</Tab>
          <Tab {...baseTabStyles} _selected={{ color: 'white', bg: 'green.400', boxShadow: 'md' }} _hover={{ bg: useColorModeValue('green.50', 'green.800') }}>Receitas Pessoais</Tab>
          <Tab {...baseTabStyles} _selected={{ color: 'white', bg: 'red.400', boxShadow: 'md' }} _hover={{ bg: useColorModeValue('red.50', 'red.800') }}>Despesas Pessoais</Tab>
        </TabList>

        <TabPanels mt={5}>
          <TabPanel>
            <DashboardFinanceiro filters={{ startDate, endDate }} />
          </TabPanel>
          <TabPanel>
            <TabelaReceitasExternas />
          </TabPanel>
          <TabPanel>
            {/* A mágica acontece aqui: o componente corrigido é renderizado */}
            <TabelaDespesasPessoais filters={{ startDate, endDate }} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FinancasPage;
