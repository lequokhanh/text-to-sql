import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

import ChatMessageList from '../chat/chat-message-list';
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
};

export default function ChatSection({
  source,
  messages,
  onSendMessage,
  onClearChat,
  onExportChat,
  isConnected = true,
  messageCount = 0,
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
              <Typography variant="h6">{source.name}</Typography>
              <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                <Badge
                  variant="dot"
                  color={isConnected ? 'success' : 'error'}
                  sx={{ '& .MuiBadge-badge': { right: -4, top: 8 } }}
                >
                  <Chip size="small" label={source.databaseType} sx={{ height: 24 }} />
                </Badge>
              </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Database Connection">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {source.host}:{source.port}/{source.databaseName}
                </Typography>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Tooltip title="Total Messages">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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

      {/* Chat Area with improved styling */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          bgcolor: (theme) => theme.palette.background.default,
        }}
      >
        <ChatMessageList messages={messages} />
      </Box>

      {/* Enhanced Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.background.neutral,
        }}
      >
        <ChatMessageInput
          onSend={onSendMessage}
          disabled={!isConnected}
          placeholder={isConnected ? 'Type your message...' : 'Reconnecting to database...'}
        />
      </Box>
    </Stack>
  );
}
