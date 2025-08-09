import {
  Box, VStack, Heading, Link as ChakraLink, Text, Divider, Avatar, HStack, Tag, Icon, Tooltip, useColorModeValue,
} from '@chakra-ui/react'; // <-- AQUI ESTÁ A CORREÇÃO
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome, FiShoppingCart, FiUsers, FiBox, FiDollarSign, FiLogOut, FiTruck,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isCollapsed: boolean;
}

const NavItem = ({ icon, label, to, isCollapsed }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Tooltip label={isCollapsed ? label : ''} placement="right">
      <ChakraLink
        as={RouterLink}
        to={to}
        display="flex"
        alignItems="center"
        p={3}
        mx={3}
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'teal.400' : 'transparent'}
        color={isActive ? 'white' : 'gray.600'}
        _hover={{ bg: 'teal.300', color: 'white' }}
        fontWeight="medium"
      >
        <Icon as={icon} mr={isCollapsed ? 0 : 4} fontSize="20" />
        {!isCollapsed && label}
      </ChakraLink>
    </Tooltip>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  return (
    <Box
      as="nav"
      pos="fixed"
      h="full"
      w={isCollapsed ? '72px' : '240px'}
      bg={useColorModeValue('white', 'gray.800')}
      borderRight="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      transition="width 0.2s ease-in-out"
    >
      <VStack h="full" justify="space-between" py={5}>
        <VStack align="stretch" w="full">
          <Heading size="md" p={4} mb={4} textAlign="center">
            {isCollapsed ? 'C' : 'Caipirão 3.0'}
          </Heading>
          <NavItem icon={FiHome} label="Dashboard" to="/dashboard" isCollapsed={isCollapsed} />
          <NavItem icon={FiShoppingCart} label="Movimentações" to="/movimentacoes" isCollapsed={isCollapsed} />
          <NavItem icon={FiDollarSign} label="Clientes" to="/clientes" isCollapsed={isCollapsed} />
          <NavItem icon={FiBox} label="Produtos" to="/produtos" isCollapsed={isCollapsed} />
          <NavItem icon={FiTruck} label="Fornecedores" to="/fornecedores" isCollapsed={isCollapsed} />
          {isAdmin && (
            <NavItem icon={FiUsers} label="Utilizadores" to="/utilizadores" isCollapsed={isCollapsed} />
          )}
        </VStack>

        <VStack align="stretch" w="full" spacing={4}>
          <Divider />
          <Box px={3}>
            <HStack justify={isCollapsed ? 'center' : 'flex-start'}>
              <Avatar size="sm" name={user?.nome} />
              {!isCollapsed && (
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="sm">{user?.nome}</Text>
                  <Tag size="sm" colorScheme="red" variant="solid">{user?.perfil}</Tag>
                </VStack>
              )}
            </HStack>
          </Box>
          <Tooltip label={isCollapsed ? 'Sair' : ''} placement="right">
            <ChakraLink
              onClick={logout}
              display="flex"
              alignItems="center"
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              p={3} mx={3} borderRadius="lg" role="group" cursor="pointer"
              _hover={{ bg: 'teal.300', color: 'white' }}
              fontWeight="medium" color="gray.600"
            >
              <Icon as={FiLogOut} mr={isCollapsed ? 0 : 4} fontSize="20" />
              {!isCollapsed && 'Sair'}
            </ChakraLink>
          </Tooltip>
        </VStack>
      </VStack>
    </Box>
  );
};
