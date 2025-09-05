import { useRef, useState } from 'react';

import { alpha, styled } from '@mui/material/styles';
import {
  Box,
  Menu,
  Stack,
  Badge,
  Divider,
  Tooltip,
  Typography,
  ListSubheader,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { DatabaseSource } from 'src/types/database';

import { 
  useSearch, 
  StyledChip, 
  EmptyState, 
  SearchField,
  PrimaryButton,
  StyledMenuItem 
} from '../shared';

// Component-specific styled components
const ConnectionIndicator = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`,
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}`,
    },
    '70%': {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.success.main, 0)}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0)}`,
    },
  },
}));

const DatabaseIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
    ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.15)} 0%, 
      ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transform: 'scale(1.05)',
  },
}));

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  backgroundColor: 'transparent',
  color: theme.palette.text.secondary,
  fontWeight: 700,
  fontSize: '0.75rem',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  padding: theme.spacing(2, 2, 1),
  lineHeight: 1.2,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  marginBottom: theme.spacing(0.5),
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 16,
    minWidth: 320,
    maxWidth: 400,
    maxHeight: 480,
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: theme.customShadows?.dropdown || '0 8px 32px rgba(0,0,0,0.12)',
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.main,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

interface DataSourceDropdownProps {
  dataSources: DatabaseSource[];
  selectedSource: DatabaseSource | null;
  onSelectSource: (source: DatabaseSource | null) => void;
  onCreateSource: () => void;
  disabled?: boolean;
}

export function DataSourceDropdown({
  dataSources,
  selectedSource,
  onSelectSource,
  onCreateSource,
  disabled = false,
}: DataSourceDropdownProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  // For now, treat all sources as owned (since the interface doesn't distinguish)
  // In a real app, this would come from the API or user context
  const ownedSources = dataSources;
  const sharedSources: DatabaseSource[] = []; // Empty for now

  // Search functionality
  const { searchQuery, setSearchQuery, filteredItems: filteredOwnedSources, clearSearch } = useSearch(
    ownedSources,
    (source, query) => source.name.toLowerCase().includes(query.toLowerCase()) ||
                      source.databaseDescription?.toLowerCase().includes(query.toLowerCase()) ||
                      source.databaseType.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSharedSources = sharedSources.filter(source => 
    searchQuery ? (
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.databaseDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.databaseType.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true
  );

  const handleOpenMenu = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  const handleCloseMenu = () => {
    setOpen(false);
    setSearchQuery('');
  };

  const handleSelectSource = (source: DatabaseSource) => {
    onSelectSource(source);
    handleCloseMenu();
  };

  const renderSourceMenuItem = (source: DatabaseSource) => (
    <StyledMenuItem
      key={source.id}
      onClick={() => handleSelectSource(source)}
      selected={selectedSource?.id === source.id}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          invisible={false} // Always show as connected for simplicity
        >
          <DatabaseIcon>
            <Iconify 
              icon="eva:database-fill" 
              width={20} 
              height={20} 
              sx={{ color: 'primary.main' }} 
            />
          </DatabaseIcon>
        </StyledBadge>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {source.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <StyledChip 
              label={source.databaseType.toUpperCase()} 
              size="small"
            />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <ConnectionIndicator />
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                Connected
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </StyledMenuItem>
  );

  return (
    <Box>
      <Tooltip 
        title={disabled ? "Please wait..." : "Select data source"} 
        placement="top"
      >
        <PrimaryButton
          ref={anchorRef}
          onClick={handleOpenMenu}
          disabled={disabled}
          startIcon={<Iconify icon="eva:database-fill" />}
          endIcon={<Iconify icon="eva:chevron-down-fill" />}
          sx={{
            minWidth: { xs: 180, sm: 220 },
            justifyContent: 'space-between',
          }}
        >
          {selectedSource ? selectedSource.name : 'Select Data Source'}
        </PrimaryButton>
      </Tooltip>

      <StyledMenu
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { overflow: 'hidden' },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <SearchField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={clearSearch}
            size="small"
          />
        </Box>

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredOwnedSources.length > 0 && (
            <>
              <StyledListSubheader>Your Data Sources</StyledListSubheader>
              {filteredOwnedSources.map(renderSourceMenuItem)}
            </>
          )}

          {filteredSharedSources.length > 0 && (
            <>
              <StyledListSubheader>Shared with You</StyledListSubheader>
              {filteredSharedSources.map(renderSourceMenuItem)}
            </>
          )}

          {filteredOwnedSources.length === 0 && filteredSharedSources.length === 0 && (
            <EmptyState
              icon="eva:search-outline"
              title={searchQuery ? `No results for "${searchQuery}"` : 'No data sources available'}
              description={searchQuery ? 'Try adjusting your search terms' : 'Create a new data source to get started'}
              action={searchQuery ? (
                <PrimaryButton 
                  size="small" 
                  onClick={clearSearch}
                  startIcon={<Iconify icon="eva:close-fill" />}
                >
                  Clear search
                </PrimaryButton>
              ) : undefined}
            />
          )}
        </Box>

        <Divider sx={{ borderColor: alpha('#000', 0.05) }} />
        
        <Box sx={{ p: 2 }}>
          <PrimaryButton 
            fullWidth 
            startIcon={<Iconify icon="eva:plus-fill" width={20} height={20} />}
            onClick={() => { 
              onCreateSource(); 
              handleCloseMenu(); 
            }}
          >
            Create New Data Source
          </PrimaryButton>
        </Box>
      </StyledMenu>
    </Box>
  );
}