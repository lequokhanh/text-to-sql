// File: src/sections/database-chat/view/database-view.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { alpha, styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Fade,
  Alert,
  Paper,
  Stack,
  Button,
  Dialog,
  Tooltip,
  Typography,
  AlertTitle,
  DialogTitle,
  DialogContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { useDataSources } from 'src/hooks/use-data-sources';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { DatabaseLayout } from 'src/layouts/db-chat/database-layout';

import Iconify from 'src/components/iconify';
import { MainContent } from 'src/components/text-to-sql/main-content/MainContent';
import { UnifiedChatInterface } from 'src/components/text-to-sql/chat/unified-chat-interface';
import { SchemaVisualization } from 'src/components/text-to-sql/dialogs/schema-visualization';
import { DataSourceDropdown } from 'src/components/text-to-sql/datasource/datasource-dropdown';

import { DatabaseSource, ColumnRelation, TableDefinition, ColumnDefinition } from 'src/types/database';

// Constants for layout
const MAIN_SIDEBAR_WIDTH = 80; // Width of the main sidebar
const CHAT_SIDEBAR_WIDTH = { xs: 280, sm: 320 }; // Width of the chat sidebar
const HEADER_HEIGHT = 104; // Height of the header with equal top and bottom padding

const DATABASE_ICONS = {
  POSTGRESQL: 'logos:postgresql',
  MYSQL: 'logos:mysql',
  ORACLE: 'logos:oracle',
};

const HeaderContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: MAIN_SIDEBAR_WIDTH, // Offset by the main sidebar width
  right: 0,
  zIndex: 1100, // Below main sidebar but above other content
  padding: theme.spacing(4), // Equal padding all around
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.03)}`,
  transition: theme.transitions.create(['box-shadow', 'background-color'], {
    duration: theme.transitions.duration.short,
  }),
}));

const HeaderTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -6,
    left: 0,
    width: 60,
    height: 3,
    borderRadius: 1.5,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

// Define relation type constants
type RelationType = 'OTO' | 'OTM' | 'MTO';

// Define outgoing relation interface for manage datasource
interface OutgoingRelation {
  id: number;
  toColumn: {
    id: number;
    columnIdentifier: string;
    columnType: string;
    columnDescription: string;
    isPrimaryKey: boolean;
  };
  type: RelationType;
}

// Helper function to find table and column by column ID - keep this outside since it's pure
const findTableAndColumnById = (tables: TableDefinition[], columnId: number): { tableIdentifier: string; columnIdentifier: string } | null => {
  const foundTable = tables.find(table => 
    table.columns.some((col: ColumnDefinition) => col.id === columnId)
  );

  if (foundTable) {
    const foundColumn = foundTable.columns.find((col: ColumnDefinition) => col.id === columnId);
    if (foundColumn) {
      return {
        tableIdentifier: foundTable.tableIdentifier,
        columnIdentifier: foundColumn.columnIdentifier
      };
    }
  }
  return null;
};

// Helper function to normalize relations
const normalizeRelations = (column: ColumnDefinition, tablesToSearch: TableDefinition[]): ColumnRelation[] => {
  const relations: ColumnRelation[] = [];
  
  // Handle standard relations
  if (column.relations && Array.isArray(column.relations)) {
    relations.push(...column.relations);
  }
  
  // Handle outgoing relations if they exist
  if ('outgoingRelations' in column && Array.isArray((column as any).outgoingRelations)) {
    const outgoingRelations = (column as any).outgoingRelations as OutgoingRelation[];
    relations.push(...outgoingRelations.map(rel => {
      const targetInfo = findTableAndColumnById(tablesToSearch, rel.toColumn.id);
      return {
        id: rel.id,
        tableIdentifier: targetInfo?.tableIdentifier || 'Unknown Table',
        toColumn: targetInfo?.columnIdentifier || rel.toColumn.columnIdentifier,
        type: rel.type || 'OTO'
      };
    }));
  }
  
  return relations;
};

export default function DatabaseView() {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showNoSourceAlert, setShowNoSourceAlert] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false);
  const [detailedSource, setDetailedSource] = useState<DatabaseSource | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableDefinition | null>(null);

  // Custom hooks
  const {
    dataSources: ownedSources,
    sharedSources,
    selectedSource,
    setSelectedSource,
    fetchDataSources,
    createDataSource,
    isLoading,
  } = useDataSources();

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSourceSelect = (source: DatabaseSource) => {
    // For shared sources, we only use the data we already have (id, name, databaseType)
    // No need to fetch additional details since we don't have access
    setSelectedSource(source);
    setShowNoSourceAlert(false);
  };

  const handleManageSource = (sourceId: string) => {
    navigate(`/datasource/${sourceId}/manage`);
  };

  const handleCreateDataSource = async (source: DatabaseSource) => {
    try {
      await createDataSource(source);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  const handleSourceRequired = () => {
    setShowNoSourceAlert(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setShowNoSourceAlert(false), 5000);
  };

  const handleViewSchema = async () => {
    if (!selectedSource) return;

    setIsSchemaDialogOpen(true);
    setIsLoadingSchema(true);
    setSchemaError(null);

    try {
      const response = await axiosInstance.get(`${endpoints.dataSource.base}/${selectedSource.id}`);
      setDetailedSource(response.data);
    } catch (error) {
      console.error('Error fetching schema:', error);
      setSchemaError('Failed to load schema. Please try again.');
    } finally {
      setIsLoadingSchema(false);
    }
  };

  return (
    <DatabaseLayout>
      {/* Progress indicator */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: MAIN_SIDEBAR_WIDTH,
            right: 0,
            zIndex: 1101,
          }}
        />
      )}

      {/* Header with Dropdown */}
      <HeaderContainer 
        elevation={0}
        sx={{
          bgcolor: isScrolled 
            ? alpha(theme.palette.background.default, 0.98)
            : alpha(theme.palette.background.default, 0.95),
          backgroundImage: isScrolled 
            ? `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.background.default, 0.98)})`
            : `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.background.default, 0.95)})`,
          boxShadow: isScrolled 
            ? `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.08)}`
            : `0 2px 12px 0 ${alpha(theme.palette.common.black, 0.04)}`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          width: { 
            xs: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.xs}px)`,
            sm: `calc(100% - ${MAIN_SIDEBAR_WIDTH}px - ${CHAT_SIDEBAR_WIDTH.sm}px)`,
          },
          px: { xs: 2, sm: 3 },
          py: 2,
          height: HEADER_HEIGHT,
          transition: theme.transitions.create(['background-color', 'box-shadow'], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
          <HeaderTitle>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ 
                  letterSpacing: '-0.025em',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SequolKit
              </Typography>
            </Box>
          </HeaderTitle>

          {selectedSource && (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 4 }}>
              <Iconify
                icon={DATABASE_ICONS[selectedSource.databaseType] || 'mdi:database'}
                width={20}
                sx={{ color: 'primary.main' }}
              />
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                  {selectedSource.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {selectedSource.host}:{selectedSource.port} • {selectedSource.databaseName}
                </Typography>
              </Stack>
              {selectedSource.databaseDescription && (
                <Tooltip title={selectedSource.databaseDescription}>
                  <Iconify icon="eva:info-outline" width={20} sx={{ color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              )}
              <Button
                variant="soft"
                color="primary"
                size="small"
                startIcon={<Iconify icon="mdi:database-search" />}
                onClick={handleViewSchema}
              >
                Schema
              </Button>
            </Stack>
          )}
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 'auto' }}>            
            <DataSourceDropdown
              ownedSources={ownedSources}
              sharedSources={sharedSources}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              onCreateSource={() => setIsCreateDialogOpen(true)}
              onManageSource={handleManageSource}
              style={{
                borderRadius: 12,
                minWidth: 200,
                boxShadow: `0 4px 12px 0 ${alpha(theme.palette.common.black, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(20px)',
              }}
            />
          </Stack>
        </Stack>
      </HeaderContainer>

      {/* Alert */}
      <Fade in={showNoSourceAlert}>
        <Alert 
          severity="warning" 
          sx={{ 
            position: 'fixed',
            top: HEADER_HEIGHT + 20,
            left: MAIN_SIDEBAR_WIDTH + 20,
            right: CHAT_SIDEBAR_WIDTH.sm + 20,
            zIndex: 1000,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            '& .MuiAlert-icon': {
              fontSize: 22,
            },
          }} 
          onClose={() => setShowNoSourceAlert(false)}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>No Data Source Selected</AlertTitle>
          Please select a data source from the dropdown to continue.
        </Alert>
      </Fade>

      {/* Schema Visualization Dialog */}
      <Dialog
        open={isSchemaDialogOpen}
        onClose={() => {
          setIsSchemaDialogOpen(false);
          setDetailedSource(null);
          setSchemaError(null);
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="eva:diagram-fill" width={24} sx={{ color: 'primary.main' }} />
            <Typography variant="h6">Database Schema</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {isLoadingSchema && (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading schema...
              </Typography>
            </Box>
          )}

          {schemaError && (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}>
              <Iconify icon="eva:alert-triangle-fill" width={40} sx={{ color: 'error.main' }} />
              <Typography color="error" variant="subtitle1">
                {schemaError}
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleViewSchema}
                startIcon={<Iconify icon="eva:refresh-outline" />}
              >
                Retry
              </Button>
            </Box>
          )}

          {!isLoadingSchema && !schemaError && detailedSource?.tableDefinitions && (
            <Box
              sx={{
                width: '92%',
                height: '92%',
                margin: 'auto',
                position: 'relative',
                top: '4%',
              }}
            >
              <SchemaVisualization
                tables={detailedSource.tableDefinitions.map(table => ({
                  ...table,
                  columns: table.columns.map(column => ({
                    ...column,
                    relations: normalizeRelations(column, detailedSource.tableDefinitions)
                  }))
                }))}
                selectedTable={selectedTable?.tableIdentifier || null}
                onTableClick={(tableIdentifier: string) => {
                  const table1 = detailedSource.tableDefinitions.find(table => table.tableIdentifier === tableIdentifier);
                  if (table1) {
                    setSelectedTable(table1);
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Interface */}
      <Box sx={{ 
        position: 'relative', 
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        mt: `${HEADER_HEIGHT}px`, 
        overflow: 'hidden',
        width: { 
          xs: `calc(100% - ${CHAT_SIDEBAR_WIDTH.xs}px)`,
          sm: `calc(100% - ${CHAT_SIDEBAR_WIDTH.sm}px)`,
        },
      }}>
        <UnifiedChatInterface
          selectedSource={selectedSource}
          onSourceRequired={handleSourceRequired}
        />
      </Box>

      {/* Create Dialog */}
      <MainContent.CreateDataSourceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateSource={handleCreateDataSource}
      />
    </DatabaseLayout>
  );
}