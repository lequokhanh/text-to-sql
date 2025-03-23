import { m } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, Theme, styled, useTheme } from '@mui/material/styles';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

import ChatMessageInput from '../chat/chat-message-input';

// ----------------------------------------------------------------------

type Props = {
  source: DatabaseSource;
  messages: IChatMessage[];
  onSendMessage: (message: string) => void;
  onClearChat?: () => void;
  onExportChat?: () => void;
  isConnected?: boolean;
  messageCount?: number;
  isLoading?: boolean;
};

// Function to export table data to CSV
const exportToCSV = (results: Record<string, any>[], fileName: string) => {
  if (!results || !results.length) return;

  // Get headers from the first result object
  const headers = Object.keys(results[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...results.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle different value types for CSV format
          if (value === null) return '';
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================== Styled Components ==============================

const FloatingButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  right: theme.spacing(4),
  bottom: theme.spacing(12),
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(4px)',
  boxShadow: theme.customShadows.z16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: theme.palette.background.paper,
  },
}));

const MessageCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.customShadows.z8,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.customShadows.z16,
  },
}));

const StickyTableHead = styled(TableHead)(({ theme }) => ({
  '& th': {
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.neutral,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backdropFilter: 'blur(8px)',
  },
}));

// ============================== Animation Variants ==============================

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20 },
};

const loadingBarVariants = {
  initial: { scaleX: 0, originX: 0 },
  animate: { scaleX: 1, originX: 0, transition: { duration: 2, repeat: Infinity } },
};

// ============================== Subcomponents ==============================

const ConnectionBadge = ({ isConnected }: { isConnected: boolean }) => (
  <Box
    component="span"
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: isConnected ? 'success.main' : 'error.main',
      ml: 1,
      boxShadow: (theme) =>
        `0 0 8px ${alpha(
          isConnected ? theme.palette.success.main : theme.palette.error.main,
          0.4
        )}`,
    }}
  />
);

const DatabaseChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontWeight: 'bold',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiChip-label': {
    color: theme.palette.primary.dark,
    px: 1,
  },
}));

