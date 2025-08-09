// src/components/ProductRankingTable.tsx

import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Skeleton, Text, Box, Center
} from '@chakra-ui/react';
import { IProductRankingItem } from '@/services/report.service';

interface ProductRankingTableProps {
  data: IProductRankingItem[] | undefined;
  isLoading: boolean;
}

// Função para formatar valores como moeda
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const ProductRankingTable = ({ data, isLoading }: ProductRankingTableProps) => {
  // Se estiver carregando, mostramos 10 linhas de esqueleto
  if (isLoading) {
    return (
      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>#</Th>
              <Th>Produto</Th>
              <Th isNumeric>Valor Total (R$)</Th>
              <Th isNumeric>Quantidade Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <Tr key={index}>
                <Td><Skeleton height="20px" /></Td>
                <Td><Skeleton height="20px" /></Td>
                <Td><Skeleton height="20px" /></Td>
                <Td><Skeleton height="20px" /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  }

  // Se não houver dados após o carregamento
  if (!data || data.length === 0) {
    return (
      <Center p={10}>
        <Text color="gray.500">Nenhum produto vendido no período selecionado.</Text>
      </Center>
    );
  }

  // Renderiza a tabela com os dados reais
  return (
    <TableContainer>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Produto</Th>
            <Th isNumeric>Valor Total (R$)</Th>
            <Th isNumeric>Quantidade Total (kg/un)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((produto, index) => (
            <Tr key={produto.produtoId}>
              <Td>{index + 1}</Td>
              <Td>{produto.nome}</Td>
              <Td isNumeric>{formatCurrency(produto.valorTotal)}</Td>
              <Td isNumeric>{produto.quantidadeTotal.toFixed(2)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
