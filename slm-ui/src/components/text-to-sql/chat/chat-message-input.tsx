import { useRef, useState, useEffect } from 'react';

import { alpha, styled } from '@mui/material/styles';
import {
  Box,
  Paper,
  Stack,
  Button,
  useTheme,
  Skeleton,
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
  padding: theme.spacing(1, 2),
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  minHeight: '60px',
  maxHeight: '160px',
  overflowY: 'auto',
  '& .MuiInputBase-input': {
    padding: 0,
    '&::placeholder': {
      opacity: 0.7,
      color: theme.palette.text.secondary,
      fontSize: '0.9375rem',
    },
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: '2px',
    backgroundColor: alpha(theme.palette.grey[500], 0.2),
    '&:hover': {
      backgroundColor: alpha(theme.palette.grey[500], 0.3),
    },
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

const SendButton = styled(IconButton)(({ theme }) => ({
  width: 36,
  height: 36,
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
  suggestions?: string[];
  newChat?: boolean;
  onRefreshSuggestions?: () => void;
  isSuggestionsLoading?: boolean;
}

export default function ChatMessageInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question to start a new chat...',
  disableSend = false,
  sessionInfo = null,
  suggestions = [],
  newChat = false,
  onRefreshSuggestions,
  isSuggestionsLoading = false,
}: EnhancedChatInputProps) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);

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

  return (
    <Box>
      {/* Suggestions */}
      {!newChat && !disabled && !disableSend && (suggestions.length > 0 || onRefreshSuggestions) && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {onRefreshSuggestions && (
            <IconButton
              size="small"
              onClick={onRefreshSuggestions}
              disabled={isSuggestionsLoading}
              sx={{
                color: 'text.secondary',
                mt: 0.5, // Small margin to align with suggestion chips
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
                },
              }}
            >
              <Iconify 
                icon="eva:refresh-fill" 
                width={16} 
                height={16}
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
          )}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              flex: 1,
            }}
          >
            {isSuggestionsLoading ? (
              // Show skeleton chips while loading
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={80 + Math.random() * 60} // Random widths between 80-140px
                  height={32}
                  sx={{
                    borderRadius: '20px',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                  }}
                />
              ))
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionChip 
                  key={suggestion} 
                  onClick={() => onSend(suggestion)}
                >
                  <Typography variant="caption">
                    {suggestion}
                  </Typography>
                </SuggestionChip>
              ))
            )}
          </Box>
        </Box>
      )}
      {/* Input Area */}
      <StyledPaper
        elevation={0}
        className={focused ? 'focused' : ''}
        sx={{
          backgroundColor: alpha(theme.palette.grey[500], 0.08),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          minHeight: '60px',
          display: 'flex',
          alignItems: 'flex-start',
          pt: 0.5,
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
          maxRows={6}
          startAdornment={
            <Iconify
              icon="eva:message-square-outline"
              width={18}
              height={18}
              sx={{
                mr: 1,
                mt: 0.75,
                color: disabled ? 'text.disabled' : 'text.secondary',
              }}
            />
          }
        />

        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mr: 1, mt: 0.75 }}>
          {message.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                opacity: 0.7,
                minWidth: 'fit-content',
                fontSize: '0.8125rem',
              }}
            >
              {message.length}
            </Typography>
          )}


          <SendButton
            onClick={handleSend}
            disabled={!message.trim() || disabled || disableSend}
            sx={{
              width: 36,
              height: 36,
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
            <Iconify icon="eva:paper-plane-fill" width={18} height={18} />
          </SendButton>
        </Stack>
      </StyledPaper>

    </Box>
  );
}