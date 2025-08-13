// frontend/src/components/Header.tsx

import {
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Heading,
  Spacer,
  useBreakpointValue,
} from '@chakra-ui/react';
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from 'react-icons/bs';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const routeTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/movimentacoes': 'Movimentações',
  '/relatorios': 'Relatórios Gerenciais',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos',
  '/fornecedores': 'Fornecedores',
  '/utilizadores': 'Gestão de Utilizadores',
};

export const Header = ({ onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const pageTitle = routeTitles[location.pathname] || 'Caipirão 3.0';

  return (
    // ✅ O Flex do Header agora ocupa a largura total disponível
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full" // Ocupa a largura total do seu container pai
      px="4"
      bg={useColorModeValue('white', 'gray.800')}
      borderBottomWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      h="14"
    >
      <Flex align="center">
        {/* O botão de toggle só aparece em telas de desktop */}
        {!isMobile && (
          <IconButton
            aria-label="Toggle Sidebar"
            icon={isSidebarOpen ? <BsLayoutSidebarInset /> : <BsLayoutSidebarInsetReverse />}
            onClick={onToggleSidebar}
            variant="ghost"
            mr={3}
            fontSize="20px"
          />
        )}
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
