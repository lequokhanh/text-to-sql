// File: src/components/text-to-sql/chat/enhanced-chat-input.tsx
import { useRef, useState, useEffect } from 'react';

import { alpha, styled } from '@mui/material/styles';
import {
  Box,
  Chip,
  Paper,
  Stack,
  useTheme,
  InputBase,
  IconButton,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const StyledPaper = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: theme.transitions.create(['border-color', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
  '&.focused': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(1.5, 2),
  fontSize: '0.875rem',
  lineHeight: 1.5,
  '& .MuiInputBase-input': {
    padding: 0,
    '&::placeholder': {
      opacity: 0.7,
      color: theme.palette.text.secondary,
    },
  },
}));

const SendButton = styled(IconButton)(({ theme }) => ({
  width: 44,
  height: 44,
  margin: theme.spacing(0.5),
  borderRadius: theme.spacing(1.5),
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'scale(1.05)',
  },
  '&.Mui-disabled': {
    transform: 'none',
  },
}));

interface EnhancedChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  disableSend?: boolean;
  sessionInfo?: {
    sessionId: string;
    messageCount: number;
  } | null;
  showSuggestions?: boolean;
}

export default function ChatMessageInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question to start a new chat...',
  disableSend = false,
  sessionInfo = null,
  showSuggestions = false,
}: EnhancedChatInputProps) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);

  // Sample suggestions for new chats
  const suggestions = [
    "What are the top 5 products by sales?",
    "Show me revenue by month",
    "List customers with high order values",
    "Which regions have the best performance?",
  ];

  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() || disabled || disableSend) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
  };

  return (
    <Box>
      {/* Session Info */}
      {sessionInfo && (
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={`Session ${sessionInfo.sessionId} • ${sessionInfo.messageCount} exchanges`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      )}

      {/* Input Area */}
      <StyledPaper
        elevation={0}
        className={focused ? 'focused' : ''}
        sx={{
          backgroundColor: alpha(theme.palette.grey[500], 0.08),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <StyledInput
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          multiline
          maxRows={4}
          startAdornment={
            <Iconify
              icon="eva:message-square-outline"
              width={20}
              height={20}
              sx={{
                mr: 1,
                color: disabled ? 'text.disabled' : 'text.secondary',
              }}
            />
          }
        />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 1 }}>
          {message.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                opacity: 0.7,
                minWidth: 'fit-content',
              }}
            >
              {message.length}
            </Typography>
          )}

          <SendButton
            onClick={handleSend}
            disabled={!message.trim() || disabled || disableSend}
            sx={{
              backgroundColor: message.trim() && !disabled && !disableSend
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
              color: message.trim() && !disabled && !disableSend
                ? 'primary.main'
                : 'text.disabled',
              '&:hover': {
                backgroundColor: message.trim() && !disabled && !disableSend
                  ? alpha(theme.palette.primary.main, 0.2)
                  : 'transparent',
              },
            }}
          >
            <Iconify icon="eva:paper-plane-fill" width={20} height={20} />
          </SendButton>
        </Stack>
      </StyledPaper>

      {/* Suggestions */}
      {showSuggestions && !sessionInfo && !message && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Try asking:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}