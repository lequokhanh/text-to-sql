import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

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

// Custom Message component to handle bot messages with SQL and table results
const ChatMessage = ({ message }: { message: IChatMessage }) => {
  const theme = useTheme();
  const [showFullResults, setShowFullResults] = useState(false);

  const isBot = message.senderId === 'bot';
  const isError = isBot && message.body.includes('## Error');

  if (!isBot) {
    return (
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 3 }}>
        <Paper
          sx={{
            p: 2,
            maxWidth: '80%',
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            borderRadius: 2,
            boxShadow: theme.customShadows?.z8,
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
      <Stack direction="row" sx={{ mb: 3 }}>
        <Card
          sx={{
            width: '80%',
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.error.main}`,
            boxShadow: theme.customShadows?.z8,
          }}
        >
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
      <Stack direction="row" sx={{ mb: 3 }}>
        <Paper
          sx={{
            p: 2,
            maxWidth: '80%',
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: theme.customShadows?.z8,
          }}
        >
          <Markdown>{message.body}</Markdown>
        </Paper>
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
              hasTableData && (
                <IconButton
                  size="small"
                  onClick={() => setShowFullResults(!showFullResults)}
                  title={showFullResults ? 'Show less' : 'Show all results'}
                >
                  <Iconify icon={showFullResults ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                </IconButton>
              )
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
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
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
                    </TableHead>
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
  return (
    <Stack sx={{ height: '100%' }}>
      {/* Enhanced Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.background.neutral,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:database-fill" width={24} height={24} color="primary.main" />
              <Typography variant="h6">{source.name}</Typography>
              <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                <Badge
                  variant="dot"
                  color={isConnected ? 'success' : 'error'}
                  sx={{ '& .MuiBadge-badge': { right: -4, top: 8 } }}
                >
                  <Chip
                    size="small"
                    label={source.databaseType}
                    sx={{
                      height: 24,
                      fontWeight: 'bold',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    }}
                  />
                </Badge>
              </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Database Connection">
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}
                >
                  <Iconify icon="eva:link-2-fill" width={14} height={14} sx={{ mr: 0.5 }} />
                  {source.host}:{source.port}/{source.databaseName}
                </Typography>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Tooltip title="Total Messages">
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}
                >
                  <Iconify icon="eva:message-circle-fill" width={14} height={14} sx={{ mr: 0.5 }} />
                  {messageCount} messages
                </Typography>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            {onExportChat && (
              <Tooltip title="Export Chat">
                <IconButton onClick={onExportChat} size="small">
                  <Iconify icon="eva:download-outline" />
                </IconButton>
              </Tooltip>
            )}
            {onClearChat && (
              <Tooltip title="Clear Chat">
                <IconButton
                  onClick={onClearChat}
                  size="small"
                  color="error"
                  sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                >
                  <Iconify icon="eva:trash-2-outline" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Chat Area with custom message components */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: (theme) => theme.palette.background.default,
          p: 3,
        }}
      >
        {messages.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%', color: 'text.secondary' }}
          >
            <Iconify
              icon="eva:message-square-outline"
              width={40}
              height={40}
              sx={{ opacity: 0.3, mb: 2 }}
            />
            <Typography variant="body2">
              No messages yet. Ask a question about your database.
            </Typography>
          </Stack>
        ) : (
          messages.map((message, index) => <ChatMessage key={index} message={message} />)
        )}
      </Box>

      {/* Enhanced Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.background.neutral,
          position: 'relative',
        }}
      >
        {(() => {
          let placeholderText = 'Reconnecting to database...';
          if (isLoading) {
            placeholderText = 'Processing your request...';
          } else if (isConnected) {
            placeholderText = 'Ask a question about your database...';
          }

          return (
            <ChatMessageInput
              onSend={onSendMessage}
              disabled={!isConnected || isLoading}
              placeholder={placeholderText}
            />
          );
        })()}

        {isLoading && (
          <CircularProgress
            size={20}
            sx={{
              position: 'absolute',
              right: 24,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        )}
      </Box>
    </Stack>
  );
}
