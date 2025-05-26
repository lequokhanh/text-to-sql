import { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Paper,
  alpha,
  Button,
  Dialog,
  styled,
  Tooltip,
  Checkbox,
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

import { useDebounce } from 'src/hooks/use-debounce';

import axios, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// Types
interface BasicGroup {
  id: number;
  name: string;
}

interface Member {
  id: number;
  username: string;
}

interface Group extends BasicGroup {
  tableIds: number[];
  members: Member[];
  name: string;
}

interface GroupManagementProps {
  sourceId: string;
  tables?: { id: number; tableIdentifier: string }[];
  onGroupsChange: () => void;
}

interface MemberChanges {
  added: Member[];
  removed: Member[];
}

interface GroupUpdateData extends Partial<Group> {
  memberChanges?: {
    added: string[];
    removed: string[];
  };
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

// Group dialog component props
interface GroupDialogProps {
  open: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
  onSave: (group: GroupUpdateData) => void;
  tables?: { id: number; tableIdentifier: string }[];
  nameInputRef: React.RefObject<HTMLInputElement>;
}

// Group dialog component
const GroupDialog = ({
  open,
  onClose,
  selectedGroup,
  onSave,
  tables = [],
  nameInputRef,
}: GroupDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [newGroup, setNewGroup] = useState<Partial<Group>>({
    name: '',
    tableIds: []
  });
  
  // Reset form when dialog opens with selected group
  useEffect(() => {
    if (selectedGroup) {
      setNewGroup({
        id: selectedGroup.id,
        name: selectedGroup.name,
        tableIds: selectedGroup.tableIds,
        members: selectedGroup.members
      });
    } else {
      setNewGroup({
        name: '',
        tableIds: []
      });
    }
  }, [selectedGroup]);

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [inputError, setInputError] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
  }>({});
  const [memberChanges, setMemberChanges] = useState<MemberChanges>({
    added: [],
    removed: []
  });

  // Reset member changes when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMemberChanges({ added: [], removed: [] });
    }
  }, [open]);

  // Fetch current user when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(endpoints.auth.me);
        setCurrentUser(response.data.username || '');
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const validateAndAddUser = useCallback(async (username: string) => {
    if (!username.trim()) return false;
    
    setIsProcessing(true);
    setInputError('');

    try {
      // Check if user is current user
      if (username.toLowerCase() === currentUser.toLowerCase()) {
        const error = 'Cannot add current user';
        setInputError(error);
        enqueueSnackbar(error, { variant: 'error' });
        return false;
      }

      // Check if user is already in original members or newly added members
      const isExistingMember = newGroup.members?.some(member => member.username.toLowerCase() === username.toLowerCase()) ||
        memberChanges.added.some(member => member.username.toLowerCase() === username.toLowerCase());

      if (isExistingMember) {
        const error = 'User is already in group';
        setInputError(error);
        enqueueSnackbar(error, { variant: 'error' });
        return false;
      }

      // Check if user exists in system
      const response = await axios.get(`/api/v1/users/check-username/${username}`);
      if (!response.data) {
        const error = 'User not found';
        setInputError(error);
        enqueueSnackbar(error, { variant: 'error' });
        return false;
      }

      // Add user to added list
      const newMember = {
        id: response.data.id,
        username
      };

      setMemberChanges(prev => ({
        ...prev,
        added: [...prev.added, newMember],
        // If user was previously removed, remove them from the removed list
        removed: prev.removed.filter(m => m.username.toLowerCase() !== username.toLowerCase())
      }));

      enqueueSnackbar('User added successfully', { variant: 'success' });
      return true;
    } catch (error) {
      console.error('Error validating username:', error);
      const errorMessage = error ?? 'Error checking username';
      setInputError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, newGroup.members, memberChanges, enqueueSnackbar]);

  const handleRemoveMember = (member: Member) => {
    const isNewlyAdded = memberChanges.added.some(m => m.id === member.id);
    const isAlreadyRemoved = memberChanges.removed.some(m => m.id === member.id);

    setMemberChanges(prev => ({
      ...prev,
      added: isNewlyAdded ? prev.added.filter(m => m.id !== member.id) : prev.added,
      removed: !isNewlyAdded && !isAlreadyRemoved ? [...prev.removed, member] : prev.removed
    }));
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; } = {};
    let isValid = true;

    if (!newGroup.name?.trim()) {
      errors.name = 'Group name is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = () => {
    if (validateForm()) {
      try {
        // If editing, include member changes
        if (selectedGroup) {
          onSave({
            ...newGroup,
            memberChanges: {
              added: memberChanges.added.map(m => m.username),
              removed: memberChanges.removed.map(m => m.username)
            }
          });
        } else {
          // If creating, just send basic info
          onSave(newGroup);
        }
        enqueueSnackbar(selectedGroup ? 'Group updated successfully' : 'Group created successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error saving group:', error);
        enqueueSnackbar(error, { variant: 'error' });
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {selectedGroup ? 'Edit Group' : 'Create New Group'}
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Group Name"
            value={newGroup.name}
            onChange={(e) => {
              setNewGroup({ ...newGroup, name: e.target.value });
              if (formErrors.name) {
                setFormErrors(prev => ({ ...prev, name: undefined }));
              }
            }}
            inputRef={nameInputRef}
            autoFocus
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
          />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Accessible Tables
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                maxHeight: 200, 
                overflow: 'auto',
              }}
            >
              <Box sx={{ mb: 1 }}>
                <Checkbox
                  checked={newGroup.tableIds?.length === 0}
                  onChange={(e) => {
                    setNewGroup(prev => ({
                      ...prev,
                      tableIds: e.target.checked ? [] : tables.map(t => t.id)
                    }));
                  }}
                />
                <Typography 
                  component="span"
                  sx={{ 
                    fontWeight: 'bold',
                    color: theme => theme.palette.primary.main
                  }}
                >
                  All Tables
                </Typography>
              </Box>
              
              {tables.map((table) => (
                <Box key={table.id} sx={{ mb: 1 }}>
                  <Checkbox
                    checked={newGroup.tableIds?.includes(table.id)}
                    onChange={(e) => {
                      const updatedTableIds = e.target.checked
                        ? [...(newGroup.tableIds || []), table.id]
                        : (newGroup.tableIds || []).filter((id) => id !== table.id);
                      setNewGroup({ ...newGroup, tableIds: updatedTableIds });
                    }}
                    disabled={newGroup.tableIds?.length === 0}
                  />
                  <Typography component="span">{table.tableIdentifier}</Typography>
                </Box>
              ))}
            </Paper>
          </Box>

          {selectedGroup && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Group Members
              </Typography>
              <TextField
                fullWidth
                placeholder="Type username and press Enter"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (inputValue.trim()) {
                      const success = await validateAndAddUser(inputValue.trim());
                      if (success) {
                        setInputValue('');
                      }
                    }
                  }
                }}
                error={!!inputError}
                helperText={inputError}
                disabled={isProcessing}
              />
              <Box sx={{ mt: 2 }}>
                {/* Show original members that haven't been removed */}
                {newGroup.members?.filter(member => 
                  !memberChanges.removed.some(m => m.id === member.id)
                ).map((member) => (
                  <Chip
                    key={member.id}
                    label={member.username}
                    onDelete={() => handleRemoveMember(member)}
                    sx={{ m: 0.5 }}
                  />
                ))}
                {/* Show newly added members */}
                {memberChanges.added.map((member) => (
                  <Chip
                    key={member.id}
                    label={member.username}
                    onDelete={() => handleRemoveMember(member)}
                    color="primary"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
        >
          {selectedGroup ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function GroupManagement({ sourceId, tables = [], onGroupsChange }: GroupManagementProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [groups, setGroups] = useState<BasicGroup[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Refs for cursor optimization
  const nameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load basic group list
  const loadGroups = useCallback(async () => {
    try {
      const response = await axios.get(endpoints.dataSource.groups.base(sourceId));
      setGroups(response.data.map((group: Group) => ({ id: group.id, name: group.name })));
    } catch (error) {
      console.error('Error loading groups:', error);
      enqueueSnackbar(error, { variant: 'error' });
    }
  }, [sourceId, enqueueSnackbar]);

  // Load group details
  const loadGroupDetails = async (groupId: number) => {
    setIsLoading(true);
    try {
      const response = await axios.get(endpoints.dataSource.groups.details(groupId.toString()));
      setSelectedGroup(response.data);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error loading group details:', error);
      enqueueSnackbar(error, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Create/Update group
  const handleSaveGroup = async (group: GroupUpdateData) => {
    try {
      const isNew = !group.id;
      const { memberChanges, ...groupData } = group;

      if (isNew) {  
        await axios.post(endpoints.dataSource.groups.base(sourceId), groupData);
      } else {
        await axios.put(endpoints.dataSource.groups.update(sourceId, group.id!.toString()), {
            ...groupData
          });
        }

      // Handle member changes only if there are actual changes
      if (memberChanges?.removed && memberChanges.removed.length > 0) {
        await axios.delete(endpoints.dataSource.groups.members.delete(sourceId, group.id!.toString()), {
          data: {
            usernames: memberChanges.removed
          }
        });
      }
      if (memberChanges?.added && memberChanges.added.length > 0) {
        await axios.post(endpoints.dataSource.groups.members.base(sourceId, group.id!.toString()), {
          usernames: memberChanges.added
        });
      }

      await loadGroups();
      onGroupsChange();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving group:', error);
      throw error;
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: number) => {
    try {
      await axios.delete(endpoints.dataSource.groups.details(groupId.toString()));
      await loadGroups();
      onGroupsChange();
      enqueueSnackbar('Group deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting group:', error);
      enqueueSnackbar(error, { variant: 'error' });
    }
  };

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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
                icon="eva:people-fill"
                width={24}
                height={24}
                sx={{ color: 'primary.main' }}
              />
            </Box>
            <Typography variant="h6">Access Groups</Typography>
          </Stack>

          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => {
              setSelectedGroup(null);
              setOpenDialog(true);
            }}
          >
            New Group
          </Button>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search groups..."
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />,
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          inputRef={searchInputRef}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups
                .filter((group) =>
                  group.name.toLowerCase().includes((debouncedSearch || '').toLowerCase())
                )
                .map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.id}</TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => loadGroupDetails(group.id)}
                          disabled={isLoading}
                          startIcon={<Iconify icon="eva:eye-fill" />}
                        >
                          View Details
                        </Button>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Iconify icon="eva:trash-2-fill" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <GroupDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        selectedGroup={selectedGroup}
        onSave={handleSaveGroup}
        tables={tables}
        nameInputRef={nameInputRef}
      />
    </StyledCard>
  );
} 