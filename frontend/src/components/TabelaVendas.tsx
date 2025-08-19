import {
  Box,
  Center,
  Spinner,
  Text,
  useBreakpointValue,
  HStack,
  VStack,
  Badge,
  Tooltip,
  IconButton,
  Flex,
  Heading,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { FixedSizeList } from 'react-window';
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
  const listRef = useRef<FixedSizeList>(null);

  useEffect(() => {
    if (buscaDebounced) {
      setPagina(1);
    }
  }, [buscaDebounced]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendas', pagina, buscaDebounced],
    queryFn: () => getVendas(pagina, 50, buscaDebounced),
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
  if (isError) return <Center p={10}><Text color="red.500">Não foi possível carregar as vendas.</Text></Center>;

  if (isMobile) {
    // ... (código mobile permanece o mesmo)
    return (
      <>
        <VStack spacing={4} align="stretch" mt={4}>
          {data?.dados.map((venda: IVenda) => (
            <Box key={venda.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
              <Flex justify="space-between" align="center">
                <Heading size="sm" noOfLines={1}>{venda.cliente_nome}</Heading>
                <HStack spacing={1}>
                  <Tooltip label="Gerar PDF" hasArrow><IconButton aria-label="Gerar PDF" icon={<FiFileText />} size="sm" colorScheme="blue" onClick={() => onGeneratePdf(venda.id)} /></Tooltip>
                  <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(venda)} />
                  <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(venda.id)} />
                </HStack>
              </Flex>
              <Divider my={2} />
              <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Data:</Text><Text>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text></HStack>
              <HStack justify="space-between"><Text fontSize="sm" color="gray.500">Status:</Text><Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>{venda.data_pagamento ? 'Pago' : 'Pendente'}</Badge></HStack>
              <HStack justify="space-between" mt={2}><Text fontWeight="bold">Total:</Text><Text fontWeight="bold" color="teal.500">{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></HStack>
            </Box>
          ))}
        </VStack>
        <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
      </>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const venda = data!.dados[index];
    return (
      <Flex style={style} align="center" _hover={{ bg: rowHoverBg }} borderBottomWidth="1px" borderColor={borderColor}>
        <Text width="15%" px={4} isTruncated>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
        <Text width="35%" px={4} isTruncated title={venda.cliente_nome}>{venda.cliente_nome}</Text>
        <Text width="15%" px={4} isTruncated>{venda.opcao_pagamento}</Text>
        <Box width="10%" px={4}><Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>{venda.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Box>
        {/* ✅ CORREÇÃO 2: Adicionado justify="flex-end" para alinhar o conteúdo à direita */}
        <Flex width="15%" px={4} justify="flex-end">
          <Text isTruncated>{venda.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </Flex>
        <Flex width="10%" px={4} justify="flex-start">
          <HStack spacing={2}>
            <Tooltip label="Gerar PDF" hasArrow><IconButton aria-label="Gerar PDF" icon={<FiFileText />} size="sm" colorScheme="blue" onClick={() => onGeneratePdf(venda.id)} /></Tooltip>
            <IconButton aria-label="Editar" icon={<FiEdit />} size="sm" onClick={() => onEdit(venda)} />
            <IconButton aria-label="Excluir" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => onDelete(venda.id)} />
          </HStack>
        </Flex>
      </Flex>
    );
  };

  return (
    <>
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        {/* Cabeçalho da Tabela */}
        <Flex bg={headerBg} borderBottomWidth="1px" fontWeight="bold" role="row" pr="15px">
          {/* ✅ CORREÇÃO 1: Ajuste das larguras e alinhamentos */}
          <Text width="15%" p={4}>Data</Text>
          <Text width="35%" p={4}>Cliente</Text>
          <Text width="15%" p={4}>Pagamento</Text>
          <Text width="10%" p={4}>Status</Text>
          <Text width="15%" p={4} textAlign="right">Valor</Text>
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
          <Center p={10}><Text>Nenhuma venda encontrada.</Text></Center>
        )}
      </Box>
      <Pagination paginaAtual={data?.pagina || 1} totalPaginas={data?.totalPaginas || 1} onPageChange={setPagina} />
    </>
  );
};
