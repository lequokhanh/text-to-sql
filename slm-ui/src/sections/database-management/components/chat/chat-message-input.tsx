// File: src/sections/database-management/components/chat/ChatMessageInput.tsx

import { useRef, useState, useEffect } from 'react';

import {
  Box,
  Paper,
  Stack,
  alpha,
  Tooltip,
  useTheme,
  InputBase,
  IconButton,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';

interface ChatMessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  disableSend?: boolean;
}

export default function ChatMessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  initialValue = '',
  disableSend = false,
}: ChatMessageInputProps) {
  const theme = useTheme();
  const [message, setMessage] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() || disabled || disableSend) return;

    onSend(message.trim());
    setMessage('');
  };

  return (
    <Paper
      sx={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        boxShadow: 'none',
        borderRadius: 2,
        bgcolor: 'transparent',
      }}
    >
      <InputBase
        inputRef={inputRef}
        fullWidth
        value={message}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        disabled={disabled}
        placeholder={placeholder}
        sx={{
          px: 2,
          py: 1.5,
          height: 56,
          fontSize: '0.875rem',
          fontWeight: 400,
          lineHeight: 1.5,
          transition: theme.transitions.create(['box-shadow', 'background-color']),
          '&.Mui-focused': {
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
          },
          '& .MuiInputBase-input': {
            '&::placeholder': {
              opacity: 0.7,
              color: theme.palette.text.secondary,
            },
          },
        }}
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
        endAdornment={
          <Stack direction="row" spacing={1} alignItems="center">
            {message.length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  opacity: 0.7,
                }}
              >
                {message.length}
              </Typography>
            )}
            <Tooltip title="Send message">
              <Box sx={{ display: 'inline-flex' }}>
                <IconButton
                  color="primary"
                  disabled={!message.trim() || disabled || disableSend}
                  onClick={handleSend}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: () =>
                      message.trim() && !disabled && !disableSend
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                    '&:hover': {
                      bgcolor: () =>
                        message.trim() && !disabled && !disableSend
                          ? alpha(theme.palette.primary.main, 0.2)
                          : 'transparent',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.48,
                    },
                  }}
                >
                  <Iconify icon="eva:paper-plane-fill" width={20} height={20} />
                </IconButton>
              </Box>
            </Tooltip>
          </Stack>
        }
      />
    </Paper>
  );
}
