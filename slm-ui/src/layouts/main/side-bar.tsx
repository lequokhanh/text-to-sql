import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { keyframes } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';

import { bgBlur } from 'src/theme/css';

import Logo from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';

import AccountPopover from '../common/account-popover';

const SIDEBAR_WIDTH = 80;
const BOTTOM_BAR_HEIGHT = 64;

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';
  const settings = useSettingsContext();
  const [animate, setAnimate] = useState(false);

  const spinFade = keyframes`
    0% {
      transform: rotate(0deg) scale(0.8);
      opacity: 0.5;
    }
    50% {
      transform: rotate(180deg) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: rotate(360deg) scale(1);
      opacity: 1;
    }
  `;

  const colorShift = keyframes`
    0% {
      color: ${theme.palette.text.secondary};
    }
    50% {
      color: ${theme.palette.primary.main};
    }
    100% {
      color: ${isDarkMode ? theme.palette.warning.main : theme.palette.info.main};
    }
  `;

  const handleThemeToggle = () => {
    setAnimate(true);
    settings.onUpdate('themeMode', isDarkMode ? 'light' : 'dark');
  };

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicitly return when animate is false
  }, [animate]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        zIndex: theme.zIndex.drawer,
        display: 'flex',
        ...bgBlur({
          color: theme.palette.background.default,
          opacity: 0.95,
        }),
        transition: theme.transitions.create(['width', 'height', 'transform', 'bottom', 'left']),

        // Mobile bottom bar styles
        ...(isMobile
          ? {
              bottom: 0,
              left: 0,
              width: '100%',
              height: BOTTOM_BAR_HEIGHT,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              borderTop: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-4px)',
              },
            }
          : {
              // Desktop sidebar styles
              left: 0,
              top: 0,
              width: SIDEBAR_WIDTH,
              height: '100vh',
              flexDirection: 'column',
              borderRight: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                boxShadow: theme.shadows[24],
                transform: 'translateX(4px)',
              },
            }),
      }}
    >
      {/* Logo section */}
      <Box
        sx={{
          p: isMobile ? 1 : 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Logo
          sx={{
            width: isMobile ? 32 : 42,
            height: isMobile ? 32 : 42,
            transition: 'transform 0.3s',
            '&:hover': { transform: 'scale(1.1)' },
          }}
        />
      </Box>

      {/* Spacer - only for desktop */}
      {!isMobile && <Box sx={{ flexGrow: 1 }} />}

      {/* Theme toggle */}
      <Tooltip
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        placement={isMobile ? 'top' : 'right'}
      >
        <IconButton
          onClick={handleThemeToggle}
          sx={{
            mx: 'auto',
            display: 'flex',
            transition: 'all 0.3s ease',
            animation: animate ? `${spinFade} 0.6s ease, ${colorShift} 0.6s ease` : 'none',
            '&:hover': {
              color: isDarkMode ? theme.palette.warning.main : theme.palette.info.main,
              transform: 'scale(1.1)',
            },
            '& svg': {
              transition: 'transform 0.3s ease',
            },
          }}
        >
          {isDarkMode ? (
            <WbSunnyRoundedIcon sx={{ fontSize: isMobile ? '1.4rem' : '1.6rem' }} />
          ) : (
            <NightsStayRoundedIcon sx={{ fontSize: isMobile ? '1.4rem' : '1.6rem' }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Account popover */}
      <Box
        sx={{
          alignSelf: isMobile ? 'center' : 'center',
          p: isMobile ? 1 : 2,
          mb: isMobile ? 0 : 4,
          position: 'relative',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        <AccountPopover />
      </Box>
    </Paper>
  );
}
