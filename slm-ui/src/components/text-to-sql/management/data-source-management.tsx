// File: src/sections/database-management/components/management/DataSourceManagement.tsx

import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import React, { useRef, useState, useEffect, KeyboardEvent } from 'react';

import {
  Box,
  Card,
  Stack,
  Alert,
  alpha,
  Paper,
  Button,
  Select,
  Dialog,
  styled,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  CardContent,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  TextFieldProps,
  DialogContentText,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import { DatabaseSource } from 'src/types/database';

// Styled components
const ManagementContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  overflow: 'auto',
  backgroundColor: alpha(theme.palette.background.default, 0.8),
}));

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

const FieldContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

// Add new styled component for form fields
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color']),
    '&.Mui-focused': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.primary.main, 0.1)
        : alpha(theme.palette.primary.lighter, 0.2),
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
}));


// Supported database types
const DATABASE_TYPES = [
  { value: 'MYSQL', label: 'MySQL' },
  { value: 'POSTGRESQL', label: 'PostgreSQL' }
];

interface DataSourceManagementProps {
  dataSource: DatabaseSource;
  onUpdate: (updatedSource: DatabaseSource) => void;
  onDelete: (sourceId: string) => void;
}

// Update the SourceField component props type
interface SourceFieldProps extends Omit<TextFieldProps, 'ref'> {
  icon: string;
}

// Update the SourceField component
const SourceField = React.forwardRef<HTMLDivElement, SourceFieldProps>(
  ({ label, value, icon, error, helperText, onChange, type = 'text', multiline, rows, ...props }, ref) => (
    <StyledTextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      type={type}
      ref={ref}
      multiline={multiline}
      rows={rows}
      InputProps={{
        startAdornment: !multiline ? (
          <InputAdornment position="start">
            <Iconify icon={icon} width={20} height={20} />
          </InputAdornment>
        ) : undefined,
      }}
      {...props}
    />
  )
);

