import {
  Box,
  Center,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Text,
  useBreakpointValue,
  Divider,
  HStack,
  VStack,
  Badge,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { FixedSizeList } from 'react-window';
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
  const listRef = useRef<FixedSizeList>(null);

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

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [data]);

  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (isLoading && !data) return <Center p={10}><Spinner size="xl" /></Center>;
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as despesas.</Text></Center>;

  if (isMobile) {
    // ... (código mobile permanece o mesmo)
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
                      <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(despesa)} isDisabled={despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')} />
                    </Tooltip>
                    <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(despesa.id)} />
                  </HStack>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.400" mt={1}>{despesa.tipo_saida}</Text>
              <Divider my={2} />
              <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Data da Compra:</Text><Text>{new Date(despesa.data_compra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text></HStack>
              <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Vencimento:</Text><Text>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text></HStack>
              <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Status:</Text><Badge colorScheme={despesa.data_pagamento ? 'green' : 'orange'}>{despesa.data_pagamento ? 'Pago' : 'Pendente'}</Badge></HStack>
              <HStack justify="space-between" mt={2}><Text fontWeight="bold">Valor:</Text><Text fontWeight="bold" color="red.500">{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></HStack>
            </Box>
          ))}
        </VStack>
        <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
      </>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const despesa = data!.dados[index];
    return (
      <Flex style={style} align="center" _hover={{ bg: rowHoverBg }} borderBottomWidth="1px" borderColor={borderColor}>
        <Text width="12%" px={4} isTruncated>{new Date(despesa.data_compra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
        <Text width="12%" px={4} isTruncated>{new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
        <Text width="31%" px={4} isTruncated title={despesa.discriminacao}>{despesa.discriminacao}</Text>
        <Text width="15%" px={4} isTruncated>{despesa.tipo_saida}</Text>
        <Box width="10%" px={4}><Badge colorScheme={despesa.data_pagamento ? 'green' : 'orange'}>{despesa.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Box>
        <Flex width="10%" px={4} justify="flex-end"><Text isTruncated>{despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Flex>
        <Flex width="10%" px={4} justify="flex-start">
          {isAdmin && (
            <HStack spacing={2}>
              <Tooltip label="Não é possível editar um registro de pagamento parcial" isDisabled={!despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')}>
                <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(despesa)} isDisabled={despesa.discriminacao.startsWith('PAGAMENTO PARCIAL')} />
              </Tooltip>
              <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(despesa.id)} />
            </HStack>
          )}
        </Flex>
      </Flex>
    );
  };

  return (
    <>
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        {/* Cabeçalho da Tabela */}
        <Flex bg={headerBg} borderBottomWidth="1px" fontWeight="bold" role="row" pr="15px">
          <Text width="12%" p={4}>Data da Compra</Text>
          <Text width="12%" p={4}>Vencimento</Text>
          <Text width="31%" p={4}>Discriminação</Text>
          <Text width="15%" p={4}>Tipo</Text>
          <Text width="10%" p={4}>Status</Text>
          <Text width="10%" p={4} textAlign="right">Valor</Text>
          <Text width="10%" p={4}>Ações</Text>
        </Flex>

        {/* Corpo Virtualizado */}
        {data?.dados && data.dados.length > 0 ? (
          <FixedSizeList
            height={500}
            itemCount={data.dados.length}
            itemSize={62}
            width="100%"
            ref={listRef}
          >
            {Row}
          </FixedSizeList>
        ) : (
          <Center p={10}><Text>Nenhuma despesa encontrada.</Text></Center>
        )}
      </Box>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};
