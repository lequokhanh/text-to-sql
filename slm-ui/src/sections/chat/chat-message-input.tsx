import { useState, useCallback } from 'react';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
};

export default function ChatMessageInput({
  onSend,
  disabled,
  placeholder = 'Type your message here...',
  loading = false,
}: Props) {
  const [message, setMessage] = useState('');
  const isDisabled = disabled || loading;

  const handleChangeMessage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;

    if (onSend) {
      onSend(message);
    }
    setMessage('');
  }, [message, onSend]);

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <Paper
      sx={{
        p: 1,
        borderRadius: 2,
        boxShadow: '0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <InputBase
          fullWidth
          value={message}
          onKeyUp={handleKeyUp}
          onChange={handleChangeMessage}
          placeholder={placeholder}
          disabled={isDisabled}
          sx={{ px: 1 }}
        />

        <IconButton
          color="primary"
          disabled={!message.trim() || isDisabled}
          onClick={handleSend}
          sx={{
            position: 'relative',
            '&.Mui-disabled': {
              color: 'text.disabled',
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={24}
              sx={{
                color: 'primary.main',
                position: 'absolute',
              }}
            />
          ) : (
            <Iconify icon="ic:round-send" />
          )}
        </IconButton>
      </Stack>
    </Paper>
  );
}
