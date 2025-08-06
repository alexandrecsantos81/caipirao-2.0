// frontend/src/pages/Movimentacoes.tsx

import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Spinner, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer, 
  TableCaption,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  useToast
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { jwtDecode } from 'jwt-decode';

import { useDespesas, useCreateDespesa } from '../hooks/useDespesas';
// Este erro vai sumir assim que criarmos o arquivo no próximo passo.
import { ModalAdicionarDespesa } from '../components/ModalAdicionarDespesa'; 

// --- FUNÇÃO AUXILIAR PARA PEGAR O PERFIL DO TOKEN ---
const getUserProfile = (): string | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    const decodedToken: { perfil: string } = jwtDecode(token);
    return decodedToken.perfil;
  } catch (error) {
    console.error("Erro ao decodificar o token:", error);
    return null;
  }
};

// ===================================================================
// CORREÇÃO: O COMPONENTE DA TABELA FOI MOVIDO PARA FORA
// ===================================================================
const TabelaDespesas = () => {
  const { data: despesas, isLoading, isError } = useDespesas();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isError) {
    return <Text color="red.500">Ocorreu um erro ao buscar as despesas.</Text>;
  }

  return (
    <TableContainer>
      <Table variant="striped">
        <TableCaption>Lista de despesas registradas</TableCaption>
        <Thead>
          <Tr>
            <Th>Descrição</Th>
            <Th>Registrado por</Th>
            <Th isNumeric>Valor (R$)</Th>
            <Th>Data</Th>
          </Tr>
        </Thead>
        <Tbody>
          {despesas?.map((despesa) => (
            <Tr key={despesa.id}>
              <Td>{despesa.descricao}</Td>
              <Td>{despesa.usuario_nome}</Td>
              <Td isNumeric>{despesa.valor_total.toFixed(2)}</Td>
              <Td>{new Date(despesa.data_movimentacao).toLocaleDateString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};


// --- PÁGINA PRINCIPAL DE MOVIMENTAÇÕES ---
const MovimentacoesPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const userProfile = getUserProfile();

  const { mutate: criarDespesa, isPending } = useCreateDespesa();

  const handleCreateDespesa = (data: { descricao: string; valor_total: number }) => {
    criarDespesa(data, {
      onSuccess: () => {
        toast({
          title: 'Sucesso!',
          description: 'Despesa registrada com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro!',
          description: error.message || 'Não foi possível registrar a despesa.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    });
  };

  return (
    <Box p={8}>
      <Heading mb={6}>Movimentações Financeiras</Heading>

      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab>Vendas (Entradas)</Tab>
          <Tab>Despesas (Saídas)</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Flex justify="space-between" mb={4}>
              <Heading size="md">Histórico de Vendas</Heading>
              <Button leftIcon={<AddIcon />} colorScheme="teal">
                Registrar Venda
              </Button>
            </Flex>
            <Text>Componente da Tabela de Vendas (TabelaVendas) vai aqui.</Text>
          </TabPanel>

          <TabPanel>
            <Flex justify="space-between" mb={4}>
              <Heading size="md">Histórico de Despesas</Heading>
              {userProfile === 'ADMIN' && (
                <Button 
                  leftIcon={<AddIcon />} 
                  colorScheme="red" 
                  onClick={onOpen}
                >
                  Registrar Despesa
                </Button>
              )}
            </Flex>
            {/* Agora isso funciona, pois TabelaDespesas é um componente válido */}
            <TabelaDespesas />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ModalAdicionarDespesa
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateDespesa}
        isLoading={isPending}
      />
    </Box>
  );
};

export default MovimentacoesPage;
