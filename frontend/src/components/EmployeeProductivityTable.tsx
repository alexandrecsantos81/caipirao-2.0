import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Skeleton, Text, Center
  // A importação do 'Box' foi removida desta linha
} from '@chakra-ui/react';
import { IEmployeeProductivityItem } from '@/services/report.service';

interface EmployeeProductivityTableProps {
  data: IEmployeeProductivityItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const EmployeeProductivityTable = ({ data, isLoading, isError }: EmployeeProductivityTableProps) => {
  if (isLoading) {
    return (
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr><Th>Funcionário</Th><Th>Data</Th><Th>Discriminação</Th><Th isNumeric>Valor Pago</Th></Tr>
          </Thead>
          <Tbody>
            {Array.from({ length: 10 }).map((_, index) => (
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
        <Text color="gray.500">Nenhum lançamento de "ABATE" encontrado no período selecionado.</Text>
      </Center>
    );
  }

  return (
    <TableContainer>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>Funcionário</Th>
            <Th>Data do Serviço</Th>
            <Th>Discriminação do Lançamento</Th>
            <Th isNumeric>Valor Pago (R$)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item) => (
            <Tr key={item.id}>
              <Td fontWeight="medium">{item.funcionario_nome}</Td>
              <Td>{formatDate(item.data_compra)}</Td>
              <Td>{item.discriminacao}</Td>
              <Td isNumeric color="green.500" fontWeight="bold">{formatCurrency(item.valor)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
