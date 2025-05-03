import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
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
import useMediaQuery from '@mui/material/useMediaQuery';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, styled, useTheme } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';

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

// Styled components
const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
        : `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: theme.palette.mode === 'dark'
        ? theme.palette.primary.dark
        : theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 1,
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[300],
  },
}));

const StyledStepIconRoot = styled('div')<{
  ownerState: { active?: boolean; completed?: boolean };
}>(({ theme, ownerState }) => {
  let borderColor;

  if (ownerState.active) {
    borderColor = theme.palette.primary.main;
  } else if (ownerState.completed) {
    borderColor = theme.palette.success.main;
  } else if (theme.palette.mode === 'dark') {
    borderColor = theme.palette.grey[700];
  } else {
    borderColor = theme.palette.grey[300];
  }

  return {
    background: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#fff',
    zIndex: 1,
    color: theme.palette.text.disabled,
    width: 45,
    height: 45,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    border: `2px solid ${borderColor}`,
    boxShadow: ownerState.active
      ? `0 0 0 8px ${alpha(theme.palette.primary.main, 0.1)}`
      : 'none',
    ...(ownerState.active && {
      color: theme.palette.primary.main,
    }),
    ...(ownerState.completed && {
      color: theme.palette.success.main,
    }),
  };
});

function StyledStepIcon(props: {
  icon: React.ReactNode;
  active?: boolean;
  completed?: boolean;
}) {
  const { active, completed, icon } = props;

  return (
    <StyledStepIconRoot ownerState={{ active, completed }}>
      {completed ? <Iconify icon="eva:checkmark-fill" width={24} /> : icon}
    </StyledStepIconRoot>
  );
}

// Form field wrapper for consistent styling
const FormField = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const ConnectionStatusBadge = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
}));

const DATABASE_TYPES = [
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    icon: 'logos:postgresql',
    color: '#336791'
  },
  {
    value: 'mysql',
    label: 'MySQL',
    icon: 'logos:mysql',
    color: '#4479A1'
  },
];

const STEPS = [
  {
    label: 'Connection Details',
    description: 'Configure database connection',
    icon: <Iconify icon="eva:link-2-fill" width={24} />,
  },
  {
    label: 'Schema Preview',
    description: 'Review detected tables and columns',
    icon: <Iconify icon="eva:layers-fill" width={24} />,
  },
  {
    label: 'Confirmation',
    description: 'Confirm and create data source',
    icon: <Iconify icon="eva:checkmark-circle-2-fill" width={24} />,
  }
];

export default function DatabaseCreateDialog({ open, onClose, onCreateSource }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schemaData, setSchemaData] = useState<DatabaseSource | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);

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
      setShowSchemaPreview(false);
      setFormData({
        url: '',
        username: '',
        password: '',
        dbType: 'postgresql',
      });
      setSourceName('');
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
      // Reset connection status when inputs change
      if (connectionSuccess) {
        setConnectionSuccess(false);
      }
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
    setShowSchemaPreview(false);

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

      // Slight delay before showing schema preview for a smoother transition
      setTimeout(() => {
        setShowSchemaPreview(true);
        handleNextStep(); // Move to schema preview step
      }, 300);
    } catch (err) {
      setConnectionSuccess(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!schemaData) return;

    // Show a short loading state before closing
    setLoading(true);
    setTimeout(() => {
      onCreateSource(schemaData);
      onClose();
      setLoading(false);
    }, 500);
  };

  const testConnection = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setTestingConnection(true);
    setError('');

    try {
      await axios.post(endpoints.db.testConnection, formData);
      setConnectionSuccess(true);
      setError('');
    } catch (err) {
      setConnectionSuccess(false);
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const isFormValid = () =>
    !!sourceName &&
    !!formData.url &&
    !!formData.username &&
    !!formData.password &&
    Object.keys(validationErrors).length === 0;

  // Show example format based on database type
  const getUrlPlaceholder = () => {
    switch (formData.dbType) {
      case 'postgresql':
        return 'localhost:5432/postgres';
      case 'mysql':
        return 'localhost:3306/mysql';
      case 'mongodb':
        return 'localhost:27017/admin';
      case 'sqlserver':
        return 'localhost:1433/master';
      default:
        return 'hostname:port/database';
    }
  };

  const getFontWeight = (index: any) => {
    if (currentStep === index) return 'bold';
    if (currentStep > index) return 'medium';
    return 'normal';
  };

  const getColor = (index: any) => {
    if (currentStep === index) return 'primary.main';
    return 'text.primary';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 400 }}
      aria-labelledby="create-datasource-dialog-title"
      sx={{
        '& .MuiDialog-paper': {
          width: '98%',
          maxWidth: '1800px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh',
          borderRadius: isMobile ? 0 : 2,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        id="create-datasource-dialog-title"
        sx={{
          pb: 1,
          pt: 2.5,
          background: (t) =>
            t.palette.mode === 'dark'
              ? alpha(t.palette.primary.dark, 0.12)
              : alpha(t.palette.primary.lighter, 0.5),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: (t) =>
                t.palette.mode === 'dark'
                  ? alpha(t.palette.primary.main, 0.2)
                  : alpha(t.palette.primary.main, 0.1),
            }}
          >
            <Iconify
              icon="eva:database-fill"
              width={24}
              height={24}
              sx={{ color: 'primary.main' }}
            />
          </Box>
          <Typography variant="h4" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
            Create Data Source
          </Typography>
        </Stack>
        {isMobile && (
          <IconButton
            edge="end"
            onClick={onClose}
            aria-label="close"
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          p: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Progress indicator */}
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              height: 3,
            }}
          />
        )}

        {/* Steps indicator */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 0 },
            mb: 1,
            background: (t) =>
              t.palette.mode === 'dark'
                ? alpha(t.palette.primary.dark, 0.05)
                : alpha(t.palette.primary.lighter, 0.2),
          }}
        >
          <Stepper
            activeStep={currentStep}
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            connector={<StyledStepConnector />}
          >
            {STEPS.map((step, index) => (
              <Step key={step.label} completed={currentStep > index}>
                <StepLabel
                  StepIconComponent={StyledStepIcon}
                  StepIconProps={{
                    icon: step.icon,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: getFontWeight(index),
                      color: getColor(index),
                    }}
                  >
                    {step.label}
                  </Typography>
                  {!isMobile && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: 'text.secondary',
                      }}
                    >
                      {step.description}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            flexGrow: 1,
            overflow: 'auto',
            height: '100%'
          }}
        >
          {error && (
            <Fade in={!!error}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 1.5,
                  boxShadow: (t) => t.shadows[2],
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {connectionSuccess && currentStep === 0 && (
            <Fade in={connectionSuccess}>
              <Alert
                severity="success"
                variant="filled"
                sx={{
                  mb: 3,
                  borderRadius: 1.5,
                  boxShadow: (t) => t.shadows[2],
                }}
                icon={<Iconify icon="eva:checkmark-circle-2-fill" fontSize="inherit" />}
              >
                Connection successful! You can proceed to preview schema.
              </Alert>
            </Fade>
          )}

          {currentStep === 0 && (
            <Fade in={currentStep === 0} timeout={500}>
              <Box sx={{ p: { xs: 0, sm: 1 } }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Database Connection Details
                </Typography>

                <Stack spacing={3}>
                  <FormField>
                    <TextField
                      fullWidth
                      label="Data Source Name"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      required
                      error={!!validationErrors.sourceName}
                      helperText={validationErrors.sourceName || 'A unique name for this data source'}
                      placeholder="My Production Database"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:bookmark-fill" sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormField>

                  <FormField>
                    <TextField
                      select
                      fullWidth
                      label="Database Type"
                      value={formData.dbType}
                      onChange={handleInputChange('dbType')}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:server-fill" sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {DATABASE_TYPES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Iconify
                              icon={option.icon}
                              width={20}
                              height={20}
                              sx={{ color: option.color }}
                            />
                            <Typography>{option.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormField>

                  <FormField>
                    <ConnectionStatusBadge>
                      <TextField
                        fullWidth
                        label="Host URL"
                        value={formData.url}
                        onChange={handleInputChange('url')}
                        required
                        error={!!validationErrors.url}
                        helperText={validationErrors.url || 'Format: hostname:port/database'}
                        placeholder={getUrlPlaceholder()}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            borderColor: connectionSuccess ? 'success.main' : undefined,
                            '&.Mui-focused': {
                              borderColor: connectionSuccess ? 'success.main' : undefined,
                              boxShadow: connectionSuccess
                                ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`
                                : undefined,
                            }
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify
                                icon="eva:link-2-fill"
                                sx={{
                                  color: connectionSuccess ? 'success.main' : 'primary.main'
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip
                                title={`Example: ${getUrlPlaceholder()}`}
                                placement="top"
                                arrow
                              >
                                <IconButton edge="end" size="small">
                                  <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {connectionSuccess && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            bgcolor: 'success.main',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            border: `2px solid ${theme.palette.background.paper}`,
                          }}
                        >
                          <Iconify
                            icon="eva:checkmark-fill"
                            width={14}
                            height={14}
                            sx={{ color: 'white' }}
                          />
                        </Box>
                      )}
                    </ConnectionStatusBadge>
                  </FormField>

                  <FormField>
                    <TextField
                      fullWidth
                      label="Username"
                      value={formData.username}
                      onChange={handleInputChange('username')}
                      required
                      error={!!validationErrors.username}
                      helperText={validationErrors.username}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:person-fill" sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormField>

                  <FormField>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      required
                      error={!!validationErrors.password}
                      helperText={validationErrors.password}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:lock-fill" sx={{ color: 'primary.main' }} />
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
                  </FormField>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <LoadingButton
                      onClick={testConnection}
                      loading={testingConnection}
                      variant="outlined"
                      color="info"
                      disabled={!isFormValid()}
                      startIcon={<Iconify icon="eva:flash-fill" />}
                      loadingPosition="start"
                      sx={{
                        mr: 2,
                        borderRadius: 1,
                        px: 2,
                      }}
                    >
                      Test Connection
                    </LoadingButton>
                  </Box>
                </Stack>
              </Box>
            </Fade>
          )}

          {currentStep === 1 && schemaData && (
            <Fade in={showSchemaPreview && currentStep === 1} timeout={500}>
              <Box
                sx={{
                  p: { xs: 0, sm: 1 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Schema Preview
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Detected {tableCount} tables from your database
                  </Typography>

                  <Chip
                    label={tableCount.toString()}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />

                  <Divider orientation="vertical" flexItem sx={{ height: 16 }} />

                  <Typography variant="body2" color="text.secondary">
                    Review the schema before creating the data source
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: (t) => t.shadows[2],
                    flexGrow: 1,
                    height: '100%',
                    minHeight: 400,
                  }}
                >
                  <TableDefinitionView tables={schemaData.tableDefinitions} />
                </Box>
              </Box>
            </Fade>
          )}

          {currentStep === 2 && schemaData && (
            <Fade in={currentStep === 2} timeout={500}>
              <Box sx={{ p: { xs: 0, sm: 1 } }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Confirm Data Source Details
                </Typography>

                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: (t) =>
                      t.palette.mode === 'dark'
                        ? alpha(t.palette.background.paper, 0.8)
                        : alpha(t.palette.background.paper, 1),
                  }}
                >
                  <Stack spacing={2.5}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        pb: 2,
                        mb: 1,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '12px',
                          backgroundColor: (t) =>
                            alpha(t.palette.primary.main, 0.1),
                        }}
                      >
                        <Iconify
                          icon={
                            DATABASE_TYPES.find(db =>
                              db.value === formData.dbType
                            )?.icon || 'eva:database-fill'
                          }
                          width={28}
                          height={28}
                          sx={{
                            color:
                              DATABASE_TYPES.find(db =>
                                db.value === formData.dbType
                              )?.color || 'primary.main'
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography variant="h5">
                          {schemaData.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {DATABASE_TYPES.find(db =>
                            db.value === formData.dbType.toLowerCase()
                          )?.label || schemaData.databaseType}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? alpha(t.palette.background.default, 0.6)
                              : alpha(t.palette.background.default, 1),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon="eva:globe-outline" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="subtitle2">Host:</Typography>
                      </Stack>
                      <Typography sx={{ wordBreak: 'break-word' }}>{schemaData.host}</Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? alpha(t.palette.background.default, 0.6)
                              : alpha(t.palette.background.default, 1),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon="eva:hash-outline" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="subtitle2">Port:</Typography>
                      </Stack>
                      <Typography>{schemaData.port}</Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? alpha(t.palette.background.default, 0.6)
                              : alpha(t.palette.background.default, 1),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon="eva:folder-outline" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="subtitle2">Database Name:</Typography>
                      </Stack>
                      <Typography sx={{ wordBreak: 'break-word' }}>{schemaData.databaseName}</Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? alpha(t.palette.background.default, 0.6)
                              : alpha(t.palette.background.default, 1),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon="eva:person-outline" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="subtitle2">Username:</Typography>
                      </Stack>
                      <Typography sx={{ wordBreak: 'break-word' }}>{schemaData.username}</Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? alpha(t.palette.background.default, 0.6)
                              : alpha(t.palette.background.default, 1),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon="eva:layers-outline" width={20} sx={{ color: 'text.secondary' }} />
                        <Typography variant="subtitle2">Tables:</Typography>
                      </Stack>
                      <Chip
                        label={`${schemaData.tableDefinitions?.length || 0} tables`}
                        color="primary"
                        size="small"
                        sx={{ height: 24 }}
                      />
                    </Stack>
                  </Stack>
                </Paper>

                <Alert
                  severity="info"
                  icon={<Iconify icon="eva:info-fill" />}
                  sx={{
                    mb: 2,
                    borderRadius: 1.5,
                    boxShadow: (t) => t.shadows[1],
                  }}
                >
                  {`Click "Create Data Source" to finalize and add this database connection to your sources.`}
                </Alert>
              </Box>
            </Fade>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          background: (t) =>
            t.palette.mode === 'dark'
              ? alpha(t.palette.background.default, 0.6)
              : alpha(t.palette.grey[50], 1),
          flexDirection: isMobile ? 'column-reverse' : 'row',
          alignItems: 'center',
          '& > button': {
            m: isMobile ? 0.5 : undefined,
            width: isMobile ? '100%' : undefined,
          }
        }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          startIcon={<Iconify icon="eva:close-fill" />}
          sx={{
            borderRadius: 1,
            display: isMobile ? 'none' : 'inline-flex',
          }}
        >
          Cancel
        </Button>

        {currentStep > 0 && (
          <Button
            onClick={handlePreviousStep}
            color="inherit"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            sx={{
              borderRadius: 1,
              flex: isMobile ? '1 1 auto' : undefined,
            }}
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
            loadingPosition="start"
            sx={{
              borderRadius: 1,
              boxShadow: (t) => t.shadows[3],
              flex: isMobile ? '1 1 auto' : undefined,
            }}
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
            sx={{
              borderRadius: 1,
              boxShadow: (t) => t.shadows[3],
              flex: isMobile ? '1 1 auto' : undefined,
            }}
          >
            Continue
          </Button>
        )}

        {currentStep === 2 && (
          <LoadingButton
            onClick={handleCreate}
            loading={loading}
            variant="contained"
            color="success"
            disabled={!schemaData}
            startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
            loadingPosition="start"
            sx={{
              borderRadius: 1,
              boxShadow: (t) => t.shadows[3],
              flex: isMobile ? '1 1 auto' : undefined,
            }}
          >
            Create Data Source
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}