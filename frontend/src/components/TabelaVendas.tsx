import {
  Box, Button, Center, Flex, Heading, IconButton, Spinner,
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
import { FiEdit, FiTrash2, FiFileText } from 'react-icons/fi';

import { Pagination } from './Pagination';
import { IVenda, getVendas } from '../services/venda.service';

interface TabelaVendasProps {
  onEdit: (venda: IVenda) => void;
  onDelete: (id: number) => void;
  onGeneratePdf: (id: number) => void;
  buscaDebounced: string;
}

export const TabelaVendas = ({ onEdit, onDelete, onGeneratePdf, buscaDebounced }: TabelaVendasProps) => {
  const [pagina, setPagina] = useState(1);
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (buscaDebounced) {
      setPagina(1);
    }
  }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendas', pagina, buscaDebounced],
    queryFn: () => getVendas(pagina, 50, buscaDebounced),
    placeholderData: keepPreviousData
  });

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as vendas.</Text></Center>;

  if (isMobile) {
    return (
      <>
        <VStack spacing={4} align="stretch" mt={4}>
          {data?.dados.map((venda: IVenda) => (
            <Box key={venda.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
              <Flex justify="space-between" align="center">
                <Heading size="sm" noOfLines={1}>{venda.cliente_nome}</Heading>
                <HStack spacing={1}>
                  <Tooltip label="Gerar PDF" hasArrow>
                    <IconButton aria-label="Gerar PDF" icon={<FiFileText />} size="sm" colorScheme="blue" onClick={() => onGeneratePdf(venda.id)} />
                  </Tooltip>
                  <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(venda)} />
                  <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(venda.id)} />
                </HStack>
              </Flex>
              <Divider my={2} />
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">Data:</Text>
                <Text>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">Status:</Text>
                <Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>
                  {venda.data_pagamento ? 'Pago' : 'Pendente'}
                </Badge>
              </HStack>
              <HStack justify="space-between" mt={2}>
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold" color="teal.500">
                  {venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
        <Table variant="striped">
          <Thead><Tr><Th>Data</Th><Th>Cliente</Th><Th>Pagamento</Th><Th>Status</Th><Th isNumeric>Valor</Th><Th>Ações</Th></Tr></Thead>
          <Tbody>{data?.dados.map((venda: IVenda) => (<Tr key={venda.id}>
            <Td>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Td>
            <Td>{venda.cliente_nome}</Td>
            <Td>{venda.opcao_pagamento}</Td>
            <Td><Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>{venda.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Td>
            <Td isNumeric>{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
            <Td><HStack spacing={2}>
              <Tooltip label="Gerar PDF" hasArrow>
                <IconButton aria-label="Gerar PDF" icon={<FiFileText />} size="sm" colorScheme="blue" onClick={() => onGeneratePdf(venda.id)} />
              </Tooltip>
              <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(venda)} />
              <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(venda.id)} />
            </HStack></Td>
          </Tr>))}</Tbody>
        </Table>
      </TableContainer>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};
