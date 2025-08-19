// frontend/src/components/SellerProductivityTable.tsx

import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Skeleton, Text, Center, Avatar, HStack
} from '@chakra-ui/react';
import { ISellerProductivityItem } from '@/services/report.service';

interface SellerProductivityTableProps {
  data: ISellerProductivityItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// O nome do componente aqui deve ser SellerProductivityTable
export const SellerProductivityTable = ({ data, isLoading, isError }: SellerProductivityTableProps) => {
  if (isLoading) {
    return (
      <TableContainer>
        <Table variant="simple">
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

  if (isError) {
    return <Center p={10}><Text color="red.500">Não foi possível carregar os dados de produtividade.</Text></Center>;
  }

  if (!data || data.length === 0) {
    return (
      <Center p={10}>
        <Text color="gray.500">Nenhuma venda encontrada para os vendedores no período selecionado.</Text>
      </Center>
    );
  }

  return (
    <TableContainer>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Vendedor</Th>
            <Th isNumeric>Nº de Vendas</Th>
            <Th isNumeric>Valor Total Vendido (R$)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((vendedor, index) => (
            <Tr key={vendedor.vendedorId}>
              <Td fontWeight="bold" color="gray.500">{index + 1}</Td>
              <Td>
                <HStack>
                  <Avatar size="sm" name={vendedor.nome} />
                  <Text fontWeight="medium">{vendedor.nome}</Text>
                </HStack>
              </Td>
              <Td isNumeric>{vendedor.numeroDeVendas}</Td>
              <Td isNumeric fontWeight="bold" color="green.500">{formatCurrency(vendedor.valorTotalVendido)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

// Remova a exportação default se houver
// export default SellerProductivityTable;
