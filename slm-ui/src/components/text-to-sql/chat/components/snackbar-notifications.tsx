import { Alert, Snackbar } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

interface SnackbarNotificationsProps {
  snackbar: SnackbarState;
  onClose: () => void;
}

export function SnackbarNotifications({ snackbar, onClose }: SnackbarNotificationsProps) {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        severity={snackbar.severity} 
        onClose={onClose}
        variant="filled"
        sx={{
          borderRadius: 2,
          boxShadow: (t) => t.customShadows?.z20,
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}