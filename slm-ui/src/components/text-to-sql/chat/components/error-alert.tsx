import { alpha, styled } from '@mui/material/styles';
import { Zoom, Alert, Tooltip, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

const ErrorAlert = styled(Alert)(({ theme }) => ({
  margin: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
  width: 'calc(100% - 32px)',
  maxWidth: '100%',
  overflowX: 'auto',
  boxShadow: `0 4px 12px 0 ${alpha(theme.palette.error.main, 0.1)}`,
}));

interface ErrorAlertProps {
  error: string | null;
  pendingMessage?: string | null;
  onClearError: () => void;
  onRetry?: () => void;
}

export function ErrorAlertComponent({ error, pendingMessage, onClearError, onRetry }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <Zoom in>
      <ErrorAlert 
        severity="error" 
        onClose={onClearError}
        action={
          onRetry && pendingMessage ? (
            <Tooltip title="Retry">
              <IconButton
                aria-label="retry"
                size="small"
                onClick={() => {
                  onClearError();
                  onRetry();
                }}
              >
                <Iconify icon="eva:refresh-fill" />
              </IconButton>
            </Tooltip>
          ) : undefined
        }
      >
        {error}
      </ErrorAlert>
    </Zoom>
  );
}