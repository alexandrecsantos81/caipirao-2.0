// frontend/src/components/BottomNavBar.tsx

import {
  Box,
  Flex,
  Icon,
  Text,
  // ✅ REVERSÃO: Voltando a usar o useColorModeValue da v2
  useColorModeValue,
  Link as ChakraLink,
  // ✅ REVERSÃO: Importando os componentes de Menu individualmente, como na v2
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
  // ✅ REVERSÃO: Reintroduzindo o useColorModeValue
  const activeColor = useColorModeValue('teal.500', 'teal.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  return (
    // ✅ REVERSÃO: Usando a prop 'as' para integração com React Router, como na v2
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
      _hover={{ textDecoration: 'none', color: activeColor }}
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

  // ✅ REVERSÃO: Reintroduzindo o useColorModeValue
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
    >
      <Flex align="center" justify="space-around" h="60px">
        <NavItem icon={FiShoppingCart} label="Movim." to="/movimentacoes" />
        <NavItem icon={FiUsers} label="Clientes" to="/clientes" />
        <NavItem icon={FiBox} label="Produtos" to="/produtos" />

        {isAdmin ? (
          // ✅ REVERSÃO: Estrutura de Menu da v2
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Mais opções"
              icon={<FiGrid />}
              variant="ghost"
              fontSize="2xl"
              color={useColorModeValue('gray.600', 'gray.400')}
              flex={1}
              h="full"
              py={2}
            />
            <MenuList>
              {/* ✅ REVERSÃO: Passando 'as' e 'icon' como props, como na v2 */}
              <MenuItem as={RouterLink} to="/dashboard" icon={<FiHome />}>Dashboard</MenuItem>
              <MenuItem as={RouterLink} to="/relatorios" icon={<FiBarChart2 />}>Relatórios</MenuItem>
              <MenuItem as={RouterLink} to="/fornecedores" icon={<FiTruck />}>Fornecedores</MenuItem>
              <MenuItem as={RouterLink} to="/utilizadores" icon={<FiUserCheck />}>Utilizadores</MenuItem>
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
            color={useColorModeValue('gray.600', 'gray.400')}
          >
            <Icon as={FiLogOut} fontSize="2xl" />
            <Text fontSize="xs" mt={1}>Sair</Text>
          </ChakraLink>
        )}
      </Flex>
    </Box>
  );
};
