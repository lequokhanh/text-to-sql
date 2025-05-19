// File: src/sections/database-management/view/database-view.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { alpha, styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Fade,
  Chip,
  Alert,
  Paper,
  Stack,
  Typography,
  AlertTitle,
  LinearProgress,
} from '@mui/material';

import { useDataSources } from 'src/hooks/use-data-sources';

import { DatabaseLayout } from 'src/layouts/db-chat/database-layout';

import Iconify from 'src/components/iconify';
import { MainContent } from 'src/components/text-to-sql/main-content/MainContent';
import { UnifiedChatInterface } from 'src/components/text-to-sql/chat/unified-chat-interface';
import { DataSourceDropdown } from 'src/components/text-to-sql/datasource/datasource-dropdown';

import { DatabaseSource } from 'src/types/database';

// Constants for layout
const MAIN_SIDEBAR_WIDTH = 80; // Width of the main sidebar
const CHAT_SIDEBAR_WIDTH = { xs: 280, sm: 320 }; // Width of the chat sidebar
const HEADER_HEIGHT = 96; // Height of the header

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

const SelectionStatus = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'translate(-50%, -50%) scale(1.05)',
      opacity: 0.8,
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1,
    },
  },
}));

export default function DatabaseView() {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [availableSources, setAvailableSources] = useState<DatabaseSource[]>([]);
  const [showNoSourceAlert, setShowNoSourceAlert] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Custom hooks
  const {
    dataSources: ownedSources,
    selectedSource,
    setSelectedSource,
    fetchDataSources,
    createDataSource,
    isLoading,
  } = useDataSources();

  useEffect(() => {
    fetchDataSources();
    fetchAvailableSources();
  }, [fetchDataSources]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchAvailableSources = async () => {
    try {
      const response = await fetch('/api/v1/data-sources/available');
      // Check if response is valid JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setAvailableSources(data);
      } else {
        console.error('Error fetching available sources: API returned non-JSON response');
        // Handle gracefully by setting empty array instead of showing error
        setAvailableSources([]);
        
        // Show a more user-friendly message in the UI
        // Instead of logging to console, we can use a snackbar or notification
        // This prevents console error spam
      }
    } catch (error) {
      console.error('Error fetching available sources:', error);
      // Handle gracefully by setting empty array
      setAvailableSources([]);
    }
  };

  const handleSourceSelect = (source: DatabaseSource) => {
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
            ? alpha(theme.palette.background.default, 0.95)
            : alpha(theme.palette.background.default, 0.9),
          boxShadow: isScrolled 
            ? `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.05)}`
            : undefined,
          // Adjust width to account for right sidebar
          width: { 
            xs: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.xs}px)`,
            sm: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.sm}px)`,
          },
          px: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
          <HeaderTitle>
            <Box sx={{ position: 'relative' }}>
              <Iconify 
                icon="eva:database-fill" 
                width={36} 
                height={36} 
                sx={{ 
                  color: 'primary.main',
                  filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.2)})`,
                }} 
              />
              {selectedSource && (
                <SelectionStatus>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.5)}`,
                    }}
                  />
                </SelectionStatus>
              )}
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.025em' }}>
                Database Chat
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Query your data with natural language
              </Typography>
            </Box>
          </HeaderTitle>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 'auto' }}>
            {selectedSource && (
              <Chip
                icon={<Iconify icon="eva:checkmark-circle-fill" width={16} height={16} />}
                label={`Connected to ${selectedSource.name}`}
                color="success"
                variant="filled"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              />
            )}
            
            <DataSourceDropdown
              ownedSources={ownedSources}
              sharedSources={availableSources}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              onCreateSource={() => setIsCreateDialogOpen(true)}
              onManageSource={handleManageSource}
              style={{
                borderRadius: 12,
                minWidth: 200,
                boxShadow: `0 4px 12px 0 ${alpha(theme.palette.common.black, 0.1)}`,
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
        ml: `${MAIN_SIDEBAR_WIDTH}px`, // Account for the left sidebar
        width: { 
          xs: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.xs}px)`,
          sm: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.sm}px)`,
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