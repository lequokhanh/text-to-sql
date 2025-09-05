import { alpha, styled, keyframes } from '@mui/material/styles';
import {
  Box,
  Card,
  Stack,
  Button,
  useTheme,
  Skeleton,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { DatabaseSource } from 'src/types/database';

const pulse = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  textAlign: 'center',
  position: 'relative',
  padding: theme.spacing(2),
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 70%)`,
  },
}));

const WelcomeCard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  width: '100%',
  margin: theme.spacing(3, 'auto'),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.04)}`,
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px 0 ${alpha(theme.palette.common.black, 0.06)}`,
  },
}));

const SuggestionChip = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.short,
  }),
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

interface EmptyStatesProps {
  selectedSource: DatabaseSource | null;
  suggestions: string[];
  isSuggestionsLoading: boolean;
  onSendMessage: (message: string) => void;
  onRefreshSuggestions: () => void;
}

export function EmptyStates({
  selectedSource,
  suggestions,
  isSuggestionsLoading,
  onSendMessage,
  onRefreshSuggestions,
}: EmptyStatesProps) {
  const theme = useTheme();

  // No data source selected
  if (!selectedSource) {
    return (
      <EmptyState>
        <Box sx={{ 
          position: 'relative',
          animation: `${pulse} 2s ease-in-out infinite`,
        }}>
          <Box sx={{ 
            mb: 3, 
            p: 4, 
            borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}>
            <Iconify 
              icon="eva:database-outline" 
              width={64} 
              height={64} 
              sx={{ 
                color: 'primary.main',
                filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.2)})`,
              }} 
            />
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.025em' }}>
          Select a Data Source
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, lineHeight: 1.6 }}>
          Choose a data source from the dropdown to start chatting and querying your data with natural language.
        </Typography>
      </EmptyState>
    );
  }

  // Empty chat state (data source selected but no active chat)
  return (
    <EmptyState>
      <WelcomeCard>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ 
            mb: 3, 
            p: 3, 
            borderRadius: '50%', 
            bgcolor: alpha(theme.palette.success.main, 0.1),
            mx: 'auto',
            width: 'fit-content',
          }}>
            <Iconify 
              icon="eva:message-square-outline" 
              width={48} 
              height={48} 
              sx={{ color: 'success.main' }} 
            />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.025em' }}>
            Start a New Conversation
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
            Ask a question about your <strong>{selectedSource.name}</strong> database using natural language.
          </Typography>
          
          {/* Quick Suggestions */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2 
          }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Try these examples:
            </Typography>
            <IconButton
              size="small"
              onClick={onRefreshSuggestions}
              disabled={isSuggestionsLoading}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
                },
              }}
            >
              <Iconify 
                icon="eva:refresh-fill" 
                width={18} 
                height={18}
                sx={{
                  ...(isSuggestionsLoading && {
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': {
                        transform: 'rotate(0deg)',
                      },
                      '100%': {
                        transform: 'rotate(360deg)',
                      },
                    },
                  }),
                }}
              />
            </IconButton>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
            {isSuggestionsLoading ? (
              // Show 3 skeleton suggestions while loading
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={120 + Math.random() * 80} // Random widths between 120-200px
                  height={36}
                  sx={{
                    borderRadius: '20px',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                  }}
                />
              ))
            ) : (
              suggestions.map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => onSendMessage(suggestion)}
                  startIcon={<Iconify icon="eva:arrow-right-fill" width={16} height={16} />}
                >
                  {suggestion}
                </SuggestionChip>
              ))
            )}
          </Stack>
        </CardContent>
      </WelcomeCard>
    </EmptyState>
  );
}