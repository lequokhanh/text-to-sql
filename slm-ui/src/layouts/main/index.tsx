import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { usePathname } from 'src/routes/hooks';

import Sidebar from './side-bar';

export const LAYOUT = {
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

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  const theme = useTheme();
  const pathname = usePathname();
  const homePage = pathname === '/';

  // Enhanced responsive breakpoints matching Sidebar component
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isSmallHeight = useMediaQuery('(max-height: 600px)');

  // Only use bottom bar for true mobile layouts (not landscape tablets)
  const useMobileLayout = isMobile && !(isLandscape && !isSmallHeight);

  // Calculate content margins based on device size
  const sidebarWidth = isTablet ? LAYOUT.SIDEBAR.WIDTH.TABLET : LAYOUT.SIDEBAR.WIDTH.DESKTOP;
  const bottomBarHeight = isSmallHeight
    ? LAYOUT.SIDEBAR.HEIGHT.COMPACT
    : LAYOUT.SIDEBAR.HEIGHT.MOBILE;

  // Track window resize and orientation changes for smoother transitions
  const [, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        {/* Sidebar component */}
        <Sidebar />

        {/* Main content with responsive margins */}
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            width: useMobileLayout ? '100%' : `calc(100% - ${sidebarWidth}px)`,
            ml: useMobileLayout ? 0 : `${sidebarWidth}px`,
            mb: useMobileLayout ? `${bottomBarHeight}px` : 0,
            height: useMobileLayout ? `calc(100vh - ${bottomBarHeight}px)` : '100vh',
            overflow: 'auto',
            ...(homePage
              ? {}
              : {
                  pt: {
                    xs: 3,
                    sm: 4,
                    md: 5,
                    lg: 6,
                  },
                  px: {
                    xs: 2,
                    sm: 3,
                    md: 4,
                  },
                }),
            transition: theme.transitions.create(['margin', 'width', 'padding'], {
              duration: LAYOUT.TRANSITIONS.MEDIUM,
            }),
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
