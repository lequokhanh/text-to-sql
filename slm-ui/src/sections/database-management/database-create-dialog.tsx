import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Stepper from '@mui/material/Stepper';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';

import axios, { endpoints } from 'src/utils/axios-embed';

import Iconify from 'src/components/iconify';

import { DatabaseSource, DatabaseConnectionConfig } from 'src/types/database';

import { TableDefinitionView } from './table-definition-view';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onCreateSource: (source: DatabaseSource) => void;
};

const DATABASE_TYPES = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
];

const STEPS = ['Connection Details', 'Schema Preview', 'Confirmation'];

export default function DatabaseCreateDialog({ open, onClose, onCreateSource }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schemaData, setSchemaData] = useState<DatabaseSource | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  const [formData, setFormData] = useState<DatabaseConnectionConfig>({
    url: '',
    username: '',
    password: '',
    dbType: 'postgresql',
  });

  const [sourceName, setSourceName] = useState('');
  const [tableCount, setTableCount] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setError('');
      setSchemaData(null);
      setConnectionSuccess(false);
    }
  }, [open]);

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (formData.url) {
      // Basic URL validation - could be expanded for specific database formats
      if (!formData.url.includes(':') || !formData.url.includes('/')) {
        errors.url = 'URL should be in format hostname:port/database';
      }
    }

    if (formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (sourceName && sourceName.length < 3) {
      errors.sourceName = 'Data Source name must be at least 3 characters';
    }

    setValidationErrors(errors);
  }, [formData, sourceName]);

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange =
    (field: keyof DatabaseConnectionConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const validateForm = () => {
    if (!formData.url) return 'Host URL is required';
    if (!formData.username) return 'Username is required';
    if (!formData.password) return 'Password is required';
    if (!sourceName) return 'Data Source Name is required';

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      return 'Please fix validation errors before proceeding';
    }

    return '';
  };

  const fetchSchema = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(endpoints.db.connect, formData);
      const [host, portAndDb] = formData.url.split(':');
      const [port, databaseName] = portAndDb?.split('/') || [];

      const sourceData: DatabaseSource = {
        tableDefinitions: response.data.tables,
        databaseType: formData.dbType.toUpperCase() as 'POSTGRESQL' | 'MYSQL',
        host: host || '',
        port: port || '',
        databaseName: databaseName || '',
        name: sourceName,
        username: formData.username,
        password: formData.password,
      };

      setTableCount(sourceData.tableDefinitions?.length || 0);
      setSchemaData(sourceData);
      setConnectionSuccess(true);
      handleNextStep(); // Move to schema preview step
    } catch (err) {
      setConnectionSuccess(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!schemaData) return;
    onCreateSource(schemaData);
    onClose();
  };

  const testConnection = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(endpoints.db.testConnection, formData);
      setConnectionSuccess(true);
      setError('');
    } catch (err) {
      setConnectionSuccess(false);
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () =>
    !!sourceName &&
    !!formData.url &&
    !!formData.username &&
    !!formData.password &&
    Object.keys(validationErrors).length === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      aria-labelledby="create-datasource-dialog-title"
      sx={{
        '& .MuiDialog-paper': {
          width: '95%',
          maxWidth: '1600px',
        },
      }}
    >
      <DialogTitle id="create-datasource-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:database-fill" width={24} height={24} />
          <Typography variant="h4">Create Data Source</Typography>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ minHeight: 500, p: 3 }}>
        {/* Progress indicator */}
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          />
        )}

        {/* Steps indicator */}
        <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {connectionSuccess && currentStep === 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Connection successful! You can proceed to preview schema.
          </Alert>
        )}

        {currentStep === 0 && (
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Database Connection Details
            </Typography>

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Data Source Name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                required
                error={!!validationErrors.sourceName}
                helperText={validationErrors.sourceName || 'A unique name for this data source'}
                placeholder="My Production Database"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:bookmark-fill" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                fullWidth
                label="Database Type"
                value={formData.dbType}
                onChange={handleInputChange('dbType')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:server-fill" />
                    </InputAdornment>
                  ),
                }}
              >
                {DATABASE_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Host URL"
                value={formData.url}
                onChange={handleInputChange('url')}
                required
                error={!!validationErrors.url}
                helperText={validationErrors.url || 'Format: hostname:port/database'}
                placeholder="localhost:5432/mydb"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:link-2-fill" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Example: localhost:5432/postgres">
                        <IconButton edge="end" size="small">
                          <Iconify icon="eva:info-outline" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                required
                error={!!validationErrors.username}
                helperText={validationErrors.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:person-fill" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:lock-fill" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        <Iconify icon={showPassword ? 'eva:eye-off-fill' : 'eva:eye-fill'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <LoadingButton
                  onClick={testConnection}
                  loading={loading}
                  variant="outlined"
                  color="info"
                  disabled={!isFormValid()}
                  startIcon={<Iconify icon="eva:flash-fill" />}
                  sx={{ mr: 2 }}
                >
                  Test Connection
                </LoadingButton>
              </Box>
            </Stack>
          </Box>
        )}

        {currentStep === 1 && schemaData && (
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Schema Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Detected {tableCount} tables from your database. Review the schema before creating the
              data source.
            </Typography>

            <TableDefinitionView tables={schemaData.tableDefinitions} />
          </Box>
        )}

        {currentStep === 2 && schemaData && (
          <Box sx={{ p: 1 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Confirm Data Source Details
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Data Source Name:</Typography>
                  <Typography>{schemaData.name}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Database Type:</Typography>
                  <Typography>{schemaData.databaseType}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Host:</Typography>
                  <Typography>{schemaData.host}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Port:</Typography>
                  <Typography>{schemaData.port}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Database Name:</Typography>
                  <Typography>{schemaData.databaseName}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Username:</Typography>
                  <Typography>{schemaData.username}</Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Tables:</Typography>
                  <Typography>{schemaData.tableDefinitions?.length || 0} tables</Typography>
                </Stack>
              </Stack>
            </Paper>

            <Alert severity="info" sx={{ mb: 2 }}>
              {`Click "Create Data Source" to finalize and add this database connection to your
              sources.`}
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" startIcon={<Iconify icon="eva:close-fill" />}>
          Cancel
        </Button>

        {currentStep > 0 && (
          <Button
            onClick={handlePreviousStep}
            color="inherit"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
          >
            Back
          </Button>
        )}

        {currentStep === 0 && (
          <LoadingButton
            onClick={fetchSchema}
            loading={loading}
            variant="contained"
            disabled={!isFormValid()}
            startIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Preview Schema
          </LoadingButton>
        )}

        {currentStep === 1 && (
          <Button
            onClick={handleNextStep}
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Continue
          </Button>
        )}

        {currentStep === 2 && (
          <Button
            onClick={handleCreate}
            variant="contained"
            color="success"
            disabled={!schemaData}
            startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          >
            Create Data Source
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
