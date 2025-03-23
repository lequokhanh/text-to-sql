// import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
// Icons
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { bgBlur } from 'src/theme/css';

// Assuming these components are available in your project
import Logo from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';

import AccountPopover from '../common/account-popover';

// Define sidebar width constant
const SIDEBAR_WIDTH = 80; // you can adjust this value as needed

export default function Sidebar() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  //   const [activeItem, setActiveItem] = useState('dashboard');

  const settings = useSettingsContext();
  const handleThemeToggle = () => {
    settings.onUpdate('themeMode', isDarkMode ? 'light' : 'dark');
  };

  //   const navItems = [
  //     { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
  //     { id: 'users', icon: <PeopleIcon />, label: 'Users' },
  //     { id: 'projects', icon: <AssignmentIcon />, label: 'Projects' },
  //     { id: 'analytics', icon: <BarChartIcon />, label: 'Analytics' },
  //     { id: 'messages', icon: <EmailIcon />, label: 'Messages' },
  //   ];

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: SIDEBAR_WIDTH,
        height: '100vh',
        zIndex: theme.zIndex.drawer,
        display: 'flex',
        flexDirection: 'column',
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['width', 'box-shadow']),
        '&:hover': {
          boxShadow: theme.shadows[8],
        },
      }}
    >
      {/* Logo at top */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          mt: 1,
          mb: 2,
        }}
      >
        <Logo sx={{ width: 40, height: 40 }} />
      </Box>

      <Divider sx={{ width: '60%', mx: 'auto', my: 1 }} />

      {/* Navigation items
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        {navItems.map((item) => (
          <Tooltip key={item.id} title={item.label} placement="right">
            <ListItemButton
              onClick={() => setActiveItem(item.id)}
              sx={{
                minHeight: 48,
                justifyContent: 'center',
                px: 2.5,
                mb: 1,
                borderRadius: '12px',
                mx: 'auto',
                width: '80%',
                ...(activeItem === item.id && {
                  backgroundColor: theme.palette.primary.main + '33', // Adding transparency
                  color: theme.palette.primary.main,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    width: 4,
                    height: '70%',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: theme.palette.primary.main,
                  },
                }),
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {item.icon}
            </ListItemButton>
          </Tooltip>
        ))}
      </Box> */}

      {/* Spacer to push the bottom content down */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Theme toggle */}
      <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} placement="right">
        <IconButton
          onClick={handleThemeToggle}
          sx={{
            alignSelf: 'center',
            mb: 2,
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Tooltip>

      {/* Account popover - using provided component */}
      <Box sx={{ alignSelf: 'center', mb: 2, position: 'relative' }}>
        <AccountPopover />
      </Box>
    </Paper>
  );
}
