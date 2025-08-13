// src/components/Sidebar.tsx

import {
  Box, VStack, Heading, Link as ChakraLink, Text, Divider, Avatar, HStack, Tag, Icon, Tooltip, useColorModeValue, Flex,
} from '@chakra-ui/react';
import { Link, NavLink as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome, FiShoppingCart, FiUsers, FiBox, FiDollarSign, FiLogOut, FiTruck, FiBarChart2, FiClipboard,
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
  const activeBg = useColorModeValue('teal.400', 'teal.500');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('teal.300', 'teal.600');

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
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? 'white' : inactiveColor}
        _hover={{ bg: hoverBg, color: 'white', transform: 'translateX(2px)' }}
        fontWeight="medium"
        transition="all 0.2s ease"
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
  
  const homeLink = isAdmin ? '/dashboard' : '/movimentacoes';

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const linkColor = useColorModeValue('gray.600', 'gray.300');
  const logoutHoverBg = useColorModeValue('red.400', 'red.500');

  return (
    <Box
      as="nav"
      pos="fixed"
      h="full"
      w={isCollapsed ? '72px' : '240px'}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      transition="width 0.2s ease-in-out"
    >
      <VStack h="full" justify="space-between">
        <VStack align="stretch" w="full">
          <Link to={homeLink}>
            <Flex
              h="14"
              align="center"
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              px={isCollapsed ? 0 : 4}
              borderBottomWidth="1px"
              borderColor={borderColor}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              transition="background-color 0.2s ease"
            >
              <Icon as={FiClipboard} mr={isCollapsed ? 0 : 2} fontSize="24" color="teal.400" />
              {!isCollapsed && (
                <Heading size="md" color={textColor}>
                  Caipirão 3.0
                </Heading>
              )}
            </Flex>
          </Link>
          
          <VStack align="stretch" w="full" mt={4}>
            {isAdmin && <NavItem icon={FiHome} label="Dashboard" to="/dashboard" isCollapsed={isCollapsed} />}
            <NavItem icon={FiShoppingCart} label="Movimentações" to="/movimentacoes" isCollapsed={isCollapsed} />
            {isAdmin && <NavItem icon={FiBarChart2} label="Relatórios" to="/relatorios" isCollapsed={isCollapsed} />}
            <NavItem icon={FiDollarSign} label="Clientes" to="/clientes" isCollapsed={isCollapsed} />
            <NavItem icon={FiBox} label="Produtos" to="/produtos" isCollapsed={isCollapsed} />
            {isAdmin && <NavItem icon={FiTruck} label="Fornecedores" to="/fornecedores" isCollapsed={isCollapsed} />}
            {isAdmin && <NavItem icon={FiUsers} label="Utilizadores" to="/utilizadores" isCollapsed={isCollapsed} />}
          </VStack>
        </VStack>

        <VStack align="stretch" w="full" spacing={4} mb={4}>
          <Divider borderColor={borderColor} />
          <Box px={3}>
            <HStack justify={isCollapsed ? 'center' : 'flex-start'}>
              <Avatar size="sm" name={user?.nome} />
              {!isCollapsed && (
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="sm" color={textColor}>{user?.nome}</Text>
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
              _hover={{ bg: logoutHoverBg, color: 'white' }}
              fontWeight="medium" color={linkColor}
              transition="all 0.2s ease"
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
