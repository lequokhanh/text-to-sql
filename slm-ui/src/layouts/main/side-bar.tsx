import {useState, useEffect} from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { keyframes } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import {useTheme} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';

import {bgBlur} from 'src/theme/css';

import Logo from 'src/components/logo';
import {useSettingsContext} from 'src/components/settings';

import AccountPopover from '../common/account-popover';

const SIDEBAR_WIDTH = 80;



export default function Sidebar() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const settings = useSettingsContext();
  // Inside your component
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

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animate]);


  return (
    <Paper
      elevation={0}
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
          opacity: 0.95,
        }),
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['width', 'transform']),
        '&:hover': {
          boxShadow: theme.shadows[24],
          transform: 'translateX(4px)',
        },
      }}
    >
      {/* Logo section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Logo sx={{width: 42, height: 42, transition: 'transform 0.3s', '&:hover': {transform: 'scale(1.1)'}}}/>
      </Box>

      <Box sx={{flexGrow: 1}}/>

      {/* Theme toggle */}
      <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} placement="right">
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
              transition: 'transform 0.3s ease'
            }
          }}
        >
          {isDarkMode ? (
            <WbSunnyRoundedIcon sx={{ fontSize: '1.6rem' }} />
          ) : (
            <NightsStayRoundedIcon sx={{ fontSize: '1.6rem' }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Account popover */}
      <Box sx={{
        alignSelf: 'center',
        pt: 2,
        mb: 4,
        position: 'relative',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}>
        <AccountPopover/>
      </Box>
    </Paper>
  );
}
