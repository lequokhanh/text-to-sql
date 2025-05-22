// File: src/sections/database-chat/view/database-view.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { alpha, styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Fade,
  Alert,
  Paper,
  Stack,
  Typography,
  AlertTitle,
  LinearProgress,
} from '@mui/material';

import { useDataSources } from 'src/hooks/use-data-sources';

import { DatabaseLayout } from 'src/layouts/db-chat/database-layout';

import { MainContent } from 'src/components/text-to-sql/main-content/MainContent';
import { UnifiedChatInterface } from 'src/components/text-to-sql/chat/unified-chat-interface';
import { DataSourceDropdown } from 'src/components/text-to-sql/datasource/datasource-dropdown';

import { DatabaseSource } from 'src/types/database';

// Constants for layout
const MAIN_SIDEBAR_WIDTH = 80; // Width of the main sidebar
const CHAT_SIDEBAR_WIDTH = { xs: 280, sm: 320 }; // Width of the chat sidebar
const HEADER_HEIGHT = 150; // Height of the header

const HeaderContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: MAIN_SIDEBAR_WIDTH, // Offset by the main sidebar width
  right: 0,
  zIndex: 1100, // Below main sidebar but above other content
  padding: theme.spacing(3),
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.03)}`,
  transition: theme.transitions.create(['box-shadow', 'background-color'], {
    duration: theme.transitions.duration.short,
  }),
}));

const HeaderTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -6,
    left: 0,
    width: 60,
    height: 3,
    borderRadius: 1.5,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

export default function DatabaseView() {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showNoSourceAlert, setShowNoSourceAlert] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Custom hooks
  const {
    dataSources: ownedSources,
    sharedSources,
    selectedSource,
    setSelectedSource,
    fetchDataSources,
    createDataSource,
    isLoading,
  } = useDataSources();

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSourceSelect = (source: DatabaseSource) => {
    // For shared sources, we only use the data we already have (id, name, databaseType)
    // No need to fetch additional details since we don't have access
    setSelectedSource(source);
    setShowNoSourceAlert(false);
  };

  const handleManageSource = (sourceId: string) => {
    navigate(`/datasource/${sourceId}/manage`);
  };

  const handleCreateDataSource = async (source: DatabaseSource) => {
    try {
      await createDataSource(source);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  const handleSourceRequired = () => {
    setShowNoSourceAlert(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setShowNoSourceAlert(false), 5000);
  };

  return (
    <DatabaseLayout>
      {/* Progress indicator */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: MAIN_SIDEBAR_WIDTH, // Start after the main sidebar
            right: 0,
            zIndex: 1101, // Above header
          }}
        />
      )}

      {/* Header with Dropdown */}
      <HeaderContainer 
        elevation={0}
        sx={{
          bgcolor: isScrolled 
            ? alpha(theme.palette.background.default, 0.98)
            : alpha(theme.palette.background.default, 0.95),
          backgroundImage: isScrolled 
            ? `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.background.default, 0.98)})`
            : `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.background.default, 0.95)})`,
          boxShadow: isScrolled 
            ? `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.08)}`
            : `0 2px 12px 0 ${alpha(theme.palette.common.black, 0.04)}`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          width: { 
            xs: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.xs}px)`,
            sm: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.sm}px)`,
          },
          px: { xs: 2, sm: 3 },
          py: 2,
          transition: theme.transitions.create(['background-color', 'box-shadow'], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
          <HeaderTitle>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ 
                  letterSpacing: '-0.025em',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SequolKit
              </Typography>
            </Box>
          </HeaderTitle>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 'auto' }}>            
            <DataSourceDropdown
              ownedSources={ownedSources}
              sharedSources={sharedSources}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              onCreateSource={() => setIsCreateDialogOpen(true)}
              onManageSource={handleManageSource}
              style={{
                borderRadius: 12,
                minWidth: 200,
                boxShadow: `0 4px 12px 0 ${alpha(theme.palette.common.black, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(20px)',
              }}
            />
          </Stack>
        </Stack>
      </HeaderContainer>

      {/* Alert - full width */}
      <Fade in={showNoSourceAlert}>
        <Alert 
          severity="warning" 
          sx={{ 
            position: 'fixed',
            top: HEADER_HEIGHT + 20, // Below the header
            left: MAIN_SIDEBAR_WIDTH + 20, // After the left sidebar with padding
            right: CHAT_SIDEBAR_WIDTH.sm + 20, // Before the right sidebar with padding
            zIndex: 1000,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            '& .MuiAlert-icon': {
              fontSize: 22,
            },
          }} 
          onClose={() => setShowNoSourceAlert(false)}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>No Data Source Selected</AlertTitle>
          Please select a data source from the dropdown to continue.
        </Alert>
      </Fade>

      {/* Chat Interface with Sidebar - full width */}
      <Box sx={{ 
        position: 'relative', 
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        mt: `${HEADER_HEIGHT}px`, 
        overflow: 'hidden',
        width: { 
          xs: `calc(100% - ${CHAT_SIDEBAR_WIDTH.xs}px)`,
          sm: `calc(100% - ${CHAT_SIDEBAR_WIDTH.sm}px)`,
        },
      }}>
        <UnifiedChatInterface
          selectedSource={selectedSource}
          onSourceRequired={handleSourceRequired}
        />
      </Box>

      {/* Create Dialog */}
      <MainContent.CreateDataSourceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateSource={handleCreateDataSource}
      />
    </DatabaseLayout>
  );
}