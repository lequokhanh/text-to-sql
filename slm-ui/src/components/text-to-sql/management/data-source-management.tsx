// File: src/sections/database-management/components/management/DataSourceManagement.tsx

import axios from 'axios';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

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
  DialogContentText,
} from '@mui/material';

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

// Supported database types
const DATABASE_TYPES = ['MySQL', 'PostgreSQL', 'SQLite', 'Microsoft SQL Server', 'Oracle'];

interface DataSourceManagementProps {
  dataSource: DatabaseSource;
  onUpdate: (updatedSource: DatabaseSource) => void;
  onDelete: (sourceId: string) => void;
}

// Individual field components
const SourceField = ({
  label,
  value,
  icon,
  disabled = false,
  error,
  helperText,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  icon: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => (
  <TextField
    label={label}
    value={value}
    onChange={onChange}
    fullWidth
    disabled={disabled}
    error={!!error}
    helperText={helperText}
    type={type}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Iconify icon={icon} width={20} height={20} />
        </InputAdornment>
      ),
    }}
  />
);

export default function DataSourceManagement({
  dataSource,
  onUpdate,
  onDelete,
}: DataSourceManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatabaseSource>({
    defaultValues: dataSource,
  });

  const handleSave = (data: DatabaseSource) => {
    onUpdate(data);
    setIsEditing(false);
    setTestResult(null);
  };

  const handleTestConnection = async (data: DatabaseSource) => {
    try {
      // Test connection through backend
      await axios.post(`/api/v1/data-sources/${data.id}/test-connection`);
      
      setTestResult({
        success: true,
        message: 'Connection successful!',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(dataSource.name);
    setDeleteDialogOpen(false);
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
                    icon="eva:database-fill"
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
                    onClick={() => {
                      setIsEditing(false);
                      setTestResult(null);
                    }}
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
                          label="Data Source Name"
                          value={field.value}
                          icon="eva:bookmark-fill"
                          disabled={!isEditing}
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          onChange={field.onChange}
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
                              <MenuItem key={type} value={type}>
                                {type}
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
                          label="Host"
                          value={field.value}
                          icon="eva:globe-fill"
                          disabled={!isEditing}
                          error={!!errors.host}
                          helperText={errors.host?.message}
                          onChange={field.onChange}
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
                          label="Port"
                          value={field.value}
                          icon="eva:link-2-fill"
                          disabled={!isEditing}
                          error={!!errors.port}
                          helperText={errors.port?.message}
                          onChange={field.onChange}
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
                          label="Database Name"
                          value={field.value}
                          icon="eva:folder-fill"
                          disabled={!isEditing}
                          error={!!errors.databaseName}
                          helperText={errors.databaseName?.message}
                          onChange={field.onChange}
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
                          label="Username"
                          value={field.value}
                          icon="eva:person-fill"
                          disabled={!isEditing}
                          error={!!errors.username}
                          helperText={errors.username?.message}
                          onChange={field.onChange}
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
                          label="Password"
                          value={field.value}
                          icon="eva:lock-fill"
                          disabled={!isEditing}
                          error={!!errors.password}
                          helperText={errors.password?.message}
                          onChange={field.onChange}
                          type="password"
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
                      onClick={handleSubmit((data) => handleTestConnection(data))}
                      startIcon={<Iconify icon="eva:flash-fill" />}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Test Connection
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<Iconify icon="eva:save-fill" />}
                      sx={{ borderRadius: 1.5 }}
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
