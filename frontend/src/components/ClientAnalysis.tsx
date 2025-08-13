// frontend/src/components/ClientAnalysis.tsx

import {
  Box, Heading,
  // ✅ REVERSÃO: Importando os componentes de tabela individualmente
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Text,
  Center, Spinner, VStack, HStack, Icon, Link, Badge
} from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';
import { IClientAnalysisResponse } from '@/services/report.service';

interface ClientAnalysisProps {
  data: IClientAnalysisResponse | undefined;
  isLoading: boolean;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nunca';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const ClientAnalysis = ({ data, isLoading }: ClientAnalysisProps) => {
  if (isLoading) {
    return <Center p={10}><Spinner size="xl" /></Center>;
  }

  if (!data) {
    return <Center p={10}><Text color="gray.500">Não foi possível carregar os dados de análise.</Text></Center>;
  }

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank'  );
  };

  return (
    // ✅ REVERSÃO: Usando a prop 'spacing' diretamente
    <VStack spacing={8} align="stretch">
      {/* Seção de Clientes Ativos */}
      <Box>
        <HStack mb={4}>
          <Heading size="md">Clientes Ativos</Heading>
          <Badge colorScheme="green" fontSize="md">{data.ativos.length}</Badge>
        </HStack>
        <Text color="gray.500" mt={-3} mb={4}>Clientes que realizaram compras nos últimos 90 dias.</Text>
        {/* ✅ REVERSÃO: Estrutura da Tabela da v2 */}
        <TableContainer borderWidth={1} borderRadius="md">
          <Table variant="simple">
            <Thead>
              <Tr><Th>Nome</Th><Th>Última Compra</Th><Th>Contato</Th></Tr>
            </Thead>
            <Tbody>
              {data.ativos.length === 0 ? (
                <Tr><Td colSpan={3} textAlign="center">Nenhum cliente ativo encontrado.</Td></Tr>
              ) : (
                data.ativos.map((cliente) => (
                  <Tr key={`ativo-${cliente.clienteId}`}>
                    <Td>{cliente.nome}</Td>
                    <Td>{formatDate(cliente.data_ultima_compra)}</Td>
                    <Td>
                      <Link onClick={() => openWhatsApp(cliente.telefone)} color="teal.500" display="flex" alignItems="center">
                        <Icon as={FaWhatsapp} mr={2} /> {cliente.telefone}
                      </Link>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Seção de Clientes Inativos */}
      <Box>
        <HStack mb={4}>
          <Heading size="md">Clientes Inativos</Heading>
          <Badge colorScheme="red" fontSize="md">{data.inativos.length}</Badge>
        </HStack>
        <Text color="gray.500" mt={-3} mb={4}>Clientes que não compram há mais de 90 dias ou nunca compraram.</Text>
        <TableContainer borderWidth={1} borderRadius="md">
          <Table variant="simple">
            <Thead>
              <Tr><Th>Nome</Th><Th>Última Compra</Th><Th>Contato</Th></Tr>
            </Thead>
            <Tbody>
              {data.inativos.length === 0 ? (
                <Tr><Td colSpan={3} textAlign="center">Nenhum cliente inativo encontrado.</Td></Tr>
              ) : (
                data.inativos.map((cliente) => (
                  <Tr key={`inativo-${cliente.clienteId}`}>
                    <Td>{cliente.nome}</Td>
                    <Td>{formatDate(cliente.data_ultima_compra)}</Td>
                    <Td>
                      <Link onClick={() => openWhatsApp(cliente.telefone)} color="teal.500" display="flex" alignItems="center">
                        <Icon as={FaWhatsapp} mr={2} /> {cliente.telefone}
                      </Link>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </VStack>
  );
};