export default function DataSourceManagement({
  dataSource,
  onUpdate,
  onDelete,
}: DataSourceManagementProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasValidConnection, setHasValidConnection] = useState(false);
  const [lastTestedValues, setLastTestedValues] = useState<DatabaseSource | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // Add refs for form fields
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hostInputRef = useRef<HTMLInputElement>(null);
  const portInputRef = useRef<HTMLInputElement>(null);
  const dbNameInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Handle countdown and auto-redirect after successful deletion
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (deleteSuccess && countdown === 0) {
      navigate('/');
    }
    return () => clearTimeout(timer);
  }, [deleteSuccess, countdown, navigate]);

  // Track form values for change detection
  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<DatabaseSource>({
    defaultValues: dataSource,
  });


  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (event.key === 'Enter' && nextRef?.current) {
      event.preventDefault();
      nextRef.current.focus();
    }
  };

  // Function to check if there are any actual changes from original data
  const hasFormChanges = () => {
    const currentValues = getValues();
    return Object.keys(currentValues).some(key => {
      const field = key as keyof DatabaseSource;
      return currentValues[field] !== dataSource[field];
    });
  };

  // Function to check if current values match last tested values
  const checkForChanges = (currentValues: DatabaseSource) => {
    if (!lastTestedValues) return true;
    
    const hasChanges = Object.keys(currentValues).some(key => 
      currentValues[key as keyof DatabaseSource] !== lastTestedValues[key as keyof DatabaseSource]
    );

    if (hasChanges) {
      setHasValidConnection(false);
      if (testResult?.success) {
        setTestResult({
          success: false,
          message: 'Changes detected. Please test the connection again.',
        });
      }
    }
    return hasChanges;
  };

  const handleTestConnection = async (data: DatabaseSource) => {
    try {
      setTestResult({ success: false, message: 'Testing connection...' });
      const response = await axiosInstance.post(endpoints.dataSource.testConnection(data.id));
      const success = true; // Assuming the API returns success if no error is thrown
      setTestResult({
        success,
        message: response.data?.message || 'Connection successful!',
      });
      setHasValidConnection(success);
      if (success) {
        // Store the values that were successfully tested
        setLastTestedValues({...data});
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
      setHasValidConnection(false);
      setLastTestedValues(null);
    }
  };

  const handleSave = async (data: DatabaseSource) => {
    // Check if there are any actual changes
    if (!hasFormChanges()) {
      setTestResult({
        success: false,
        message: 'No changes detected to save.',
      });
      return;
    }

    // Check if current values match the last tested values
    const hasUntestedChanges = !lastTestedValues || Object.keys(data).some(key => 
      data[key as keyof DatabaseSource] !== lastTestedValues[key as keyof DatabaseSource]
    );

    if (!hasValidConnection || hasUntestedChanges) {
      setTestResult({
        success: false,
        message: hasUntestedChanges 
          ? 'Changes detected since last test. Please test the connection again.'
          : 'Please test the connection before saving changes.',
      });
      setHasValidConnection(false);
      return;
    }

    try {
      const response = await axiosInstance.put(`${endpoints.dataSource.base}/${data.id}`, data);
      await onUpdate(response.data);
      setIsEditing(false);
      setTestResult(null);
      setHasValidConnection(false);
      setLastTestedValues(null);
    } catch (error) {
      console.error('Error saving:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save changes',
      });
    }
  };

  // Reset all states when editing is cancelled
  const handleCancelEdit = () => {
    setIsEditing(false);
    setTestResult(null);
    setHasValidConnection(false);
    setLastTestedValues(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`${endpoints.dataSource.base}/${dataSource.id}`);
      onDelete(dataSource.id);
      setDeleteDialogOpen(false);
      setDeleteSuccess(true);
      setCountdown(3); // Reset countdown
    } catch (error) {
      console.error('Error deleting datasource:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete datasource',
      });
    }
  };

  const handleGoHomeNow = () => {
    navigate('/');
  };

  return (
    <ManagementContainer>
      <StyledCard>
        <CardContent>
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <Iconify
                    icon="material-symbols:database"
                    width={28}
                    height={28}
                    sx={{ color: 'primary.main' }}
                  />
                </Box>
                <Typography variant="h5">Data Source Details</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                {!isEditing ? (
                  <Tooltip title="Edit data source">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Iconify icon="eva:edit-fill" />}
                      onClick={() => setIsEditing(true)}
                      sx={{
                        borderRadius: 1.5,
                        px: 2,
                      }}
                    >
                      Edit
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancelEdit}
                    sx={{
                      borderRadius: 1.5,
                      px: 2,
                    }}
                  >
                    Cancel
                  </Button>
                )}

                <Tooltip title="Delete this data source">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Iconify icon="eva:trash-2-fill" />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{
                      borderRadius: 1.5,
                      px: 2,
                    }}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>

            <Divider />

            {testResult && (
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                sx={{
                  borderRadius: 1.5,
                  boxShadow: (theme) => theme.customShadows.z8,
                }}
              >
                {testResult.message}
              </Alert>
            )}

            {deleteSuccess && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: 1.5,
                  boxShadow: (theme) => theme.customShadows.z8,
                }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleGoHomeNow}
                    startIcon={<Iconify icon="eva:home-fill" />}
                    sx={{
                      borderRadius: 1,
                      bgcolor: (theme) => alpha(theme.palette.common.white, 0.2),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.common.white, 0.3),
                      },
                    }}
                  >
                    Go Home Now
                  </Button>
                }
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="eva:checkmark-circle-2-fill" width={20} height={20} />
                  <Typography variant="body2">
                    Data source &quot;{dataSource.name}&quot; deleted successfully! 
                    Redirecting to home in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </Typography>
                </Stack>
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleSave)}>
              <Stack spacing={3}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.4),
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>

                  <FieldContainer>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: 'Name is required' }}
                      render={({ field }) => (
                        <SourceField
                          {...field}
                          label="Data Source Name"
                          icon="eva:bookmark-fill"
                          disabled={!isEditing}
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          ref={nameInputRef}
                          onFocus={() => {}}
                          onBlur={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, hostInputRef)}
                          autoFocus={isEditing}
                        />
                      )}
                    />
                  </FieldContainer>

                  <FieldContainer>
                    <Controller
                      name="databaseType"
                      control={control}
                      rules={{ required: 'Database type is required' }}
                      render={({ field }) => (
                        <FormControl fullWidth disabled={!isEditing} error={!!errors.databaseType}>
                          <InputLabel>Database Type</InputLabel>
                          <Select
                            {...field}
                            label="Database Type"
                            startAdornment={
                              <InputAdornment position="start">
                                <Iconify icon="eva:layers-fill" width={20} height={20} />
                              </InputAdornment>
                            }
                          >
                            {DATABASE_TYPES.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.databaseType && (
                            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                              {errors.databaseType.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </FieldContainer>
                </Paper>

                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.4),
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Connection Details
                  </Typography>

                  <FieldContainer>
                    <Controller
                      name="host"
                      control={control}
                      rules={{ required: 'Host is required' }}
                      render={({ field }) => (
                        <SourceField
                          {...field}
                          label="Host"
                          icon="eva:globe-fill"
                          disabled={!isEditing}
                          error={!!errors.host}
                          helperText={errors.host?.message}
                          ref={hostInputRef}
                          onFocus={() => {}}
                          onBlur={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, portInputRef)}
                        />
                      )}
                    />
                  </FieldContainer>

                  <FieldContainer>
                    <Controller
                      name="port"
                      control={control}
                      rules={{ required: 'Port is required' }}
                      render={({ field }) => (
                        <SourceField
                          {...field}
                          label="Port"
                          icon="eva:link-2-fill"
                          disabled={!isEditing}
                          error={!!errors.port}
                          helperText={errors.port?.message}
                          ref={portInputRef}
                          onFocus={() => {}}
                          onBlur={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, dbNameInputRef)}
                        />
                      )}
                    />
                  </FieldContainer>

                  <FieldContainer>
                    <Controller
                      name="databaseName"
                      control={control}
                      rules={{ required: 'Database name is required' }}
                      render={({ field }) => (
                        <SourceField
                          {...field}
                          label="Database Name"
                          icon="eva:folder-fill"
                          disabled={!isEditing}
                          error={!!errors.databaseName}
                          helperText={errors.databaseName?.message}
                          ref={dbNameInputRef}
                          onFocus={() => {}}
                          onBlur={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, usernameInputRef)}
                        />
                      )}
                    />
                  </FieldContainer>
                </Paper>

                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.4),
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Authentication
                  </Typography>

                  <FieldContainer>
                    <Controller
                      name="username"
                      control={control}
                      rules={{ required: 'Username is required' }}
                      render={({ field }) => (
                        <SourceField
                          {...field}
                          label="Username"
                          icon="eva:person-fill"
                          disabled={!isEditing}
                          error={!!errors.username}
                          helperText={errors.username?.message}
                          ref={usernameInputRef}
                          onFocus={() => {}}
                          onBlur={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, passwordInputRef)}
                        />
                      )}
                    />
                  </FieldContainer>

                  <FieldContainer>
                    <Controller
                      name="password"
                      control={control}
                      rules={{ required: 'Password is required' }}
                      render={({ field }) => (
                        <SourceField
                          {...field}
                          label="Password"
                          icon="eva:lock-fill"
                          disabled={!isEditing}
                          error={!!errors.password}
                          helperText={errors.password?.message}
                          type="password"
                          ref={passwordInputRef}
                          onFocus={() => {}}
                          onBlur={() => {}}
                        />
                      )}
                    />
                  </FieldContainer>
                </Paper>

                {isEditing && (
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        const currentValues = getValues();
                        handleTestConnection(currentValues);
                      }}
                      startIcon={<Iconify icon="eva:flash-fill" />}
                      sx={{ borderRadius: 1.5 }}
                      disabled={!hasFormChanges()}
                    >
                      Test Connection
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<Iconify icon="eva:save-fill" />}
                      sx={{ borderRadius: 1.5 }}
                      disabled={
                        !hasFormChanges() ||
                        !hasValidConnection ||
                        checkForChanges(getValues())
                      }
                    >
                      Save Changes
                    </Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </StyledCard>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: (theme) => theme.customShadows.z24,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="eva:alert-triangle-fill" width={24} height={24} color="error.main" />
            <Typography variant="h6">Delete Data Source</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the data source &quot;{dataSource.name}&quot;? This
            action cannot be undone and all associated conversations will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={<Iconify icon="eva:trash-2-fill" />}
            sx={{ borderRadius: 1.5 }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ManagementContainer>
  );
}
