// frontend/src/components/Sidebar.tsx

import {
  Avatar,
  Badge,
  Box,
  Divider,
  Flex,
  Heading,
  Icon,
  Link as ChakraLink,
  Stack,
  Text, // Re-adicionado para o nome do usuário
  useColorModeValue,
} from '@chakra-ui/react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiBox,
  FiShoppingCart,
  FiBarChart2,
  FiTruck,
  FiUserCheck,
  FiCreditCard,
  FiBriefcase,
  FiLogOut,
  FiClipboard, // 1. Ícone do cabeçalho re-adicionado
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

// Componente NavItem com os estilos originais restaurados
const NavItem = ({ icon, to, children }: { icon: React.ElementType; to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeBg = useColorModeValue('teal.400', 'teal.600');
  const activeColor = 'white';
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      p={3}
      display="flex"
      alignItems="center"
      borderRadius="md"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : inactiveColor}
      fontWeight={isActive ? 'bold' : 'normal'}
      _hover={{
        textDecoration: 'none',
        bg: isActive ? activeBg : hoverBg, // 4. Efeito hover restaurado
      }}
      role="group"
    >
      <Icon as={icon} fontSize="xl" mr={3} />
      {children}
    </ChakraLink>
  );
};

// Componente principal da Sidebar
export const Sidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      w={isCollapsed ? '72px' : '240px'}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      transition="width 0.2s ease-in-out"
      overflowY="auto"
      display={{ base: 'none', md: 'block' }}
    >
      <Flex direction="column" p={isCollapsed ? 2 : 4} h="full">
        {/* 1. Cabeçalho com Ícone e Título */}
        <Flex align="center" mb={4} pl={isCollapsed ? 0 : 1} justify={isCollapsed ? 'center' : 'flex-start'}>
          <Icon as={FiClipboard} fontSize="2xl" color="teal.500" />
          {!isCollapsed && (
            <Heading size="md" ml={3}>
              Caipirão 3.0
            </Heading>
          )}
        </Flex>
        <Divider mb={4} />

        {/* Links Principais (Vendas) */}
        <Stack spacing={2}>
          <NavItem icon={FiShoppingCart} to="/movimentacoes">Movimentações</NavItem>
          <NavItem icon={FiUsers} to="/clientes">Clientes</NavItem>
          <NavItem icon={FiBox} to="/produtos">Produtos</NavItem>
        </Stack>

        {/* Seção de Administração */}
        {isAdmin && (
          <Stack spacing={2} mt={8}>
            <Heading size="xs" textTransform="uppercase" color="gray.500" pl={3}>
              Admin
            </Heading>
            <NavItem icon={FiHome} to="/dashboard">Dashboard</NavItem>
            <NavItem icon={FiBarChart2} to="/relatorios">Relatórios</NavItem>
            <NavItem icon={FiTruck} to="/fornecedores">Fornecedores</NavItem>
            <NavItem icon={FiUserCheck} to="/utilizadores">Utilizadores</NavItem>
            <NavItem icon={FiBriefcase} to="/empresa">Minha Empresa</NavItem>
          </Stack>
        )}

        {/* 3. Seção de Gestão Pessoal (separada) */}
        {isAdmin && (
            <Stack spacing={2} mt={8}>
                <Heading size="xs" textTransform="uppercase" color="gray.500" pl={3}>
                    Gestão Pessoal
                </Heading>
                <NavItem icon={FiCreditCard} to="/financas">Finanças</NavItem>
            </Stack>
        )}

        {/* Espaçador para empurrar o perfil do usuário para baixo */}
        <Box flex="1" />

        {/* 2. Perfil do Usuário Logado */}
        <Box mt={8}>
          <Divider mb={4} />
          <Flex align="center" p={2}>
            <Avatar size="sm" name={user?.nome} />
            {!isCollapsed && (
              <Box ml={3}>
                <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{user?.nome}</Text>
                <Badge colorScheme={user?.perfil === 'ADMIN' ? 'red' : 'green'} fontSize="2xs">
                  {user?.perfil}
                </Badge>
              </Box>
            )}
          </Flex>
          <ChakraLink
            onClick={logout}
            p={3}
            mt={2}
            display="flex"
            alignItems="center"
            borderRadius="md"
            _hover={{ bg: useColorModeValue('red.50', 'red.900'), color: useColorModeValue('red.600', 'red.200') }}
          >
            <Icon as={FiLogOut} fontSize="xl" mr={3} />
            {!isCollapsed && 'Sair'}
          </ChakraLink>
        </Box>
      </Flex>
    </Box>
  );
};
