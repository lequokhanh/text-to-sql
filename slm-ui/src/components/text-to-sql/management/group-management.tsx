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
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useDebounce } from 'src/hooks/use-debounce';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

// Types
interface Group {
  id: string;
  name: string;
  description: string;
  tables: string[] | null;
  members: User[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface GroupManagementProps {
  sourceId: string;
  tables?: string[];
  onGroupsChange: () => void;
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
  onSave: (group: Partial<Group>) => void;
  tables?: string[];
  nameInputRef: React.RefObject<HTMLInputElement>;
  descriptionInputRef: React.RefObject<HTMLInputElement>;
}

// Group dialog component
const GroupDialog = ({
  open,
  onClose,
  selectedGroup,
  onSave,
  tables = [],
  nameInputRef,
  descriptionInputRef,
}: GroupDialogProps) => {
  const [newGroup, setNewGroup] = useState<Partial<Group>>(
    selectedGroup || {
      name: '',
      description: '',
      tables: [],
      members: [],
    }
  );
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [inputError, setInputError] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    tables?: string;
  }>({});

  // Fetch current user when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get(endpoints.auth.me);
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
        setInputError('Cannot add current user');
        return false;
      }

      // Check if user is already in group
      if (newGroup.members?.some(member => member.name.toLowerCase() === username.toLowerCase())) {
        setInputError('User is already in group');
        return false;
      }

      // Check if user exists in system
      const response = await axiosInstance.get(`/api/v1/users/check-username/${username}`);
      if (!response.data) {
        setInputError('User not found');
        return false;
      }

      // Add user to group
      const newMember = {
        id: username,
        name: username,
        email: ''
      };

      setNewGroup(prev => ({
        ...prev,
        members: [...(prev.members || []), newMember]
      }));

      return true;
    } catch (error) {
      console.error('Error validating username:', error);
      setInputError('Error checking username');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, newGroup.members]);

  const validateForm = (): boolean => {
    const errors: { name?: string; tables?: string } = {};
    let isValid = true;

    // Validate group name
    if (!newGroup.name?.trim()) {
      errors.name = 'Group name is required';
      isValid = false;
    }

    // Validate tables (either some tables selected or "All Tables" option)
    if (newGroup.tables !== null && (!newGroup.tables || newGroup.tables.length === 0)) {
      errors.tables = 'Please select at least one table or choose "All Tables"';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(newGroup);
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
              // Clear error when user types
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
          
          <TextField
            fullWidth
            label="Description"
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            inputRef={descriptionInputRef}
            multiline
            rows={2}
          />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Accessible Tables <span style={{ color: 'error.main' }}>*</span>
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                maxHeight: 200, 
                overflow: 'auto',
                borderColor: formErrors.tables ? 'error.main' : undefined
              }}
            >
              <Box sx={{ mb: 1 }}>
                <Checkbox
                  checked={newGroup.tables === null}
                  onChange={(e) => {
                    setNewGroup(prev => ({
                      ...prev,
                      tables: e.target.checked ? null : []
                    }));
                    // Clear error when user selects "All Tables"
                    if (formErrors.tables) {
                      setFormErrors(prev => ({ ...prev, tables: undefined }));
                    }
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
              
              {newGroup.tables !== null && (tables || []).map((table) => (
                <Box key={table} sx={{ mb: 1 }}>
                  <Checkbox
                    checked={(newGroup.tables || []).includes(table)}
                    onChange={(e) => {
                      const updatedTables = e.target.checked
                        ? [...(newGroup.tables || []), table]
                        : (newGroup.tables || []).filter((t) => t !== table);
                      setNewGroup({ ...newGroup, tables: updatedTables });
                      // Clear error when user selects tables
                      if (formErrors.tables) {
                        setFormErrors(prev => ({ ...prev, tables: undefined }));
                      }
                    }}
                    disabled={newGroup.tables === null}
                  />
                  <Typography component="span">{table}</Typography>
                </Box>
              ))}
              {formErrors.tables && (
                <Typography 
                  variant="caption" 
                  color="error" 
                  sx={{ display: 'block', mt: 1 }}
                >
                  {formErrors.tables}
                </Typography>
              )}
            </Paper>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Group Members
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              value={newGroup.members || []}
              onChange={(_, newValue) => {
                setNewGroup(prev => ({
                  ...prev,
                  members: newValue.filter((item): item is User => typeof item !== 'string')
                }));
              }}
              inputValue={inputValue}
              onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
              }}
              onKeyDown={async (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (inputValue.trim()) {
                    const success = await validateAndAddUser(inputValue.trim());
                    if (success) {
                      setInputValue('');
                    }
                  }
                }
              }}
              options={[]}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.name;
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={typeof option === 'string' ? option : option.name}
                    {...getTagProps({ index })}
                    key={typeof option === 'string' ? option : option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type username and press Enter"
                  error={!!inputError}
                  helperText={inputError}
                  disabled={isProcessing}
                />
              )}
            />
          </Box>
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Refs for cursor optimization
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load groups
  const loadGroups = useCallback(async () => {
    try {
      const response = await axiosInstance.get(endpoints.dataSource.groups.base(sourceId));
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }, [sourceId]);

  // Create/Update group
  const handleSaveGroup = async (group: Partial<Group>) => {
    try {
      const isNew = !group.id;
      const url = isNew
        ? endpoints.dataSource.groups.base(sourceId)
        : endpoints.dataSource.groups.details(sourceId, group.id!);
      
      const response = await axiosInstance({
        url,
        method: isNew ? 'POST' : 'PUT',
        data: group,
      });

      if (response.data) {
        await loadGroups();
        onGroupsChange();
        setOpenDialog(false);
      }
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    try {
      await axiosInstance.delete(endpoints.dataSource.groups.details(sourceId, groupId));
      await loadGroups();
      onGroupsChange();
    } catch (error) {
      console.error('Error deleting group:', error);
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
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Tables</TableCell>
                <TableCell>Members</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(groups || [])
                .filter((group) =>
                  group.name.toLowerCase().includes((debouncedSearch || '').toLowerCase())
                )
                .map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          size="small"
                          label={`${(group.tables || []).length} tables`}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          size="small"
                          label={`${(group.members || []).length} members`}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedGroup(group);
                              setOpenDialog(true);
                            }}
                          >
                            <Iconify icon="eva:edit-fill" />
                          </IconButton>
                        </Tooltip>
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
        descriptionInputRef={descriptionInputRef}
      />
    </StyledCard>
  );
} 