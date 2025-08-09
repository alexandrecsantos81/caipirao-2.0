import {
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Heading,
  Spacer,
} from '@chakra-ui/react';
import { FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void; // Função para abrir/fechar a sidebar
}

// Mapeia as rotas para títulos amigáveis
const routeTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/movimentacoes': 'Movimentações',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos',
  '/fornecedores': 'Fornecedores',
  '/utilizadores': 'Gestão de Utilizadores',
};

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();

  // Pega o título da rota atual ou usa um padrão
  const pageTitle = routeTitles[location.pathname] || 'Caipirão 3.0';

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      px="4"
      py="2"
      bg={useColorModeValue('white', 'gray.800')}
      borderBottomWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      h="14"
    >
      <Flex align="center">
        <IconButton
          aria-label="Toggle Sidebar"
          icon={<FiMenu />}
          onClick={onToggleSidebar}
          variant="ghost"
          mr={3}
        />
        <Heading as="h1" size="md">
          {pageTitle}
        </Heading>
      </Flex>

      <Spacer />

      <IconButton
        aria-label="Toggle Theme"
        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        variant="ghost"
      />
    </Flex>
  );
};
