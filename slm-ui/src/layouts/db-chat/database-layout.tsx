// File: src/sections/database-management/components/layout/DatabaseLayout.tsx

import { useState, ReactNode, useEffect } from 'react';

import { Box, styled, useTheme, IconButton, useMediaQuery } from '@mui/material';

import Iconify from 'src/components/iconify';

// Main container for the entire database view
const RootStyle = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: theme.palette.background.default,
}));

// Left sidebar for data sources with collapse functionality
const PrimarySidebarStyle = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? 60 : 280, // Minimized width instead of 0
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.customShadows?.z4,
  overflow: 'hidden',
  transition: theme.transitions.create('width', {
    duration: theme.transitions.duration.standard,
  }),
  zIndex: 10,
  position: 'relative',
}));

// Middle sidebar for conversations with collapse functionality
const SecondarySidebarStyle = styled('div', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? 60 : 280, // Minimized width instead of 0
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.customShadows?.z4,
  overflow: 'hidden',
  transition: theme.transitions.create('width', {
    duration: theme.transitions.duration.standard,
  }),
  zIndex: 9,
  position: 'relative',
}));

// Container for the tabs and main content area
const ContentContainerStyle = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  height: '100%',
  overflow: 'hidden',
});

// Main content area
const MainStyle = styled('div')(({ theme }) => ({
  flexGrow: 1,
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  position: 'relative',
}));

// Create a minimized sidebar view
const MinimizedSidebar = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: theme.spacing(2, 0),
  position: 'relative',
}));

// Styled vertical text for sidebar type indicator
const VerticalText = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%) rotate(-90deg)',
  whiteSpace: 'nowrap',
  color: theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: '0.7rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  opacity: 0.7,
}));

// Floating button container that doesn't overlay content
const FloatingButtonContainer = styled(Box)({
  position: 'absolute',
  zIndex: 11,
  right: 8,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

// Scrollable area for content
export const ScrollableContent = styled('div')({
  flexGrow: 1,
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 6,
    backgroundColor: 'rgba(145, 158, 171, 0.24)',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
});

// Proper React functional components to fix ESLint errors
function PrimarySidebar({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  return (
    <PrimarySidebarStyle collapsed={collapsed}>
      {collapsed ? (
        // Minimized view with type indicator and a single expansion button at the bottom
        <MinimizedSidebar>
          {/* Top icon to represent data sources */}
          <Box sx={{ mb: 1, pt: 1 }}>
            <IconButton
              sx={{
                backgroundColor: 'primary.lighter',
                width: 36,
                height: 36,
                mb: 1,
              }}
              disabled
            >
              <Iconify
                icon="lets-icons:database-fill"
                width={20}
                height={20}
                color="primary.main"
              />
            </IconButton>
          </Box>
          {/* Vertical text label */}
          <VerticalText>Data Sources</VerticalText>
          {/* Divider */}
          <Box
            sx={{
              width: 24,
              height: 2,
              bgcolor: 'divider',
              mt: 2,
              mb: 2,
            }}
          />
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push button to bottom */}
          <IconButton
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            sx={{
              mt: 'auto',
              mb: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Iconify
              icon="eva:arrow-ios-forward-fill"
              width={20}
              height={20}
              color="primary.main"
            />
          </IconButton>
        </MinimizedSidebar>
      ) : (
        // Full sidebar view with floated toggle button
        <>
          {children}

          {/* Floating action button that doesn't overlay content */}
          <FloatingButtonContainer
            sx={{
              bottom: 16, // Position at bottom instead of top
            }}
          >
            <IconButton
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1,
                width: 30,
                height: 30,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={18} height={18} />
            </IconButton>
          </FloatingButtonContainer>
        </>
      )}
    </PrimarySidebarStyle>
  );
}

function SecondarySidebar({ children, sx }: { children: ReactNode, sx?: React.CSSProperties }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on tablet
  useEffect(() => {
    setCollapsed(isTablet);
  }, [isTablet]);

  return (
    <SecondarySidebarStyle collapsed={collapsed}>
      {collapsed ? (
        // Minimized view with type indicator and a single expansion button at the bottom
        <MinimizedSidebar>
          {/* Top icon to represent conversations */}
          <Box sx={{ mb: 1, pt: 1 }}>
            <IconButton
              sx={{
                backgroundColor: 'primary.lighter',
                width: 36,
                height: 36,
                mb: 1,
              }}
              disabled
            >
              <Iconify icon="eva:message-square-fill" width={20} height={20} color="primary.main" />
            </IconButton>
          </Box>
          {/* Vertical text label */}
          <VerticalText>Conversations</VerticalText>
          {/* Divider */}
          <Box
            sx={{
              width: 24,
              height: 2,
              bgcolor: 'divider',
              mt: 2,
              mb: 2,
            }}
          />
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push button to bottom */}
          <IconButton
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            sx={{
              mt: 'auto',
              mb: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Iconify
              icon="eva:arrow-ios-forward-fill"
              width={20}
              height={20}
              color="primary.main"
            />
          </IconButton>
        </MinimizedSidebar>
      ) : (
        // Full sidebar view with floated toggle button
        <>
          {children}

          {/* Floating action button that doesn't overlay content */}
          <FloatingButtonContainer
            sx={{
              bottom: 16, // Position at bottom instead of top
            }}
          >
            <IconButton
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1,
                width: 30,
                height: 30,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={18} height={18} />
            </IconButton>
          </FloatingButtonContainer>
        </>
      )}
    </SecondarySidebarStyle>
  );
}

function Content({ children, sx }: { children: ReactNode, sx?: React.CSSProperties }) {
  return <ContentContainerStyle sx={sx}>{children}</ContentContainerStyle>;
}

function Main({ children, sx }: { children: ReactNode, sx?: React.CSSProperties }) {
  return <MainStyle sx={sx}>{children}</MainStyle>;
}

// The main database layout component
export function DatabaseLayout({ children, sx }: { children: ReactNode, sx?: React.CSSProperties }) {
  return <RootStyle sx={sx}>{children}</RootStyle>;
}

// Attach the sub-components to the DatabaseLayout component
DatabaseLayout.PrimarySidebar = PrimarySidebar;
DatabaseLayout.SecondarySidebar = SecondarySidebar;
DatabaseLayout.Content = Content;
DatabaseLayout.Main = Main;
