import {
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Heading,
  Spacer,
} from '@chakra-ui/react';
// ======================= INÍCIO DA ALTERAÇÃO =======================
// Trocamos os ícones do 'react-icons/fi' para 'react-icons/bs'
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from 'react-icons/bs';
import { FiMoon, FiSun } from 'react-icons/fi';
// ======================== FIM DA ALTERAÇÃO =========================
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const routeTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/movimentacoes': 'Movimentações',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos',
  '/fornecedores': 'Fornecedores',
  '/utilizadores': 'Gestão de Utilizadores',
};

export const Header = ({ onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();

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
        {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
        <IconButton
          aria-label="Toggle Sidebar"
          // Usando os novos ícones que são visualmente idênticos à referência
          icon={isSidebarOpen ? <BsLayoutSidebarInset /> : <BsLayoutSidebarInsetReverse />}
          onClick={onToggleSidebar}
          variant="ghost"
          mr={3}
          fontSize="20px" // Ajuste opcional de tamanho
        />
        {/* ======================== FIM DA ALTERAÇÃO ========================= */}
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
