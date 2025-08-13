import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Text, Center, Spinner, VStack, HStack, Icon, Link, Badge, useColorModeValue
} from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';
import { IClientAnalysisResponse } from '@/services/report.service';

interface ClientAnalysisProps {
  data: IClientAnalysisResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nunca';
  // Garante que a data seja interpretada corretamente, sem problemas de fuso horário
  const date = new Date(`${dateString.split('T')[0]}T00:00:00`);
  return date.toLocaleDateString('pt-BR');
};

const openWhatsApp = (phone: string) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, '');
  // Adiciona o código do país (55 para o Brasil) se não estiver presente
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('55' ) ? cleanPhone : '55' + cleanPhone}`;
  window.open(whatsappUrl, '_blank');
};

export const ClientAnalysis = ({ data, isLoading, isError }: ClientAnalysisProps) => {
  const tableBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return <Center p={10}><Spinner size="xl" /></Center>;
  }

  if (isError) {
    return <Center p={10}><Text color="red.500">Não foi possível carregar os dados de análise.</Text></Center>;
  }

  if (!data) {
    return <Center p={10}><Text color={textColor}>Nenhum dado de cliente para analisar.</Text></Center>;
  }

  return (
    <VStack spacing={8} align="stretch" mt={6}>
      {/* Seção de Clientes Ativos */}
      <Box>
        <HStack mb={4} spacing={3}>
          <Heading size="md">Clientes Ativos</Heading>
          <Badge colorScheme="green" fontSize="md" px={3} py={1} borderRadius="full">{data.ativos.length}</Badge>
        </HStack>
        <Text color={textColor} mt={-3} mb={4}>Clientes que realizaram compras nos últimos 90 dias.</Text>
        <TableContainer borderWidth={1} borderRadius="md" bg={tableBg}>
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
                    <Td fontWeight="medium">{cliente.nome}</Td>
                    <Td>{formatDate(cliente.data_ultima_compra)}</Td>
                    <Td>
                      <Link onClick={() => openWhatsApp(cliente.telefone)} color="teal.500" display="flex" alignItems="center" _hover={{ textDecoration: 'underline' }}>
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
        <HStack mb={4} spacing={3}>
          <Heading size="md">Clientes Inativos</Heading>
          <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">{data.inativos.length}</Badge>
        </HStack>
        <Text color={textColor} mt={-3} mb={4}>Clientes que não compram há mais de 90 dias ou nunca compraram.</Text>
        <TableContainer borderWidth={1} borderRadius="md" bg={tableBg}>
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
                    <Td fontWeight="medium">{cliente.nome}</Td>
                    <Td>{formatDate(cliente.data_ultima_compra)}</Td>
                    <Td>
                      <Link onClick={() => openWhatsApp(cliente.telefone)} color="teal.500" display="flex" alignItems="center" _hover={{ textDecoration: 'underline' }}>
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
