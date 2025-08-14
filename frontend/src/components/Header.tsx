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
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      px="4"
      // A cor de fundo é transparente para herdar do container pai
      bg="transparent" 
      // ✅ A borda foi removida, pois o container pai agora tem sombra
      borderBottomWidth="0px" 
      h="14"
    >
      <Flex align="center">
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