// Loading Bot Message Component
const BotLoadingMessage = () => {
  const theme = useTheme();

  return (
    <Stack direction="row" sx={{ mb: 3 }}>
      <MessageCard
        sx={{
          width: '80%',
          borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          bgcolor: alpha(theme.palette.primary.lighter, 0.04),
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <m.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Iconify icon="mdi:robot" width={24} />
              </m.div>
              <Typography variant="subtitle1">Analyzing your query...</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Box sx={{ position: 'relative' }}>
            <Box
              component={m.div}
              variants={loadingBarVariants}
              initial="initial"
              animate="animate"
              sx={{
                height: 2,
                bgcolor: 'primary.main',
                position: 'absolute',
                bottom: -16,
                left: 0,
                right: 0,
                transformOrigin: 'left',
              }}
            />
            <Stack spacing={1} sx={{ opacity: 0.8 }}>
              <Skeleton variant="rounded" height={12} width="85%" />
              <Skeleton variant="rounded" height={12} width="70%" />
              <Skeleton variant="rounded" height={12} width="80%" />
            </Stack>
          </Box>
        </CardContent>
      </MessageCard>
    </Stack>
  );
};

// Custom Message component to handle bot messages with SQL and table results
const ChatMessage = ({ message }: { message: IChatMessage }) => {
  const theme = useTheme();
  const [showFullResults, setShowFullResults] = useState(false);

  const isBot = message.senderId === 'bot';
  const isError = isBot && message.body.includes('## Error');

  if (!isBot) {
    return (
      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{
          mb: 3,
          opacity: 0,
          animation: 'fadeSlideIn 0.3s ease forwards',
          '@keyframes fadeSlideIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Paper
          sx={{
            p: 2,
            maxWidth: '80%',
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            borderRadius: 2,
            boxShadow: theme.customShadows?.z8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.customShadows?.z16,
            },
          }}
        >
          <Typography variant="body1">{message.body}</Typography>
        </Paper>
      </Stack>
    );
  }

  // Handle bot message with enhanced formatting
  if (isError) {
    return (
      <Stack
        direction="row"
        sx={{
          mb: 3,
          opacity: 0,
          animation: 'fadeSlideIn 0.3s ease forwards',
          '@keyframes fadeSlideIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Card
          sx={{
            width: '80%',
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.error.main}`,
            boxShadow: theme.customShadows?.z8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.customShadows?.z16,
            },
            bgcolor: () => alpha(theme.palette.error.lighter, 0.6),
          }}
        >
          <CardHeader
            title="Error"
            titleTypographyProps={{ variant: 'subtitle1' }}
            avatar={<Iconify icon="mdi:alert-circle" width={24} color={theme.palette.error.main} />}
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Markdown>{message.body}</Markdown>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  // Handle SQL and Results message
  const hasSqlSection = message.body.includes('## SQL Query');
  const hasResultsSection = message.body.includes('## Results');

  if (!hasSqlSection || !hasResultsSection) {
    return (
      <Stack
        direction="row"
        sx={{
          mb: 3,
          opacity: 0,
          animation: 'fadeSlideIn 0.3s ease forwards',
          '@keyframes fadeSlideIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Card
          sx={{
            p: 2,
            width: '80%',
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.info.light}`,
            boxShadow: theme.customShadows?.z8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.customShadows?.z16,
              borderLeft: `4px solid ${theme.palette.info.main}`,
              bgcolor: (t) => alpha(t.palette.info.lighter, 0.1),
            },
          }}
        >
          <CardHeader
            title="Response"
            titleTypographyProps={{ variant: 'subtitle1' }}
            avatar={<Iconify icon="mdi:robot" width={24} />}
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Markdown>{message.body}</Markdown>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  // Extract SQL and Results sections
  const sqlSection = message.body.split('## Results')[0];
  const resultsSection = `## Results${message.body.split('## Results')[1]}`;

  // Check if we have table data in the message metadata
  const hasTableData =
    message.metadata?.results &&
    Array.isArray(message.metadata.results) &&
    message.metadata.results.length > 0;

  // Generate a filename for CSV export based on the query
  const generateCsvFilename = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `query-results-${timestamp}`;
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (hasTableData) {
      exportToCSV(message.metadata?.results, generateCsvFilename());
    }
  };

  return (
    <Stack direction="row" sx={{ mb: 3 }}>
      <Box sx={{ width: '80%' }}>
        {/* SQL Query Card */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.info.main}`,
            boxShadow: theme.customShadows?.z8,
          }}
        >
          <CardHeader
            title="SQL Query"
            titleTypographyProps={{ variant: 'subtitle1' }}
            avatar={<Iconify icon="mdi:database-search" width={24} />}
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Markdown>{sqlSection.replace('## SQL Query', '')}</Markdown>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card
          sx={{
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.success.main}`,
            boxShadow: theme.customShadows?.z8,
          }}
        >
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">Results</Typography>
                {message.metadata?.rowCount !== undefined && (
                  <Chip
                    label={`${message.metadata.rowCount} ${
                      message.metadata.rowCount === 1 ? 'row' : 'rows'
                    }`}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>
            }
            avatar={<Iconify icon="mdi:table" width={24} />}
            action={
              <Stack direction="row" spacing={1}>
                {hasTableData && (
                  <Tooltip title="Export to CSV">
                    <IconButton
                      size="small"
                      onClick={handleExportCSV}
                      sx={{
                        color: theme.palette.success.main,
                        '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) },
                      }}
                    >
                      <Iconify icon="mdi:file-export" />
                    </IconButton>
                  </Tooltip>
                )}
                {hasTableData && (
                  <Tooltip title={showFullResults ? 'Show less' : 'Show all results'}>
                    <IconButton size="small" onClick={() => setShowFullResults(!showFullResults)}>
                      <Iconify icon={showFullResults ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            {/* Render as a proper table if we have the data in metadata */}
            {hasTableData ? (
              <Box>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: showFullResults ? 'none' : 300,
                    border: `1px solid ${theme.palette.divider}`,
                    scrollBehavior: 'smooth',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: (t: Theme) => alpha(t.palette.grey[500], 0.08),
                      borderRadius: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: (t: Theme) => alpha(t.palette.grey[500], 0.24),
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: (t: Theme) => alpha(t.palette.grey[500], 0.32),
                      },
                    },
                    // Firefox scrollbar styling
                    scrollbarWidth: 'thin',
                    scrollbarColor: (t: Theme) =>
                      `${alpha(t.palette.grey[500], 0.24)} ${alpha(t.palette.grey[500], 0.08)}`,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <StickyTableHead>
                      <TableRow
                        sx={{
                          bgcolor: theme.palette.background.neutral,
                          '& th': { fontWeight: 'bold' },
                        }}
                      >
                        {Object.keys(message.metadata?.results[0]).map((column) => (
                          <TableCell key={column}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </StickyTableHead>
                    <TableBody>
                      {message.metadata?.results.map((row: Record<string, any>, index: number) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:nth-of-type(odd)': {
                              bgcolor: alpha(theme.palette.background.neutral, 0.3),
                            },
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.lighter, 0.3),
                            },
                          }}
                        >
                          {Object.keys(row).map((column) => {
                            const value = row[column];
                            let cellContent;

                            if (value === null) {
                              cellContent = (
                                <Typography variant="body2" color="text.disabled">
                                  NULL
                                </Typography>
                              );
                            } else if (typeof value === 'object') {
                              cellContent = (
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {JSON.stringify(value)}
                                </Typography>
                              );
                            } else {
                              cellContent = (
                                <Typography variant="body2">{String(value)}</Typography>
                              );
                            }

                            return <TableCell key={column}>{cellContent}</TableCell>;
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {!showFullResults && message.metadata?.results.length > 5 && (
                  <Box
                    sx={{
                      mt: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => setShowFullResults(true)}
                  >
                    <Typography variant="caption">
                      Show all {message.metadata?.results.length} rows
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Markdown>{resultsSection.replace('## Results', '')}</Markdown>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
};

export default function ChatSection({
  source,
  messages,
  onSendMessage,
  onClearChat,
  onExportChat,
  isConnected = true,
  messageCount = 0,
  isLoading = false,
}: Props) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll behavior
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <Stack sx={{ height: '100%', position: 'relative' }}>
      {/* Enhanced Header with Motion */}
      <Box
        component={m.div}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        sx={{
          p: 2,
          borderBottom: (theme: Theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: (theme: Theme) => alpha(theme.palette.background.default, 0.9),
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify
              icon="mdi:database"
              width={28}
              sx={{ color: 'primary.main', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              {source.name}
              <ConnectionBadge isConnected={isConnected} />
            </Typography>
            <DatabaseChip label={source.databaseType} />
          </Stack>

          {/* Animated Action Buttons */}
          <Stack direction="row" spacing={0.5}>
            {onExportChat && (
              <Tooltip title="Export Chat History">
                <IconButton
                  onClick={onExportChat}
                  sx={{
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                    },
                  }}
                >
                  <Iconify icon="mdi:export-variant" />
                </IconButton>
              </Tooltip>
            )}
            {onClearChat && (
              <Tooltip title="Clear Conversation">
                <IconButton
                  onClick={onClearChat}
                  sx={{
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                      color: 'error.main',
                    },
                  }}
                >
                  <Iconify icon="mdi:trash-can-outline" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Connection Info */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              fontFamily: 'monospace',
              bgcolor: (theme: Theme) => alpha(theme.palette.grey[500], 0.08),
              px: 1,
              borderRadius: 1,
            }}
          >
            <Iconify icon="mdi:server-network" width={14} sx={{ mr: 0.5 }} />
            {source.host}:{source.port}/{source.databaseName}
          </Typography>
        </Stack>
      </Box>

      {/* Chat Messages Area */}
      <Box
        ref={chatContainerRef}
        onScroll={handleScroll}
        component={m.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        sx={{
          flexGrow: 1,
          height: 0,
          p: 3,
          overflow: 'auto',
          bgcolor: (theme: Theme) => alpha(theme.palette.background.default, 0.4),
          backgroundImage:
            'radial-gradient(circle at 10% 10%, rgba(145, 158, 171, 0.05) 0%, transparent 50%)',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            bgcolor: (theme: Theme) => alpha(theme.palette.grey[500], 0.24),
          },
        }}
      >
        {messages.map((message, index) => (
          <m.div
            key={index}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ChatMessage message={message} />
          </m.div>
        ))}

        {isLoading && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BotLoadingMessage />
          </m.div>
        )}
      </Box>

      {/* Enhanced Input Area */}
      <Box
        component={m.div}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        sx={{
          p: 2,
          borderTop: (theme: Theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.9),
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: 2,
                bgcolor: (theme: Theme) => alpha(theme.palette.grey[500], 0.08),
                backdropFilter: 'blur(4px)',
                border: (theme: Theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                '&:hover': {
                  bgcolor: (theme: Theme) => alpha(theme.palette.grey[500], 0.12),
                },
              },
            }}
          >
            <ChatMessageInput
              onSend={onSendMessage}
              disabled={!isConnected || isLoading}
              placeholder={isConnected ? 'Ask about your database...' : 'Connecting to database...'}
            />
          </Box>
          {isLoading && (
            <CircularProgress
              size={20}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Animated Scroll Button */}
      {showScrollButton && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <FloatingButton onClick={scrollToBottom} color="primary">
            <Iconify icon="mdi:arrow-collapse-down" />
          </FloatingButton>
        </m.div>
      )}
    </Stack>
  );
}
