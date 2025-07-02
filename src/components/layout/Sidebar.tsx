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
} from '@mui/icons-material';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  drawerWidth: number;
  collapsedDrawerWidth: number;
}

const navItems = [
  { text: 'Central de Reportes', href: '/', icon: <FileTextIcon /> },
  { text: 'Dashboard Financiero', href: '/dashboard', icon: <LayoutGridIcon /> },
  { text: 'Proveedores', href: '/providers', icon: <TruckIcon /> },
  { text: 'Notificaciones', href: '/notifications', icon: <BellIcon /> },
  { text: 'Pedidos', href: '/orders', icon: <ShoppingCartIcon /> },
  { text: 'Seguimiento', href: '/kanban', icon: <LayoutGridIcon /> },
  { text: 'Calendario', href: '/calendar', icon: <CalendarIcon /> },
];

const Sidebar = ({ isOpen, setIsOpen, drawerWidth, collapsedDrawerWidth }: SidebarProps) => {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const DrawerContent = (
    <div>
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
    </div>
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
