import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Select,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  CardContent,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { DatabaseSource } from 'src/types/database';

interface DataSourceManagementProps {
  dataSource: DatabaseSource;
  onUpdate: (updatedSource: DatabaseSource) => void;
  onDelete: (sourceId: string) => void;
}

// Supported database types
const DATABASE_TYPES = ['MySQL', 'PostgreSQL', 'SQLite', 'Microsoft SQL Server', 'Oracle'];

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
      // Implement your connection test logic here
      // For example:
      // const result = await axiosEmbed.post('/api/testConnection', data);

      // Mock success for demonstration
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
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Data Source Details</Typography>
              <Stack direction="row" spacing={1}>
                {!isEditing ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Iconify icon="eva:edit-fill" />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => {
                      setIsEditing(false);
                      setTestResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Iconify icon="eva:trash-2-fill" />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </Stack>
            </Stack>

            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleSave)}>
              <Stack spacing={3}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Data Source Name"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />

                <Controller
                  name="databaseType"
                  control={control}
                  rules={{ required: 'Database type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={!isEditing} error={!!errors.databaseType}>
                      <InputLabel>Database Type</InputLabel>
                      <Select {...field} label="Database Type">
                        {DATABASE_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.databaseType && (
                        <Typography variant="caption" color="error">
                          {errors.databaseType.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  name="host"
                  control={control}
                  rules={{ required: 'Host is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Host"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.host}
                      helperText={errors.host?.message}
                    />
                  )}
                />

                <Controller
                  name="port"
                  control={control}
                  rules={{ required: 'Port is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Port"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.port}
                      helperText={errors.port?.message}
                    />
                  )}
                />

                <Controller
                  name="databaseName"
                  control={control}
                  rules={{ required: 'Database name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Database Name"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.databaseName}
                      helperText={errors.databaseName?.message}
                    />
                  )}
                />

                <Controller
                  name="username"
                  control={control}
                  rules={{ required: 'Username is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Username"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.username}
                      helperText={errors.username?.message}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  rules={{ required: 'Password is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="password"
                      label="Password"
                      fullWidth
                      disabled={!isEditing}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />

                {isEditing && (
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleSubmit((data) => handleTestConnection(data))}
                    >
                      Test Connection
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                      Save Changes
                    </Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Data Source</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the data source &quot;{dataSource.name}&quot;? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
