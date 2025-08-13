// src/components/StockEntriesTable.tsx

import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Skeleton, Text, Center, Tooltip
} from '@chakra-ui/react';
import { IStockEntryReportItem } from '@/services/report.service';

interface StockEntriesTableProps {
  data: IStockEntryReportItem[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const StockEntriesTable = ({ data, isLoading }: StockEntriesTableProps) => {
  if (isLoading) {
    return (
      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>Data</Th>
              <Th>Produto</Th>
              <Th>Responsável</Th>
              <Th isNumeric>Qtd. Adicionada</Th>
              <Th isNumeric>Custo Total</Th>
              <Th>Observações</Th>
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
                <Td><Skeleton height="20px" /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Center p={10}>
        <Text color="gray.500">Nenhuma entrada de estoque registrada no período selecionado.</Text>
      </Center>
    );
  }

  return (
    <TableContainer>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>Data</Th>
            <Th>Produto</Th>
            <Th>Responsável</Th>
            <Th isNumeric>Qtd. Adicionada</Th>
            <Th isNumeric>Custo Total</Th>
            <Th>Observações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((entry) => (
            <Tr key={entry.id}>
              <Td>{formatDate(entry.data_entrada)}</Td>
              <Td>{entry.produto_nome}</Td>
              <Td>{entry.responsavel_nome}</Td>
              <Td isNumeric>{entry.quantidade_adicionada}</Td>
              <Td isNumeric>{formatCurrency(entry.custo_total)}</Td>
              <Td>
                <Tooltip label={entry.observacao || ''} placement="top" hasArrow>
                  <Text isTruncated maxW="150px">
                    {entry.observacao || '---'}
                  </Text>
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
