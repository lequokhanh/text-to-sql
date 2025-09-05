import { useRef, useState } from 'react';

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
  from { 
    opacity: 0; 
    transform: translateY(-10px) scale(0.95);
    filter: blur(4px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

const pulse = keyframes`
  0% { 
    box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.4),
                0 0 0 0 rgba(46, 213, 115, 0.4) inset;
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(46, 213, 115, 0),
                0 0 0 4px rgba(46, 213, 115, 0.1) inset;
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(46, 213, 115, 0),
                0 0 0 0 rgba(46, 213, 115, 0) inset;
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3),
                0 0 40px rgba(25, 118, 210, 0.1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(25, 118, 210, 0.4),
                0 0 60px rgba(25, 118, 210, 0.2);
  }
`;

const StyledChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.7rem',
  fontWeight: 700,
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.08)} 0%, 
    ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
  color: theme.palette.primary.main,
  backdropFilter: 'blur(8px)',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.12)} 0%, 
      ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '& .MuiChip-label': {
    paddingX: theme.spacing(1.5),
    letterSpacing: '0.5px',
  },
}));

const CreateButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.875rem',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '100%',
    background: `linear-gradient(90deg, 
      transparent 0%, 
      ${alpha(theme.palette.common.white, 0.3)} 50%, 
      transparent 100%)`,
    animation: `${shimmer} 3s ease-in-out infinite`,
  },
  '&:hover': {
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.dark} 0%, 
      ${theme.palette.primary.main} 100%)`,
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.45)}`,
    animation: `${glow} 2s ease-in-out infinite`,
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1)',
  },
}));

const ConnectionIndicator = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: `radial-gradient(circle, 
    ${theme.palette.success.light} 0%, 
    ${theme.palette.success.main} 100%)`,
  animation: `${pulse} 2s ease-in-out infinite`,
  position: 'absolute',
  top: 0,
  right: 0,
  boxShadow: `0 0 0 3px ${theme.palette.background.paper},
              0 0 12px ${theme.palette.success.main}`,
}));

const DatabaseIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
    ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  backdropFilter: 'blur(10px)',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.1)},
                0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.15)} 0%, 
      ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1.5),
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    background: `linear-gradient(90deg, 
      transparent 0%, 
      ${alpha(theme.palette.primary.main, 0.1)} 50%, 
      transparent 100%)`,
    transition: theme.transitions.create(['left'], {
      duration: theme.transitions.duration.complex,
    }),
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    backdropFilter: 'blur(10px)',
    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
    '&:before': {
      left: '100%',
    },
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateX(4px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
    '&:before': {
      left: '100%',
    },
  },
}));

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  lineHeight: '36px',
  fontSize: '0.7rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: theme.palette.text.secondary,
  background: `linear-gradient(180deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
  backdropFilter: 'blur(12px)',
  marginTop: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  '& .MuiStack-root': {
    '& .MuiBadge-root': {
      marginLeft: theme.spacing(2),
    },
    '& .MuiSvgIcon-root': {
      marginRight: theme.spacing(1),
    },
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: theme.spacing(3),
    marginTop: theme.spacing(1.5),
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    background: alpha(theme.palette.background.paper, 0.95),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)},
                0 0 0 1px ${alpha(theme.palette.common.white, 0.1)} inset`,
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(2),
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    backdropFilter: 'blur(10px)',
    transition: theme.transitions.create(['all']),
    '& fieldset': {
      borderColor: alpha(theme.palette.divider, 0.1),
      borderWidth: 1,
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      '& fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    fontSize: '0.65rem',
    height: 18,
    minWidth: 18,
    padding: '0 6px',
    fontWeight: 700,
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.main} 0%, 
      ${theme.palette.primary.dark} 100%)`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
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
    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        <DatabaseIcon>
          <Iconify 
            icon={getDatabaseIcon(source.databaseType)} 
            width={18}
            height={18}
          />
        </DatabaseIcon>
        {selectedSource?.id === source.id && (
          <ConnectionIndicator />
        )}
      </Box>
      
      <Box flexGrow={1} minWidth={0}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700,
            letterSpacing: '-0.5px',
            fontSize: '0.9rem',
          }} 
          noWrap
        >
          {source.name}
        </Typography>
        {isOwned && source.host && (
          <Tooltip 
            title={`${source.host}:${source.port}/${source.databaseName}`}
            placement="top"
            arrow
            sx={{
              '& .MuiTooltip-tooltip': {
                backdropFilter: 'blur(10px)',
                background: alpha('#000', 0.8),
                fontSize: '0.75rem',
              },
            }}
          >
            <Typography 
              variant="caption" 
              component="div"
              sx={{ 
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                opacity: 0.8,
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
                  display: 'inline-block',
                  fontSize: '0.7rem',
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
          <Tooltip 
            title="Manage"
            arrow
            placement="top"
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onManageSource(source.id);
                handleCloseMenu();
              }}
              sx={{
                width: 28,
                height: 28,
                transition: 'all 0.2s',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: alpha('#1976d2', 0.08),
                  transform: 'rotate(90deg)',
                },
              }}
            >
              <Iconify icon="eva:settings-2-fill" width={16} height={16} />
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
        endIcon={
          <Iconify 
            icon="eva:chevron-down-fill" 
            width={18} 
            height={18}
            sx={{
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        }
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          minWidth: 320,
          width: '100%',
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: alpha('#000', 0.08),
          bgcolor: 'background.paper',
          p: 2,
          textTransform: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: (theme) => theme.transitions.create(['all']),
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, 
              ${alpha('#1976d2', 0.03)} 0%, 
              transparent 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s',
          },
          '&:hover': {
            bgcolor: 'background.paper',
            borderColor: 'primary.main',
            transform: 'translateY(-1px)',
            boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
            '&:before': {
              opacity: 1,
            },
          },
        }}
      >
        {!selectedSource ? (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Avatar 
              sx={{ 
                width: 36,
                height: 36,
                background: (theme) => `linear-gradient(135deg, 
                  ${alpha(theme.palette.text.secondary, 0.08)} 0%, 
                  ${alpha(theme.palette.text.secondary, 0.04)} 100%)`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Iconify 
                icon="eva:database-outline" 
                width={20} 
                height={20}
                sx={{ color: 'text.secondary' }}
              />
            </Avatar>
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600,
                  letterSpacing: '-0.5px',
                }}
              >
                Select a data source
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.disabled',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                {totalSources} available
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ position: 'relative' }}>
              <DatabaseIcon>
                <Iconify 
                  icon={getDatabaseIcon(selectedSource.databaseType)} 
                  width={18}
                  height={18}
                />
              </DatabaseIcon>
              <ConnectionIndicator />
            </Box>
            <Box flexGrow={1} minWidth={0}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  fontSize: '0.95rem',
                }} 
                noWrap
              >
                {selectedSource.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: getStatusColor(), 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    display: 'inline-block',
                  }}
                />
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

      <StyledMenu
        anchorEl={anchorRef.current}
        open={open}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 520,
            mt: 1.5,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            '& .MuiList-root': {
              py: 0,
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: (t) => alpha(t.palette.grey[500], 0.05),
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: (t) => alpha(t.palette.grey[500], 0.2),
                borderRadius: '10px',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
                '&:hover': {
                  backgroundColor: (t) => alpha(t.palette.grey[500], 0.3),
                },
              },
            },
            animation: `${fadeIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
          },
        }}
      >
        <Box 
          sx={{ 
            p: 2.5, 
            position: 'sticky',
            top: 0,
            // background: `linear-gradient(180deg, 
            //   ${alpha('#fff', 0.98)} 0%, 
            //   ${alpha('#fff', 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            zIndex: 20,
            borderBottom: '1px solid',
            borderColor: alpha('#000', 0.05),
          }}
        >
          <SearchField
            size="small"
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify 
                    icon="eva:search-fill" 
                    width={20} 
                    height={20} 
                    sx={{ color: 'text.disabled' }} 
                  />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredOwnedSources.length > 0 && (
          <Box>
            <StyledListSubheader>
              <Stack direction="row" alignItems="center">
                <Iconify 
                  icon="eva:person-fill" 
                  width={16} 
                  height={16}
                  sx={{ color: 'primary.main' }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1,
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                  }}
                >
                  Owned by Me
                </Typography>
                <StyledBadge 
                  badgeContent={filteredOwnedSources.length} 
                  color="primary"
                />
              </Stack>
            </StyledListSubheader>
            
            {filteredOwnedSources.map((source, index) => (
              <StyledMenuItem
                key={source.id}
                selected={selectedSource?.id === source.id}
                onClick={() => {
                  onSourceSelect(source);
                  handleCloseMenu();
                }}
                sx={{
                  animationDelay: `${index * 50}ms`,
                  animation: `${fadeIn} 0.3s ease-out forwards`,
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
                <Iconify 
                  icon="eva:people-fill" 
                  width={16} 
                  height={16}
                  sx={{ color: 'secondary.main' }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1,
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                  }}
                >
                  Shared with Me
                </Typography>
                <StyledBadge
                  badgeContent={filteredSharedSources.length} 
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      background: `linear-gradient(135deg, 
                        ${alpha('#9c27b0', 0.9)} 0%, 
                        ${alpha('#673ab7', 0.9)} 100%)`,
                    },
                  }}
                />
              </Stack>
            </StyledListSubheader>
            
            {filteredSharedSources.map((source, index) => (
              <StyledMenuItem
                key={source.id}
                selected={selectedSource?.id === source.id}
                onClick={() => {
                  onSourceSelect(source);
                  handleCloseMenu();
                }}
                sx={{
                  animationDelay: `${index * 50}ms`,
                  animation: `${fadeIn} 0.3s ease-out forwards`,
                }}
              >
                {renderSourceItem(source, false)}
              </StyledMenuItem>
            ))}
          </Box>
        )}

        {filteredOwnedSources.length === 0 && filteredSharedSources.length === 0 && (
          <Box sx={{ 
            p: 6, 
            textAlign: 'center',
            animation: `${fadeIn} 0.4s ease-out`,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: (theme) => `linear-gradient(135deg, 
                  ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                  ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <Iconify 
                icon="eva:search-outline" 
                width={32} 
                height={32} 
                sx={{ 
                  color: 'primary.main',
                  opacity: 0.8,
                }} 
              />
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 1,
                color: 'text.primary',
                fontWeight: 700,
                letterSpacing: '-0.5px',
              }}
            >
              {searchQuery ? `No results for "${searchQuery}"` : 'No data sources available'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                mb: 3,
                opacity: 0.8,
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
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Clear search
              </Button>
            )}
          </Box>
        )}

        <Divider 
          sx={{ 
            my: 0,
            borderColor: alpha('#000', 0.05),
          }} 
        />
        
        <Box sx={{ 
          p: 2,
          position: 'sticky',
          bottom: 0,
          // background: `linear-gradient(180deg, 
          //   ${alpha('#fff', 0.95)} 0%, 
          //   ${alpha('#fff', 0.98)} 100%)`,
          backdropFilter: 'blur(20px)',
          zIndex: 10,
        }}>
          <CreateButton 
            fullWidth 
            startIcon={<Iconify icon="eva:plus-fill" width={20} height={20} />}
            onClick={() => { 
              onCreateSource(); 
              handleCloseMenu(); 
            }}
          >
            Create New Data Source
          </CreateButton>
        </Box>
      </StyledMenu>
    </Box>
  );
}