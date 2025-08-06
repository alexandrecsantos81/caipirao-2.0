// frontend/src/pages/Clientes.tsx

import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
// frontend/src/pages/Clientes.tsx - Linha corrigida
import { useEffect, useState } from 'react';


// Interface para tipar os dados do cliente
interface ICliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

// Componente da página de Clientes
const Clientes = () => {
  const [clientes, setClientes] = useState<ICliente[]>([]);
  const toast = useToast();

  // Simulação de busca de dados. Substitua pela sua lógica de API quando tiver.
  useEffect(() => {
    // Dados de exemplo
    const dadosExemplo: ICliente[] = [
      { id: 1, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(11) 98765-4321' },
      { id: 2, nome: 'Maria Oliveira', email: 'maria.oliveira@email.com', telefone: '(21) 91234-5678' },
    ];
    setClientes(dadosExemplo);
  }, []);

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Clientes</Heading>
        <Button 
          colorScheme="teal" 
          onClick={() => toast({ title: 'Funcionalidade a ser implementada!', status: 'info' })}
        >
          Novo Cliente
        </Button>
      </Flex>

      {clientes.length === 0 ? (
        <Text>Nenhum cliente encontrado.</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {clientes.map((cliente) => (
              <Tr key={cliente.id}>
                <Td>{cliente.nome}</Td>
                <Td>{cliente.email}</Td>
                <Td>{cliente.telefone}</Td>
                <Td>
                  {/* Botões de ação de exemplo */}
                  <Button size="sm" mr={2}>Editar</Button>
                  <Button size="sm" colorScheme="red">Deletar</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

// A linha mais importante: exporta o componente como padrão.
export default Clientes;
