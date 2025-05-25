import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Stack,
  Table,
  alpha,
  Button,
  Dialog,
  styled,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import axios, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

// Types
interface Owner {
  id: number;
  username: string;
}

interface OwnerManagementProps {
  sourceId: string;
  onOwnersChange: () => void;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: theme.customShadows.z16,
  overflow: 'hidden',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.customShadows.z24,
  },
}));

// Owner dialog component props
interface OwnerDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (username: string) => void;
  sourceId: string;
}

// Owner dialog component
const OwnerDialog = ({ open, onClose, onSave, sourceId }: OwnerDialogProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateUser = async (updateUsername: string) => {
    if (!updateUsername.trim()) {
      throw new Error('Username is required');
    }

    // Check if user exists
    const userResponse = await axios.get(`/api/v1/users/check-username/${updateUsername}`);
    if (!userResponse.data) {
      throw new Error('User not found');
    }

    // Check if user is already an owner
    const ownersResponse = await axios.get(endpoints.dataSource.owners.list(sourceId));
    const existingOwner = ownersResponse.data.find(
      (owner: Owner) => owner.username.toLowerCase() === updateUsername.toLowerCase()
    );
    
    if (existingOwner) {
      throw new Error('User is already an owner');
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      await validateUser(username);
      onSave(username);
      setUsername('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add Owner</DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error}
            autoFocus
            disabled={isSubmitting}
          />
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function OwnerManagement({ sourceId, onOwnersChange }: OwnerManagementProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  // Load owners
  const loadOwners = useCallback(async () => {
    try {
      const response = await axios.get(endpoints.dataSource.owners.list(sourceId));
      setOwners(response.data);
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  }, [sourceId]);

  // Load owners on mount
  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  // Add owner
  const handleAddOwner = async (username: string) => {
    try {
      await axios.post(endpoints.dataSource.owners.create(sourceId, username));
      await loadOwners();
      onOwnersChange();
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  };

  // Remove owner
  const handleRemoveOwner = async (ownerId: number) => {
    try {
      await axios.delete(endpoints.dataSource.owners.delete(sourceId, ownerId.toString()));
      await loadOwners();
      onOwnersChange();
    } catch (error) {
      console.error('Error removing owner:', error);
    }
  };

  return (
    <StyledCard>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                p: 1,
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Iconify
                icon="eva:shield-fill"
                width={24}
                height={24}
                sx={{ color: 'primary.main' }}
              />
            </Box>
            <Typography variant="h6">Owners</Typography>
          </Stack>

          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setOpenDialog(true)}
          >
            Add Owner
          </Button>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>{owner.id}</TableCell>
                  <TableCell>{owner.username}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveOwner(owner.id)}
                      >
                        <Iconify icon="eva:trash-2-fill" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {owners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" sx={{ py: 3 }}>
                      No owners found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <OwnerDialog 
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleAddOwner}
        sourceId={sourceId}
      />
    </StyledCard>
  );
} 