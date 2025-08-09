// src/components/SellerProductivityTable.tsx

import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Skeleton, Text, Center
} from '@chakra-ui/react';
import { ISellerProductivityItem } from '@/services/report.service';

interface SellerProductivityTableProps {
  data: ISellerProductivityItem[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const SellerProductivityTable = ({ data, isLoading }: SellerProductivityTableProps) => {
  // Se estiver carregando, exibe 5 linhas de esqueleto
  if (isLoading) {
    return (
      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr><Th>#</Th><Th>Vendedor</Th><Th isNumeric>Nº de Vendas</Th><Th isNumeric>Valor Total Vendido (R$)</Th></Tr>
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

  // Se não houver dados após o carregamento, exibe uma mensagem
  if (!data || data.length === 0) {
    return (
      <Center p={10}>
        <Text color="gray.500">Nenhuma venda encontrada para os vendedores no período selecionado.</Text>
      </Center>
    );
  }

  // Renderiza a tabela com os dados reais
  return (
    <TableContainer>
      <Table variant="striped">
        <Thead>
          <Tr><Th>#</Th><Th>Vendedor</Th><Th isNumeric>Nº de Vendas</Th><Th isNumeric>Valor Total Vendido (R$)</Th></Tr>
        </Thead>
        <Tbody>
          {data.map((vendedor, index) => (
            <Tr key={vendedor.vendedorId}>
              <Td>{index + 1}</Td>
              <Td>{vendedor.nome}</Td>
              <Td isNumeric>{vendedor.numeroDeVendas}</Td>
              <Td isNumeric>{formatCurrency(vendedor.valorTotalVendido)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
