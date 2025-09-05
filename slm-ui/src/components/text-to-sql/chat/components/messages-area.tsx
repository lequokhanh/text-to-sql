import { Box } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

export const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  width: '100%',
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  scrollBehavior: 'smooth',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 4,
    backgroundColor: alpha(theme.palette.grey[500], 0.2),
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: alpha(theme.palette.grey[500], 0.3),
    },
  },
}));