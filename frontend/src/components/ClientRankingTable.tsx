// src/components/ClientRankingTable.tsx

import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Skeleton, Text, Center
} from '@chakra-ui/react';
import { IClientRankingItem } from '@/services/report.service';

interface ClientRankingTableProps {
  data: IClientRankingItem[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const ClientRankingTable = ({ data, isLoading }: ClientRankingTableProps) => {
  // Se estiver carregando, exibe 5 linhas de esqueleto
  if (isLoading) {
    return (
      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>#</Th>
              <Th>Cliente</Th>
              <Th>Contato</Th>
              <Th isNumeric>Total de Compras</Th>
              <Th isNumeric>Valor Gasto (R$)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <Tr key={index}>
                <Td><Skeleton height="20px" /></Td>
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
        <Text color="gray.500">Nenhum cliente realizou compras no período selecionado.</Text>
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
            <Th>Cliente</Th>
            <Th>Contato</Th>
            <Th isNumeric>Total de Compras</Th>
            <Th isNumeric>Valor Gasto (R$)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((cliente, index) => (
            <Tr key={cliente.clienteId}>
              <Td>{index + 1}</Td>
              <Td>{cliente.nome}</Td>
              <Td>{cliente.telefone}</Td>
              <Td isNumeric>{cliente.totalCompras}</Td>
              <Td isNumeric>{formatCurrency(cliente.valorTotalGasto)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
