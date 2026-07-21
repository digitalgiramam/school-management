import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Tooltip, Divider, useTheme, useMediaQuery, Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, School, Class, EventNote,
  Assignment, Payment, LibraryBooks, DirectionsBus, Hotel, AccountBalance,
  HomeWork, Assessment, Settings, Logout, Brightness4, Brightness7,
  ChevronLeft, ExpandLess, ExpandMore, Person, Schedule, BeachAccess,
  Campaign, Notifications, FamilyRestroom, MenuBook,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useColorMode } from '../../theme/ThemeProvider';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Students', icon: <People />, path: '/students' },
  { label: 'Teachers', icon: <School />, path: '/teachers' },
  { label: 'Academic Setup', icon: <Class />, path: '/classes' },
  { label: 'Parents', icon: <FamilyRestroom />, path: '/parents' },
  { label: 'Attendance', icon: <EventNote />, path: '/attendance' },
  { label: 'Timetable', icon: <Schedule />, path: '/timetable' },
  { label: 'Exams', icon: <Assignment />, path: '/exams' },
  { label: 'Fees', icon: <Payment />, path: '/fees' },
  { label: 'Library', icon: <LibraryBooks />, path: '/library' },
  { label: 'Transport', icon: <DirectionsBus />, path: '/transport' },
  { label: 'Hostel', icon: <Hotel />, path: '/hostel' },
  { label: 'Payroll', icon: <AccountBalance />, path: '/payroll' },
  { label: 'Homework', icon: <HomeWork />, path: '/homework' },
  { label: 'Leave', icon: <BeachAccess />, path: '/leave' },
  { label: 'Announcements', icon: <Campaign />, path: '/announcements' },
  { label: 'Notifications', icon: <Notifications />, path: '/notifications' },
  { label: 'Reports', icon: <Assessment />, path: '/reports' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
];

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const { toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <School sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" color="primary" fontWeight={700} fontSize={15}>
          School Manager
        </Typography>
      </Box>
      <Divider />

      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                selected={active}
                sx={{
                  mx: 1, borderRadius: 2, mb: 0.3,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'white' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User info at bottom */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 13 }}>
          {user?.email?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{user?.email}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.role?.replace(/_/g, ' ')}</Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top AppBar */}
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, fontSize: 18 }}>
              {navItems.find((n) => location.pathname.startsWith(n.path))?.label || 'Dashboard'}
            </Typography>

            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleColorMode}>
                {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 14 }}>
                {user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
                <Person fontSize="small" sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
                <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
