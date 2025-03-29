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

const LAYOUT = {
  // Sidebar dimensions
  SIDEBAR: {
    WIDTH: {
      DESKTOP: 80,
      TABLET: 70,
    },
    HEIGHT: {
      MOBILE: 64,
      COMPACT: 56,
    },
  },
  // Transition durations
  TRANSITIONS: {
    FAST: '0.2s',
    MEDIUM: '0.3s',
    SLOW: '0.5s',
  },
  // Z-index values
  Z_INDEX: {
    SIDEBAR: 1200,
    CONTENT: 1,
  },
};

export default function Sidebar() {
  const theme = useTheme();
  const settings = useSettingsContext();
  const [animate, setAnimate] = useState(false);

  // Enhanced responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isSmallHeight = useMediaQuery('(max-height: 600px)');

  // Determine actual sidebar dimensions based on device and orientation
  const sidebarWidth = isTablet ? LAYOUT.SIDEBAR.WIDTH.TABLET : LAYOUT.SIDEBAR.WIDTH.DESKTOP;
  const bottomBarHeight = isSmallHeight
    ? LAYOUT.SIDEBAR.HEIGHT.COMPACT
    : LAYOUT.SIDEBAR.HEIGHT.MOBILE;

  const isDarkMode = theme.palette.mode === 'dark';

  // Animation keyframes
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
    return undefined;
  }, [animate]);

  // Special case for small-height landscape mobile devices
  const useMobileLayout = isMobile && !(isLandscape && !isSmallHeight);

  // Helper function to handle nested ternaries
  const getResponsiveSize = <T extends string | number>(
    mobileSmall: T,
    mobileLarge: T,
    tablet: T,
    desktop: T
  ): T => {
    if (useMobileLayout) {
      return isSmallHeight ? mobileSmall : mobileLarge;
    }
    return isTablet ? tablet : desktop;
  };

  // Font size for theme toggle icons
  const iconFontSize = getResponsiveSize('1.2rem', '1.4rem', '1.5rem', '1.6rem');

  // Padding values
  const logoPadding = getResponsiveSize(0.5, 1, 1.5, 2);
  const accountPadding = getResponsiveSize(0.5, 1, 1.5, 2);

  // Margin bottom for account popover
  let accountMarginBottom = 4; // Default for desktop
  if (useMobileLayout) {
    accountMarginBottom = 0;
  } else if (isTablet) {
    accountMarginBottom = 3;
  }

  return (
    <Paper
      elevation={0}
      component="aside"
      aria-label="main navigation"
      sx={{
        position: 'fixed',
        zIndex: LAYOUT.Z_INDEX.SIDEBAR,
        display: 'flex',
        ...bgBlur({
          color: theme.palette.background.default,
          opacity: 0.95,
        }),
        transition: theme.transitions.create(
          ['width', 'height', 'transform', 'bottom', 'left', 'box-shadow'],
          { duration: LAYOUT.TRANSITIONS.MEDIUM }
        ),

        // Mobile bottom bar styles
        ...(useMobileLayout
          ? {
              bottom: 0,
              left: 0,
              width: '100%',
              height: bottomBarHeight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              borderTop: `1px solid ${theme.palette.divider}`,
              borderRight: 'none',
              boxShadow: 'none',
              transformOrigin: 'bottom center',
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: isSmallHeight ? 'none' : 'translateY(-4px)',
              },
            }
          : {
              // Desktop/tablet sidebar styles
              left: 0,
              top: 0,
              width: sidebarWidth,
              height: '100vh',
              flexDirection: 'column',
              borderRight: `1px solid ${theme.palette.divider}`,
              borderTop: 'none',
              transformOrigin: 'left center',
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
          p: logoPadding,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Logo
          sx={{
            width: getResponsiveSize(28, 32, 36, 42),
            height: getResponsiveSize(28, 32, 36, 42),
            transition: `transform ${LAYOUT.TRANSITIONS.MEDIUM}`,
            '&:hover': { transform: 'scale(1.1)' },
          }}
        />
      </Box>

      {/* Spacer - only for desktop/tablet */}
      {!useMobileLayout && <Box sx={{ flexGrow: 1 }} />}

      {/* Theme toggle */}
      <Tooltip
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        placement={useMobileLayout ? 'top' : 'right'}
      >
        <IconButton
          onClick={handleThemeToggle}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          sx={{
            mx: 'auto',
            display: 'flex',
            transition: `all ${LAYOUT.TRANSITIONS.MEDIUM} ease`,
            animation: animate ? `${spinFade} 0.6s ease, ${colorShift} 0.6s ease` : 'none',
            '&:hover': {
              color: isDarkMode ? theme.palette.warning.main : theme.palette.info.main,
              transform: 'scale(1.1)',
            },
            '& svg': {
              transition: `transform ${LAYOUT.TRANSITIONS.MEDIUM} ease`,
            },
          }}
        >
          {isDarkMode ? (
            <WbSunnyRoundedIcon
              sx={{
                fontSize: iconFontSize,
              }}
            />
          ) : (
            <NightsStayRoundedIcon
              sx={{
                fontSize: iconFontSize,
              }}
            />
          )}
        </IconButton>
      </Tooltip>

      {/* Account popover */}
      <Box
        sx={{
          alignSelf: 'center',
          p: accountPadding,
          mb: accountMarginBottom,
          position: 'relative',
          transition: `transform ${LAYOUT.TRANSITIONS.FAST}`,
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
