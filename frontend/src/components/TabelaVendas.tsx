// frontend/src/components/TabelaVendas.tsx

import {
  Box,
  Center,
  Spinner,
  Text,
  useBreakpointValue,
  HStack,
  // VStack, // <-- REMOVA ESTA LINHA
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
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { FiEdit, FiTrash2, FiFileText } from 'react-icons/fi';

import { Pagination } from './Pagination';
import { IVenda, getVendas } from '../services/venda.service';

// ... o resto do arquivo permanece o mesmo ...
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
  if (!data?.dados || data.dados.length === 0) {
    return <Center p={10}><Text>Nenhuma venda encontrada.</Text></Center>;
  }

  const RowDesktop = ({ index, style }: ListChildComponentProps) => {
    const venda = data!.dados[index];
    return (
      <Flex style={style} align="center" _hover={{ bg: rowHoverBg }} borderBottomWidth="1px" borderColor={borderColor}>
        <Text width="15%" px={4} isTruncated>{new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Text>
        <Text width="35%" px={4} isTruncated title={venda.cliente_nome}>{venda.cliente_nome}</Text>
        <Text width="15%" px={4} isTruncated>{venda.opcao_pagamento}</Text>
        <Box width="10%" px={4}><Badge colorScheme={venda.data_pagamento ? 'green' : 'red'}>{venda.data_pagamento ? 'Pago' : 'Pendente'}</Badge></Box>
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

  const RowMobile = ({ index, style }: ListChildComponentProps) => {
    const venda = data!.dados[index];
    return (
      <Box style={style} px={2} py={2}>
        <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
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
      </Box>
    );
  };

  return (
    <>
      {isMobile ? (
        <FixedSizeList
          height={600}
          itemCount={data.dados.length}
          itemSize={155}
          width="100%"
          ref={listRef}
        >
          {RowMobile}
        </FixedSizeList>
      ) : (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
          <Flex bg={headerBg} borderBottomWidth="1px" fontWeight="bold" role="row" pr="15px">
            <Text width="15%" p={4}>Data</Text>
            <Text width="35%" p={4}>Cliente</Text>
            <Text width="15%" p={4}>Pagamento</Text>
            <Text width="10%" p={4}>Status</Text>
            <Text width="15%" p={4} textAlign="right">Valor</Text>
            <Text width="10%" p={4}>Ações</Text>
          </Flex>
          <FixedSizeList
            height={600}
            itemCount={data.dados.length}
            itemSize={62}
            width="100%"
            ref={listRef}
          >
            {RowDesktop}
          </FixedSizeList>
        </Box>
      )}
      <Pagination paginaAtual={data.pagina} totalPaginas={data.totalPaginas} onPageChange={setPagina} />
    </>
  );
};
