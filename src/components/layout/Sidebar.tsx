'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  ShoppingCart as ShoppingCartIcon,
  CalendarToday as CalendarIcon,
  Dashboard as LayoutGridIcon,
  Close as XIcon,
  Notifications as BellIcon,
  Article as FileTextIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ColorModeContext } from '../ThemeRegistry/ThemeRegistry';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  drawerWidth: number;
  collapsedDrawerWidth: number;
}

const navItems = [
  { text: 'Central de Reportes', href: '/', icon: <FileTextIcon /> },
  { text: 'Dashboard Financiero', href: '/dashboard', icon: <LayoutGridIcon /> },
  { text: 'Pedidos', href: '/orders', icon: <ShoppingCartIcon /> },
  { text: 'Importar', href: '/import', icon: <UploadFileIcon /> },
  { text: 'Proveedores', href: '/providers', icon: <TruckIcon /> },
  { text: 'Seguimiento', href: '/kanban', icon: <LayoutGridIcon /> },
  { text: 'Calendario', href: '/calendar', icon: <CalendarIcon /> },
  { text: 'Notificaciones', href: '/settings/notifications', icon: <BellIcon /> },
];

const Sidebar = ({ isOpen, setIsOpen, drawerWidth, collapsedDrawerWidth }: SidebarProps) => {
  const pathname = usePathname();
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const DrawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: [1] }}>
          {isOpen && (
            <Typography variant="h6" noWrap component="div" sx={{ ml: 1 }}>
              Impor-Cami
            </Typography>
          )}
          {isMobile && (
            <IconButton onClick={() => setIsOpen(false)}>
              <XIcon />
            </IconButton>
          )}
        </Toolbar>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={item.text} placement="right" disableHoverListener={isOpen}>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={pathname === item.href}
                  sx={{
                    minHeight: 48,
                    justifyContent: isOpen ? 'initial' : 'center',
                    px: 2.5,
                  }}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: isOpen ? 1 : 0 }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ marginTop: 'auto' }}>
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title={theme.palette.mode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'} placement="right" disableHoverListener={isOpen}>
              <ListItemButton
                onClick={colorMode.toggleColorMode}
                sx={{
                  minHeight: 48,
                  justifyContent: isOpen ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </ListItemIcon>
                <ListItemText primary={theme.palette.mode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'} sx={{ opacity: isOpen ? 1 : 0 }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: isOpen ? drawerWidth : collapsedDrawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={isMobile && isOpen}
        onClose={() => setIsOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {DrawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: isOpen ? drawerWidth : collapsedDrawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {DrawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
