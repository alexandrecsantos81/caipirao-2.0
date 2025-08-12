// frontend/src/pages/ProdutosPage.tsx (VERSÃO DE DIAGNÓSTICO)

import {
  Box, Button, Center, Flex, Heading, Text,
  useDisclosure,
  VStack,
  HStack,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/Pagination';

// Componentes de formulário e modal vazios para evitar erros de importação
const FormularioProduto = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;
  return <Box>Formulário Produto</Box>;
};

const ModalEntradaEstoque = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;
  return <Box>Modal Entrada Estoque</Box>;
};


const ProdutosPage = () => {
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEstoqueOpen, onOpen: onEstoqueOpen, onClose: onEstoqueClose } = useDisclosure();
  const [pagina, setPagina] = useState(1);
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });

  // DADOS MOCKADOS PARA TESTE
  const mockData = {
    dados: [
      { id: 1, nome: 'Produto Teste 1', unidade_medida: 'kg', price: 10.50, quantidade_em_estoque: 100 },
      { id: 2, nome: 'Produto Teste 2', unidade_medida: 'un', price: 5.00, quantidade_em_estoque: 50 },
    ],
    totalPaginas: 1,
    pagina: 1,
  };

  const isLoading = false; // Simula que o carregamento terminou

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Heading textAlign={{ base: 'center', md: 'left' }}>Gestão de Produtos</Heading>
        {isAdmin && (
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onFormOpen} w={{ base: 'full', md: 'auto' }}>
            Novo Produto
          </Button>
        )}
      </Flex>

      {isLoading ? (
        <Center><Text>Carregando...</Text></Center>
      ) : (
        <>
          {isMobile ? (
            <VStack spacing={4} align="stretch">
              <Text>Visualização mobile</Text>
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Unidade</Th>
                    <Th isNumeric>Preço (R$)</Th>
                    <Th isNumeric>Estoque Atual</Th>
                    {isAdmin && <Th>Ações</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {mockData.dados.map((produto) => (
                    <Tr key={produto.id}>
                      <Td>{produto.nome}</Td>
                      <Td>{produto.unidade_medida}</Td>
                      <Td isNumeric>{produto.price.toFixed(2)}</Td>
                      <Td isNumeric>{produto.quantidade_em_estoque}</Td>
                      {isAdmin && <Td><HStack spacing={2}></HStack></Td>}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
          <Pagination paginaAtual={mockData.pagina} totalPaginas={mockData.totalPaginas} onPageChange={setPagina} />
        </>
      )}

      <FormularioProduto isOpen={isFormOpen && isAdmin} />
      <ModalEntradaEstoque isOpen={isEstoqueOpen && isAdmin} />
    </Box>
  );
};

export default ProdutosPage;
