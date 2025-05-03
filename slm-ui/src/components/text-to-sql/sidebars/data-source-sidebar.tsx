// File: src/sections/database-management/components/sidebars/DataSourceSidebar.tsx

import { useState } from 'react';

import {
  Box,
  Chip,
  Stack,
  alpha,
  Button,
  styled,
  Tooltip,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import { ScrollableContent } from 'src/layouts/db-chat/database-layout';

import Iconify from 'src/components/iconify';

import { DatabaseSource } from 'src/types/database';

const DataSourceButton = styled(Button)(({ theme }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(0.75),
  transition: theme.transitions.create(['background-color', 'box-shadow', 'transform'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.customShadows?.z8,
  },
}));

const SourceTypeChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: '0.625rem',
  fontWeight: 600,
  marginLeft: theme.spacing(1),
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

interface DataSourceSidebarProps {
  dataSources: DatabaseSource[];
  selectedSource: DatabaseSource | null;
  onSourceSelect: (source: DatabaseSource) => void;
  onCreateSource: () => void;
}

export function DataSourceSidebar({
  dataSources,
  selectedSource,
  onSourceSelect,
  onCreateSource,
}: DataSourceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data sources based on search query
  const filteredSources = dataSources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <>
      <SidebarHeader>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="h6" fontWeight={600}>
            Data Sources
          </Typography>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={onCreateSource}
          sx={{ mb: 2 }}
        >
          Create Data Source
        </Button>

        {dataSources.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search sources..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} height={18} color="text.disabled" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1.5,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                },
              },
            }}
          />
        )}
      </SidebarHeader>

      <ScrollableContent>
        {filteredSources.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              {dataSources.length === 0
                ? 'No data sources found. Create one to get started.'
                : 'No matching data sources found.'}
            </Typography>
          </Box>
        ) : (
          <Stack sx={{ p: 2 }}>
            {filteredSources.map((source) => {
              const isSelected = selectedSource?.name === source.name;

              return (
                <Tooltip
                  key={source.name}
                  title={`${source.host}:${source.port}/${source.databaseName}`}
                  placement="right"
                >
                  <DataSourceButton
                    fullWidth
                    variant={isSelected ? 'contained' : 'outlined'}
                    color={isSelected ? 'primary' : 'inherit'}
                    onClick={() => onSourceSelect(source)}
                    sx={{
                      boxShadow: isSelected ? 4 : 0,
                      borderWidth: isSelected ? 0 : 1,
                      bgcolor: isSelected ? 'primary.main' : 'background.paper',
                      color: isSelected ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="eva:database-fill"
                          width={18}
                          height={18}
                          color={isSelected ? 'inherit' : 'primary.main'}
                        />
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            fontWeight: isSelected ? 600 : 400,
                            maxWidth: 110, // Limit width to control truncation
                          }}
                        >
                          {source.name.length > 20 ? `${source.name.slice(0, 20)}...` : source.name}
                        </Typography>
                      </Stack>

                      <SourceTypeChip
                        label={source.databaseType}
                        size="small"
                        color={isSelected ? 'default' : 'primary'}
                        variant={isSelected ? 'filled' : 'outlined'}
                      />
                    </Stack>
                  </DataSourceButton>
                </Tooltip>
              );
            })}
          </Stack>
        )}
      </ScrollableContent>
    </>
  );
}
