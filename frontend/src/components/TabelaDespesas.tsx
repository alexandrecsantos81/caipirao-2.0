import {
  Box, Center, Flex, Heading, IconButton, Spinner,
  Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr,
  useBreakpointValue,
  Divider,
  HStack,
  VStack,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

import { Pagination } from './Pagination';
import { IDespesa, getDespesas } from '../services/despesa.service';
import { useAuth } from '../hooks/useAuth';

interface TabelaDespesasProps {
  onEdit: (despesa: IDespesa) => void;
  onDelete: (id: number) => void;
  buscaDebounced: string;
}

export const TabelaDespesas = ({ onEdit, onDelete, buscaDebounced }: TabelaDespesasProps) => {
  const [pagina, setPagina] = useState(1);
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (buscaDebounced) {
      setPagina(1);
    }
  }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['despesas', pagina, buscaDebounced],
    queryFn: () => getDespesas(pagina, 50, buscaDebounced),
    placeholderData: keepPreviousData,
  });

  if (isLoading && !data) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as despesas.</Text></Center>;

  if (isMobile) {
    return (
      <>
        <VStack spacing={4} align="stretch" mt={4}>
          {data?.dados.map((despesa: IDespesa) => (
            <Box key={despesa.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
              <Flex justify="space-between" align="center">
                <Heading size="sm" noOfLines={1}>{despesa.discriminacao}</Heading>
                {isAdmin && (
                  <HStack spacing={1}>
                    <Tooltip label="Não é possível editar um registro de pagamento parcial" isDisabled={!despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')}>
                      <IconButton
                        aria-label="Editar"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => onEdit(despesa)}
                        isDisabled={despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')}
                      />
                    </Tooltip>
                    <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(despesa.id)} />
                  </HStack>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.400" mt={1}>{despesa.tipo_saida}</Text>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">Data da Compra:</Text>
                <Text>{new Date(despesa.data_compra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">Vencimento:</Text>
                <Text>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">Status:</Text>
                <Badge colorScheme={despesa.data_pagamento ? 'green' : 'orange'}>
                  {despesa.data_pagamento ? 'Pago' : 'Pendente'}
                </Badge>
              </HStack>
              <HStack justify="space-between" mt={2}>
                <Text fontWeight="bold">Valor:</Text>
                <Text fontWeight="bold" color="red.500">
                  {despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </HStack>
            </Box>
          ))}
        </VStack>
        <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
      </>
    );
  }

  return (
    <>
      <TableContainer>
        <Table variant="striped" __css={{ 'opacity': isLoading ? 0.6 : 1 }}>
          <Thead><Tr><Th>Data da Compra</Th><Th>Vencimento</Th><Th>Discriminação</Th><Th>Tipo</Th><Th>Status</Th><Th isNumeric>Valor</Th>{isAdmin && <Th>Ações</Th>}</Tr></Thead>
          <Tbody>
            {data?.dados.map((despesa: IDespesa) => (
              <Tr key={despesa.id}>
                <Td>{new Date(despesa.data_compra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                <Td>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
                <Td>{despesa.discriminacao}</Td>
                <Td>{despesa.tipo_saida}</Td>
                <Td><Badge colorScheme={despesa.data_pagamento ? 'green' : 'orange'}>{despesa.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Td>
                <Td isNumeric>{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                {isAdmin && (<Td><HStack spacing={2}>
                  <Tooltip label="Não é possível editar um registro de pagamento parcial" isDisabled={!despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')}>
                    <IconButton
                      aria-label="Editar"
                      icon={<FiEdit />}
                      onClick={() => onEdit(despesa)}
                      isDisabled={despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')}
                    />
                  </Tooltip>
                  <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(despesa.id)} />
                </HStack></Td>)}
              </Tr>
            ))}</Tbody>
        </Table>
      </TableContainer>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};
