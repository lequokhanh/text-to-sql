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

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.3); }
  70% { box-shadow: 0 0 0 8px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

const StyledChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: '0.65rem',
  fontWeight: 600,
  borderRadius: 6,
  border: 'none',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  '& .MuiChip-label': {
    paddingX: theme.spacing(0.75),
  },
}));

const CreateButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 1.5),
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
}));

const DatabaseIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
      source.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.databaseName.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
          {source.host}:{source.port}/{source.databaseName}
        </Typography>
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
          minWidth: 240,
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 1.5,
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'background.paper',
            borderColor: 'primary.main',
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
            width: 320,
            maxHeight: 400,
            mt: 1,
            boxShadow: 3,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            size="small"
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={16} height={16} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredOwnedSources.length > 0 && (
          <Box>
            <ListSubheader key="owned-header">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="eva:person-fill" width={14} height={14} />
                <span>Owned by Me</span>
                <Badge badgeContent={filteredOwnedSources.length} color="primary" />
              </Stack>
            </ListSubheader>
            
            {filteredOwnedSources.map((source) => (
              <MenuItem
                key={source.id}
                selected={selectedSource?.id === source.id}
                onClick={() => {
                  onSourceSelect(source);
                  handleCloseMenu();
                }}
              >
                {renderSourceItem(source, true)}
              </MenuItem>
            ))}
          </Box>
        )}

        {filteredSharedSources.length > 0 && (
          <Box>
            <ListSubheader key="shared-header">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="eva:people-fill" width={14} height={14} />
                <span>Shared with Me</span>
                <Badge badgeContent={filteredSharedSources.length} color="secondary" />
              </Stack>
            </ListSubheader>
            
            {filteredSharedSources.map((source) => (
              <MenuItem
                key={source.id}
                selected={selectedSource?.id === source.id}
                onClick={() => {
                  onSourceSelect(source);
                  handleCloseMenu();
                }}
              >
                {renderSourceItem(source, false)}
              </MenuItem>
            ))}
          </Box>
        )}

        {filteredOwnedSources.length === 0 && filteredSharedSources.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Iconify icon="eva:search-outline" width={32} height={32} sx={{ mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {searchQuery ? `No results for "${searchQuery}"` : 'No data sources available'}
            </Typography>
            {searchQuery && (
              <Button size="small" onClick={() => setSearchQuery('')} sx={{ mt: 1 }}>
                Clear search
              </Button>
            )}
          </Box>
        )}

        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => { onCreateSource(); handleCloseMenu(); }}>
          <CreateButton 
            fullWidth 
            startIcon={<Iconify icon="eva:plus-fill" width={16} height={16} />}
          >
            Create New Data Source
          </CreateButton>
        </MenuItem>
      </Menu>
    </Box>
  );
}