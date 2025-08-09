// frontend/src/components/Pagination.tsx

import { Button, Flex, Text } from '@chakra-ui/react';

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ paginaAtual, totalPaginas, onPageChange }: PaginationProps) => {
  return (
    <Flex justify="space-between" align="center" mt={6}>
      <Button
        onClick={() => onPageChange(paginaAtual - 1)}
        isDisabled={paginaAtual <= 1}
      >
        Anterior
      </Button>
      <Text>
        Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
      </Text>
      <Button
        onClick={() => onPageChange(paginaAtual + 1)}
        isDisabled={paginaAtual >= totalPaginas}
      >
        Próxima
      </Button>
    </Flex>
  );
};
