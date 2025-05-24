import { useRef, useState, useEffect } from 'react';

import { alpha, styled, keyframes } from '@mui/material/styles';
import {
  Box,
  Chip,
  Menu,
  Stack,
  Badge,
  Button,
  Avatar,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  ListSubheader,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { DatabaseSource } from 'src/types/database';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.3); }
  70% { box-shadow: 0 0 0 8px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

const StyledChip = styled(Chip)(({ theme }) => ({
  height: 22,
  fontSize: '0.7rem',
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  transition: theme.transitions.create(['transform', 'box-shadow']),
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
  },
  '& .MuiChip-label': {
    paddingX: theme.spacing(1),
  },
}));

const CreateButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 2),
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 16px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const ConnectionIndicator = styled(Box)(({ theme }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  animation: `${pulse} 2s infinite`,
  position: 'absolute',
  top: 2,
  right: 2,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
}));

const DatabaseIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: theme.transitions.create(['transform', 'border-color', 'box-shadow']),
  '&:hover': {
    transform: 'scale(1.05)',
    borderColor: alpha(theme.palette.primary.main, 0.3),
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  transition: theme.transitions.create(['background-color', 'box-shadow']),
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5),
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 8px 0 ${alpha(theme.palette.common.black, 0.05)}`,
  },
}));

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  lineHeight: '32px',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.background.default, 0.8),
  backdropFilter: 'blur(6px)',
  marginTop: theme.spacing(1),
  padding: theme.spacing(1, 2),
  '& .MuiStack-root': {
    '& .MuiBadge-root': {
      marginLeft: theme.spacing(1.5),
    },
    '& .MuiSvgIcon-root': {
      marginRight: theme.spacing(1),
    },
  },
}));

interface DataSourceDropdownProps {
  ownedSources: DatabaseSource[];
  sharedSources: DatabaseSource[];
  selectedSource: DatabaseSource | null;
  onSourceSelect: (source: DatabaseSource) => void;
  onCreateSource: () => void;
  onManageSource: (sourceId: string) => void;
  style?: React.CSSProperties;
}

export function DataSourceDropdown({
  ownedSources,
  sharedSources,
  selectedSource,
  onSourceSelect,
  onCreateSource,
  onManageSource,
  style,
}: DataSourceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Debug logging
  useEffect(() => {
    // Remove debug logging to clean up console
    // console.log('Dropdown state:', { open, anchorRef: !!anchorRef.current });
    // console.log('Data sources:', { owned: ownedSources, shared: sharedSources });
  }, [open, ownedSources, sharedSources]);

  const filterSources = (sources: DatabaseSource[]) =>
    sources.filter((source) =>
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.databaseType.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredOwnedSources = filterSources(ownedSources);
  const filteredSharedSources = filterSources(sharedSources);

  const getDatabaseIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      postgres: 'logos:postgresql',
      mysql: 'logos:mysql',
      mongodb: 'logos:mongodb',
      oracle: 'logos:oracle',
      mssql: 'logos:microsoft-sql-server',
    };
    return iconMap[type.toLowerCase()] || 'eva:database-fill';
  };

  const getStatusColor = () => {
    if (!selectedSource) return 'text.secondary';
    return 'success.main';
  };

  const handleOpenMenu = () => {
    console.log('Opening dropdown menu');
    setOpen(true);
  };

  const handleCloseMenu = () => {
    console.log('Closing dropdown menu');
    setOpen(false);
    setSearchQuery('');
  };

  const totalSources = ownedSources.length + sharedSources.length;

  // Helper function to render a source item
  const renderSourceItem = (source: DatabaseSource, isOwned: boolean) => (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        <DatabaseIcon>
          <Iconify 
            icon={getDatabaseIcon(source.databaseType)} 
            width={16}
            height={16}
          />
        </DatabaseIcon>
        {selectedSource?.id === source.id && (
          <ConnectionIndicator />
        )}
      </Box>
      
      <Box flexGrow={1} minWidth={0}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {source.name}
        </Typography>
        {isOwned && source.host && (
          <Tooltip 
            title={`${source.host}:${source.port}/${source.databaseName}`}
            placement="top"
            arrow
          >
            <Typography 
              variant="caption" 
              component="div"
              sx={{ 
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Iconify 
                icon="eva:link-fill" 
                width={12} 
                height={12} 
                sx={{ color: 'text.disabled' }}
              />
              <Box 
                component="span" 
                sx={{ 
                  maxWidth: '160px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'inline-block'
                }}
              >
                {source.host}:{source.port}/{source.databaseName}
              </Box>
            </Typography>
          </Tooltip>
        )}
      </Box>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <StyledChip label={source.databaseType} size="small" />
        
        {isOwned && (
          <Tooltip title="Manage">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onManageSource(source.id);
                handleCloseMenu();
              }}
            >
              <Iconify icon="eva:settings-2-fill" width={14} height={14} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );

  return (
    <Box sx={style}>
      <Button
        ref={anchorRef}
        onClick={handleOpenMenu}
        endIcon={<Iconify icon="eva:chevron-down-fill" width={16} height={16} />}
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          minWidth: 280,
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 1.5,
          textTransform: 'none',
          transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
          '&:hover': {
            bgcolor: 'background.paper',
            borderColor: 'primary.main',
            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.08)}`,
          },
        }}
      >
        {!selectedSource ? (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
            <Avatar 
              sx={{ 
                width: 28,
                height: 28,
                bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.1),
              }}
            >
              <Iconify icon="eva:database-outline" width={16} height={16} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Select a data source
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {totalSources} available
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
            <Box sx={{ position: 'relative' }}>
              <DatabaseIcon>
                <Iconify 
                  icon={getDatabaseIcon(selectedSource.databaseType)} 
                  width={16}
                  height={16}
                />
              </DatabaseIcon>
              <ConnectionIndicator />
            </Box>
            <Box flexGrow={1} minWidth={0}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {selectedSource.name}
              </Typography>
              <Typography variant="caption" sx={{ color: getStatusColor(), fontWeight: 500 }}>
                Connected
              </Typography>
            </Box>
            <StyledChip
              label={selectedSource.databaseType}
              size="small"
            />
          </Stack>
        )}
      </Button>

      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1.5,
            overflow: 'hidden',
            filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.15))',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            '& .MuiList-root': {
              py: 0,
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: (t) => alpha(t.palette.grey[500], 0.08),
                borderRadius: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: (t) => alpha(t.palette.grey[500], 0.24),
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: (t) => alpha(t.palette.grey[500], 0.32),
                },
              },
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 25,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
            animation: `${fadeIn} 0.2s ease-out`,
          },
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            pb: 1,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TextField
            size="small"
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} height={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) => alpha(theme.palette.grey[500], 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
              },
            }}
          />
        </Box>

        {filteredOwnedSources.length > 0 && (
          <Box>
            <StyledListSubheader>
              <Stack direction="row" alignItems="center">
                <Iconify icon="eva:person-fill" width={14} height={14} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                >
                  Owned by Me
                </Typography>
                <Badge 
                  badgeContent={filteredOwnedSources.length} 
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    },
                  }}
                />
              </Stack>
            </StyledListSubheader>
            
            {filteredOwnedSources.map((source) => (
              <StyledMenuItem
                key={source.id}
                selected={selectedSource?.id === source.id}
                onClick={() => {
                  onSourceSelect(source);
                  handleCloseMenu();
                }}
              >
                {renderSourceItem(source, true)}
              </StyledMenuItem>
            ))}
          </Box>
        )}

        {filteredSharedSources.length > 0 && (
          <Box>
            <StyledListSubheader>
              <Stack direction="row" alignItems="center">
                <Iconify icon="eva:people-fill" width={14} height={14} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                >
                  Shared with Me
                </Typography>
                <Badge 
                  badgeContent={filteredSharedSources.length} 
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    },
                  }}
                />
              </Stack>
            </StyledListSubheader>
            
            {filteredSharedSources.map((source) => (
              <StyledMenuItem
                key={source.id}
                selected={selectedSource?.id === source.id}
                onClick={() => {
                  onSourceSelect(source);
                  handleCloseMenu();
                }}
              >
                {renderSourceItem(source, false)}
              </StyledMenuItem>
            ))}
          </Box>
        )}

        {filteredOwnedSources.length === 0 && filteredSharedSources.length === 0 && (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            animation: `${fadeIn} 0.3s ease-out`,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Iconify 
              icon="eva:search-outline" 
              width={48} 
              height={48} 
              sx={{ 
                mb: 2, 
                opacity: 0.5,
                color: 'text.secondary' 
              }} 
            />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 1,
                color: 'text.primary',
                fontWeight: 500
              }}
            >
              {searchQuery ? `No results for "${searchQuery}"` : 'No data sources available'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                mb: 2
              }}
            >
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create a new data source to get started'}
            </Typography>
            {searchQuery && (
              <Button 
                size="small" 
                onClick={() => setSearchQuery('')}
                startIcon={<Iconify icon="eva:close-fill" />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Clear search
              </Button>
            )}
          </Box>
        )}

        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ 
          p: 1.5,
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}>
          <CreateButton 
            fullWidth 
            startIcon={<Iconify icon="eva:plus-fill" width={18} height={18} />}
            onClick={() => { 
              onCreateSource(); 
              handleCloseMenu(); 
            }}
          >
            Create New Data Source
          </CreateButton>
        </Box>
      </Menu>
    </Box>
  );
}