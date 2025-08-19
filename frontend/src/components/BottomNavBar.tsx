// frontend/src/components/BottomNavBar.tsx

import {
  Box,
  Flex,
  Icon,
  Text,
  useColorModeValue,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FiHome,
  FiShoppingCart,
  FiBarChart2,
  FiUsers,
  FiLogOut,
  FiBox,
  FiTruck,
  FiGrid,
  FiUserCheck,
  FiCreditCard,
  FiBriefcase,
  FiTrendingUp, // 1. Importar o novo ícone
} from 'react-icons/fi';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const NavItem = ({ icon, label, to }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeColor = 'white';
  const inactiveColor = useColorModeValue('whiteAlpha.700', 'whiteAlpha.600');
  const hoverColor = 'white';

  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flex="1"
      py={2}
      color={isActive ? activeColor : inactiveColor}
      fontWeight={isActive ? 'bold' : 'normal'}
      _hover={{ textDecoration: 'none', color: hoverColor }}
      transition="color 0.2s ease-in-out"
    >
      <Icon as={icon} fontSize="2xl" />
      <Text fontSize="xs" mt={1}>
        {label}
      </Text>
    </ChakraLink>
  );
};

export const BottomNavBar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const bgColor = useColorModeValue('blue.500', 'blue.800');
  const borderColor = useColorModeValue('blue.600', 'blue.900');
  const iconColor = useColorModeValue('whiteAlpha.700', 'whiteAlpha.600');

  return (
    <Box
      as="nav"
      pos="fixed"
      bottom="0"
      left="0"
      right="0"
      bg={bgColor}
      borderTopWidth="1px"
      borderColor={borderColor}
      zIndex="sticky"
      display={{ base: 'block', md: 'none' }}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.15)"
    >
      <Flex align="center" justify="space-around" h="60px">
        {/* 2. Renderização condicional dos itens da barra */}
        {!isAdmin && <NavItem icon={FiTrendingUp} label="Desempenho" to="/meu-dashboard" />}
        <NavItem icon={FiShoppingCart} label="Vendas" to="/movimentacoes" />
        <NavItem icon={FiUsers} label="Clientes" to="/clientes" />
        <NavItem icon={FiBox} label="Produtos" to="/produtos" />

        {isAdmin ? (
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Mais opções"
              icon={<FiGrid />}
              variant="ghost"
              fontSize="2xl"
              color={iconColor}
              _hover={{ bg: useColorModeValue('blue.600', 'blue.700') }}
              flex={1}
              h="full"
              py={2}
            />
            <MenuList>
              <MenuItem as={RouterLink} to="/dashboard" icon={<FiHome />}>Dashboard</MenuItem>
              <MenuItem as={RouterLink} to="/relatorios" icon={<FiBarChart2 />}>Relatórios</MenuItem>
              <MenuItem as={RouterLink} to="/financas" icon={<FiCreditCard />}>Finanças</MenuItem>
              <MenuItem as={RouterLink} to="/fornecedores" icon={<FiTruck />}>Fornecedores</MenuItem>
              <MenuItem as={RouterLink} to="/utilizadores" icon={<FiUserCheck />}>Utilizadores</MenuItem>
              <MenuItem as={RouterLink} to="/empresa" icon={<FiBriefcase />}>Minha Empresa</MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={logout}>Sair</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <ChakraLink
            onClick={logout}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            flex="1"
            py={2}
            color={iconColor}
          >
            <Icon as={FiLogOut} fontSize="2xl" />
            <Text fontSize="xs" mt={1}>Sair</Text>
          </ChakraLink>
        )}
      </Flex>
    </Box>
  );
};
