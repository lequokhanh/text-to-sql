// File: src/sections/database-management/components/chat/ChatSection.tsx

import { m } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, styled, useTheme } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

import ChatMessageInput from './chat-message-input';
import { ChatMessage, BotLoadingMessage } from './chat-message';

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
  fontWeight: 600,
  fontSize: '0.75rem',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiChip-label': {
    color: theme.palette.primary.dark,
    px: 1,
  },
}));

// ============================== Main Component ==============================

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
  const theme = useTheme();
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
          borderBottom: () => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: () => alpha(theme.palette.background.default, 0.9),
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
            {onExportChat && messageCount > 0 && (
              <Tooltip title="Export Chat History">
                <IconButton
                  onClick={onExportChat}
                  sx={{
                    '&:hover': {
                      bgcolor: () => alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                    },
                  }}
                >
                  <Iconify icon="mdi:export-variant" />
                </IconButton>
              </Tooltip>
            )}
            {onClearChat && messageCount > 0 && (
              <Tooltip title="Clear Conversation">
                <IconButton
                  onClick={onClearChat}
                  sx={{
                    '&:hover': {
                      bgcolor: () => alpha(theme.palette.error.main, 0.1),
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
              fontSize: '0.75rem',
              bgcolor: () => alpha(theme.palette.grey[500], 0.08),
              px: 1.5,
              py: 0.5,
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
          bgcolor: () => alpha(theme.palette.background.default, 0.4),
          backgroundImage:
            'radial-gradient(circle at 10% 10%, rgba(145, 158, 171, 0.05) 0%, transparent 50%)',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            bgcolor: () => alpha(theme.palette.grey[500], 0.24),
          },
        }}
      >
        {messages.length === 0 && !isLoading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              height: '100%',
              color: 'text.secondary',
              p: 2,
            }}
          >
            <Box
              sx={{
                p: 3,
                mb: 2,
                borderRadius: '50%',
                bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="mdi:message-text-outline"
                width={40}
                height={40}
                sx={{ color: 'text.disabled' }}
              />
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Start a new conversation
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 400 }}>
              Ask questions about your database in natural language. For example:
            </Typography>
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: () => alpha(theme.palette.grey[500], 0.08),
                borderRadius: 1,
                width: '100%',
                maxWidth: 400,
              }}
            >
              <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                {`"What were the top 5 sales by revenue last month?"`}
              </Typography>
            </Box>
          </Stack>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {isLoading && <BotLoadingMessage />}
      </Box>

      {/* Enhanced Input Area */}
      <Box
        component={m.div}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        sx={{
          p: 2,
          borderTop: () => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: () => alpha(theme.palette.background.default, 0.9),
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
                bgcolor: () => alpha(theme.palette.grey[500], 0.08),
                backdropFilter: 'blur(4px)',
                border: () => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                '&:hover': {
                  bgcolor: () => alpha(theme.palette.grey[500], 0.12),
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
