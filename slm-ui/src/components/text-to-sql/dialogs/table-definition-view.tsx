import { enqueueSnackbar } from 'notistack';
import { m, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import KeyIcon from '@mui/icons-material/Key';
import InputBase from '@mui/material/InputBase';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import LinkIcon from '@mui/icons-material/Link';
import SaveIcon from '@mui/icons-material/Save';
import Search from '@mui/icons-material/Search';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CancelIcon from '@mui/icons-material/Close';
import ButtonGroup from '@mui/material/ButtonGroup';
import useMediaQuery from '@mui/material/useMediaQuery';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { alpha, styled, useTheme, keyframes } from '@mui/material/styles';

import { useDebounce } from 'src/hooks/use-debounce';

import Iconify from 'src/components/iconify';

import { TableDefinition, ColumnDefinition } from 'src/types/database';

import { SchemaVisualization } from './schema-visualization';

// Define relation type constants to avoid typos
type RelationType = 'OTO' | 'OTM' | 'MTO' | 'MTM';

// ----------------------------------------------------------------------
// Styled components
interface StyledCardProps {
  selected?: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<StyledCardProps>(({ theme, selected }) => ({
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 12,
  ...(selected && {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid',
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
  '&:hover': {
    boxShadow: selected
      ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`
      : theme.shadows[6],
    transform: 'translateY(-2px)',
  },
}));

// Fixed: Enhanced table container with fixed width
// Using template string syntax instead of object syntax
const StyledTableContainer = styled(TableContainer)`
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.palette.divider};
  
  & .MuiTableCell-root {
    border-color: ${props => props.theme.palette.divider};
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  
  & .MuiTableCell-head {
    font-size: 0.8rem;
    font-weight: 600;
    background-color: ${props => props.theme.palette.mode === 'dark'
    ? alpha(props.theme.palette.background.default, 0.6)
    : alpha(props.theme.palette.grey[50], 1)
  };
  }
  
  & .MuiTableCell-body {
    font-size: 0.875rem;
  }
  
  width: 100%;
  max-width: 100%;
  
  @media (min-width: 960px) {
    max-width: 800px;
  }
  
  @media (min-width: 1200px) {
    max-width: 900px;
  }
  
  margin: 0 auto;
  
  & .column-name {
    width: 25%;
    min-width: 120px;
    max-width: 200px;
  }
  
  & .column-type {
    width: 15%;
    min-width: 80px;
    max-width: 120px;
  }
  
  & .column-description {
    width: 35%;
    min-width: 180px;
    max-width: 300px;
  }
  
  & .column-relations {
    width: 25%;
    min-width: 150px;
    max-width: 250px;
  }
`;

const StyledSearchInput = styled(InputBase)(({ theme }) => ({
  borderRadius: 8,
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.06)
    : alpha(theme.palette.common.black, 0.03),
  padding: theme.spacing(0.5, 1.5),
  width: '100%',
  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.08)
      : alpha(theme.palette.common.black, 0.05),
  },
  '&.Mui-focused': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.common.black, 0.06),
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const EditActionsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(0.5),
  right: theme.spacing(0.5),
  display: 'flex',
  gap: theme.spacing(0.25),
  padding: theme.spacing(0.25),
  zIndex: 10,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 4,
  boxShadow: theme.shadows[1],
  fontSize: '0.65rem',
  lineHeight: 1,
  minHeight: 'auto',
  opacity: 0.2,
  transform: 'scale(0.6)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    opacity: 1,
    transform: 'scale(1)',
  },
}));

const StyledRelationChip = styled(Chip)(({ theme }) => ({
  height: 'auto',
  fontSize: '0.75rem',
  marginRight: 4,
  marginTop: 2,
  marginBottom: 2,
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.info.dark, 0.2)
    : alpha(theme.palette.info.light, 0.2),
  borderRadius: 4,
  whiteSpace: 'normal',
  '& .MuiChip-label': {
    paddingLeft: 6,
    paddingRight: 6,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: 1.2,
  },
}));

const StyledColumnTypeChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: '0.7rem',
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.grey[700], 0.5)
    : alpha(theme.palette.grey[200], 0.8),
  borderRadius: 4,
  '& .MuiChip-label': {
    paddingLeft: 4,
    paddingRight: 4,
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -10,
    top: 8,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

const StyledPrimaryKeyIcon = styled(KeyIcon)(({ theme }) => ({
  fontSize: 16,
  color: theme.palette.warning.main,
  verticalAlign: 'middle',
  marginRight: theme.spacing(0.5),
}));

const StyledRelationIcon = styled(LinkIcon)(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.info.main,
  verticalAlign: 'middle',
  marginRight: theme.spacing(0.5),
}));

const MotionTableRow = m(TableRow);

// Relations container with improved scrolling
const RelationsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'nowrap',
  gap: theme.spacing(0.5),
  overflowX: 'auto',
  padding: theme.spacing(0.5, 0),
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    height: 4,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: alpha(theme.palette.common.black, 0.05),
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.primary.main, 0.3),
    borderRadius: 3,
  },
}));

const DescriptionTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: 48,
    alignItems: 'start',
  },
  '& .MuiInputBase-inputMultiline': {
    padding: theme.spacing(1),
  },
}));

// Animation for AI button
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 ${alpha('#3f51b5', 0.7)};
  }
  70% {
    box-shadow: 0 0 0 10px ${alpha('#3f51b5', 0)};
  }
  100% {
    box-shadow: 0 0 0 0 ${alpha('#3f51b5', 0)};
  }
`;

// AI Fill Button with glow effect
interface AIButtonWrapperProps {
  isAnimating: boolean;
  children: React.ReactNode;
}

const AIButtonWrapper = styled('div')<AIButtonWrapperProps>(({ theme, isAnimating }) => ({
  position: 'relative',
  display: 'inline-flex',
  borderRadius: 8,
  ...(isAnimating && {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 8,
      animation: `${pulseAnimation} 1.5s infinite`,
    }
  })
}));

// AI Fill Button
const AIFillButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  padding: theme.spacing(0.75, 2),
  height: 40,
  fontSize: '0.8125rem',
  fontWeight: 600,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  letterSpacing: 0.5,
  boxShadow: theme.shadows[3],
  borderRadius: 8,
  transition: 'all 0.2s ease-in-out',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${theme.palette.primary.dark} 100%)`,
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)',
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  },
  '&:active': {
    boxShadow: theme.shadows[2],
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    background: theme.palette.mode === 'dark'
      ? alpha(theme.palette.grey[700], 0.5)
      : alpha(theme.palette.grey[300], 0.5),
    color: theme.palette.mode === 'dark'
      ? theme.palette.grey[500]
      : theme.palette.grey[400],
  }
}));

// Empty state component
const EmptyStateMessage = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.4)
    : alpha(theme.palette.background.paper, 0.7),
  textAlign: 'center',
  height: '100%',
  minHeight: 200,
}));

// Define proper types for the RelationTypeSelector component
interface RelationTypeSelectorProps {
  value: RelationType;
  onChange: (newType: RelationType) => void;
  disabled?: boolean;
}

/* eslint-disable react/prop-types */
const RelationTypeSelector: React.FC<RelationTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const relationTypes = [
    { value: 'OTO' as const, label: '1:1', tooltip: 'One-to-One' },
    { value: 'OTM' as const, label: '1:n', tooltip: 'One-to-Many' },
    { value: 'MTO' as const, label: 'n:1', tooltip: 'Many-to-One' },
    { value: 'MTM' as const, label: 'n:n', tooltip: 'Many-to-Many' }
  ];

  return (
    <ButtonGroup
      size="small"
      aria-label="relation type selector"
      disabled={disabled}
      sx={{
        borderRadius: 1,
        '.MuiButtonGroup-grouped': {
          minWidth: 36,
          px: 0.5,
          py: 0.25,
          fontSize: '0.7rem',
          fontWeight: 'medium'
        }
      }}
    >
      {relationTypes.map(type => (
        <Tooltip key={type.value} title={type.tooltip} arrow>
          <Button
            variant={value === type.value ? "contained" : "outlined"}
            color={value === type.value ? "primary" : "inherit"}
            onClick={() => onChange(type.value)}
          >
            {type.label}
          </Button>
        </Tooltip>
      ))}
    </ButtonGroup>
  );
};

interface Props {
  tables: TableDefinition[];
  onTablesUpdate?: (updatedTables: TableDefinition[]) => void;
}

export function TableDefinitionView({ tables, onTablesUpdate }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTables, setFilteredTables] = useState<TableDefinition[]>([]);
  const [editableTables, setEditableTables] = useState<TableDefinition[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiButtonTooltipOpen, setAiButtonTooltipOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Initialize editable tables when component mounts or tables prop changes
  useEffect(() => {
    if (tables && tables.length > 0) {
      setEditableTables(JSON.parse(JSON.stringify(tables)));

      // Auto-expand the first table if none is expanded
      if (Object.keys(expandedTables).length === 0 && !selectedTable) {
        setExpandedTables({ [tables[0].tableIdentifier]: true });
        setSelectedTable(tables[0].tableIdentifier);
      }
    }
  }, [tables, expandedTables, selectedTable]);

  // Filter tables based on search query
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredTables(editableTables);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = editableTables.filter(
      (table) =>
        table.tableIdentifier.toLowerCase().includes(query) ||
        table.columns.some(
          (col) =>
            col.columnIdentifier.toLowerCase().includes(query) ||
            (col.columnDescription && col.columnDescription.toLowerCase().includes(query)) ||
            col.columnType.toLowerCase().includes(query)
        )
    );
    setFilteredTables(filtered);
  }, [debouncedSearchQuery, editableTables]);

  // Toggle table expansion and selection
  const toggleTable = useCallback((tableId: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
    setSelectedTable(tableId);
  }, []);

  // Start editing a column
  const startEditing = useCallback((tableId: string, columnId: string) => {
    setEditingTableId(tableId);
    setEditingColumnId(columnId);
  }, []);

  // Cancel editing for a specific column
  const cancelEditing = useCallback(() => {
    setEditingTableId(null);
    setEditingColumnId(null);

    // Reset the editable tables to their original state
    setEditableTables(JSON.parse(JSON.stringify(tables)));
  }, [tables]);

  // Save changes for a specific column
  const saveColumnChanges = useCallback((
    tableId: string,
    columnId: string,
    updatedColumn: ColumnDefinition
  ) => {
    // Update the tables state
    const updatedTables = editableTables.map(table => {
      if (table.tableIdentifier === tableId) {
        return {
          ...table,
          columns: table.columns.map(column =>
            column.columnIdentifier === columnId ? updatedColumn : column
          )
        };
      }
      return table;
    });

    // Update the editable tables state
    setEditableTables(updatedTables);

    // Call the onTablesUpdate callback if provided
    if (onTablesUpdate) {
      onTablesUpdate(updatedTables);
    }

    // Clear editing state
    setEditingTableId(null);
    setEditingColumnId(null);

    // Show success notification
    enqueueSnackbar('Column updated successfully!', {
      variant: 'success',
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      }
    });
  }, [editableTables, onTablesUpdate]);

  // Handle column changes
  const handleColumnChange = useCallback((
    tableId: string,
    columnId: string,
    field: keyof ColumnDefinition,
    value: any
  ) => {
    setEditableTables(prevTables =>
      prevTables.map(table => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map(column =>
              column.columnIdentifier === columnId
                ? { ...column, [field]: value }
                : column
            )
          };
        }
        return table;
      })
    );
  }, []);

  // Get column count for a table
  const getColumnCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.length || 0;
  }, [editableTables]);

  // Get primary key count for a table
  const getPrimaryKeyCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.filter(c => c.isPrimaryKey).length || 0;
  }, [editableTables]);

  // Get relation count for a table
  const getRelationCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.reduce((count, column) =>
      count + (column.relations ? column.relations.length : 0), 0) || 0;
  }, [editableTables]);

  // Get relation type display
  const getRelationTypeDisplay = useCallback((relationType: string): string => {
    switch (relationType) {
      case 'OTM': return '1:n';
      case 'MTO': return 'n:1';
      case 'OTO': return '1:1';
      case 'MTM': return 'n:n';
      default: return relationType;
    }
  }, []);

  // Get relation name
  const getRelationshipName = useCallback((key: string): string => {
    if (key === 'OTM') return 'One-to-Many';
    if (key === 'MTO') return 'Many-to-One';
    if (key === 'OTO') return 'One-to-One';
    return 'Many-to-Many';
  }, []);

  // Animation variants for tables
  const tableVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  // Generate AI description for a column
  // const generateAIDescription = async (column: ColumnDefinition, table: TableDefinition): Promise<string> => {
  //   // Simulate API call delay
  //   await new Promise(resolve => setTimeout(resolve, 800));

  //   // Generate more context-aware descriptions based on column type and name
  //   let baseDescription = '';

  //   // Check if column is a foreign key (has relations)
  //   const isForeignKey = column.relations && column.relations.length > 0;

  //   // Check common column name patterns
  //   const colName = column.columnIdentifier.toLowerCase();

  //   if (column.isPrimaryKey) {
  //     baseDescription = `Unique identifier for each record in the ${table.tableIdentifier} table`;
  //   } else if (isForeignKey) {
  //     const relations = column.relations || [];
  //     const targetTables = relations.map(r => r.tableIdentifier).join(', ');
  //     baseDescription = `Foreign key referencing ${targetTables} ${relations.length > 1 ? 'tables' : 'table'}`;
  //   } else if (colName.includes('id') && colName.endsWith('id')) {
  //     baseDescription = `Reference to ${colName.replace('_id', '').replace('id', '')} record`;
  //   } else if (colName.includes('name')) {
  //     baseDescription = `Name or title of the ${table.tableIdentifier} record`;
  //   } else if (colName.includes('date') || colName.includes('time')) {
  //     baseDescription = `Timestamp indicating when the ${colName.includes('created') ? 'record was created' :
  //       colName.includes('updated') ? 'record was last modified' :
  //         colName.includes('deleted') ? 'record was removed' :
  //           'event occurred'}`;
  //   } else if (colName.includes('price') || colName.includes('cost') || colName.includes('amount')) {
  //     baseDescription = `Monetary value representing the ${colName.replace('_', ' ')}`;
  //   } else if (colName.includes('status')) {
  //     baseDescription = `Current state of the ${table.tableIdentifier} record`;
  //   } else if (colName.includes('description')) {
  //     baseDescription = `Detailed description of the ${table.tableIdentifier} record`;
  //   } else if (column.columnType.toLowerCase().includes('bool')) {
  //     baseDescription = `Flag indicating whether the ${table.tableIdentifier} ${colName.replace('is_', '').replace('has_', '')}`;
  //   } else {
  //     baseDescription = `Stores ${column.columnType} data for ${table.tableIdentifier} records`;
  //   }

  //   return baseDescription;
  // };

  // Fill all column descriptions with AI
  const fillAllDescriptionsWithAI = async () => {
    try {
      setAiLoading(true);
      setAiButtonTooltipOpen(false);

      const updatedTables = [...editableTables];
      const generatedCount = 0;

      // for (const table of updatedTables) {
      //   for (const column of table.columns) {
      //     // Skip if description already exists
      //     // if (column.columnDescription) continue;

      //     // Generate AI description
      //     // const aiDescription = await generateAIDescription(column, table);

      //     // Update column description
      //     column.columnDescription = aiDescription;
      //     generatedCount += 1;
      //   }
      // }

      // Update state with new descriptions
      setEditableTables(updatedTables);

      // Show different messages based on how many descriptions were generated
      if (generatedCount > 0) {
      //   enqueueSnackbar(`Successfully generated ${generatedCount} column descriptions!`, {
      //     variant: 'success',
      //     anchorOrigin: {
      //       vertical: 'bottom',
      //       horizontal: 'center',
      //     }
      //   });

        // Notify the parent component of the changes
        if (onTablesUpdate) {
          onTablesUpdate(updatedTables);
        }
      } else {
        enqueueSnackbar('All columns already have descriptions', {
          variant: 'info',
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'center',
          }
        });
      }
    } catch (error) {
      enqueueSnackbar('Failed to generate AI descriptions', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        }
      });
      console.error('AI description generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Get the current editing column
  const getEditingColumn = useCallback(() => {
    if (!editingTableId || !editingColumnId) return null;

    const table = editableTables.find(t => t.tableIdentifier === editingTableId);
    if (!table) return null;

    return table.columns.find(c => c.columnIdentifier === editingColumnId) || null;
  }, [editingTableId, editingColumnId, editableTables]);

  // Render a column row
  const renderColumnRow = useCallback((table: TableDefinition, column: ColumnDefinition) => {
    const isEditing =
      editingTableId === table.tableIdentifier && editingColumnId === column.columnIdentifier;
  
    // Get the current editing column to save
    const currentEditingColumn = isEditing ? getEditingColumn() : null;
  
    // Handle Enter key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (currentEditingColumn) {
          saveColumnChanges(
            table.tableIdentifier,
            column.columnIdentifier,
            currentEditingColumn
          );
        }
      }
    };
  
    return (
      <MotionTableRow
        key={column.columnIdentifier}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        onDoubleClick={() => !isEditing && startEditing(table.tableIdentifier, column.columnIdentifier)}
        sx={{
          position: 'relative', // Essential for absolute positioned children
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (t) => alpha(t.palette.primary.main, 0.05),
            '& .MuiTableCell-root': {
              color: 'primary.main'
            }
          },
          '& .MuiTableCell-root': {
            py: 1.5, // Increased vertical padding to accommodate the buttons
            px: { xs: 1, sm: 1.5 },
            ...(isEditing && {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            }),
          },
          transition: 'all 0.15s ease-in-out',
        }}
      >
        {/* Column Name Cell */}
        <TableCell className="column-name" sx={{ pl: { xs: 1, sm: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isEditing ? (
              <TextField
                size="small"
                value={column.columnIdentifier}
                onChange={(e) =>
                  handleColumnChange(
                    table.tableIdentifier,
                    column.columnIdentifier,
                    'columnIdentifier',
                    e.target.value
                  )
                }
                onKeyPress={handleKeyPress}
                fullWidth
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                aria-label="Edit column name"
              />
            ) : (
              <Typography variant="body2" fontWeight={column.isPrimaryKey ? 'medium' : 'normal'}>
                {column.isPrimaryKey && <StyledPrimaryKeyIcon />}
                {column.columnIdentifier}
              </Typography>
            )}
          </Stack>
        </TableCell>
  
        {/* Column Type Cell */}
        <TableCell className="column-type">
          {isEditing ? (
            <TextField
              size="small"
              value={column.columnType}
              onChange={(e) =>
                handleColumnChange(
                  table.tableIdentifier,
                  column.columnIdentifier,
                  'columnType',
                  e.target.value
                )
              }
              onKeyPress={handleKeyPress}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              aria-label="Edit column type"
            />
          ) : (
            <StyledColumnTypeChip label={column.columnType} size="small" />
          )}
        </TableCell>
  
        {/* Description Cell */}
        <TableCell className="column-description">
          {isEditing ? (
            <DescriptionTextField
              size="small"
              value={column.columnDescription || ''}
              onChange={(e) =>
                handleColumnChange(
                  table.tableIdentifier,
                  column.columnIdentifier,
                  'columnDescription',
                  e.target.value
                )
              }
              onKeyPress={handleKeyPress}
              fullWidth
              multiline
              rows={2}
              placeholder="Enter column description..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              aria-label="Edit column description"
            />
          ) : (
            <Typography
              variant="body2"
              color={column.columnDescription ? 'text.primary' : 'text.secondary'}
              sx={{
                fontStyle: column.columnDescription ? 'normal' : 'italic',
                wordBreak: 'break-word',
              }}
            >
              {column.columnDescription || 'No description provided'}
            </Typography>
          )}
        </TableCell>
  
        {/* Relations Cell with Relationship Type Editor */}
        <TableCell className="column-relations">
          <RelationsContainer>
            {column.relations?.length ? (
              column.relations.map((relation, relationIndex) => (
                <Box key={`${relation.tableIdentifier}-${relation.toColumn}`} sx={{ mb: 1 }}>
                  {isEditing ? (
                    <Stack direction="column" spacing={1} alignItems="center">
                      <RelationTypeSelector
                        value={relation.type as RelationType}
                        onChange={(newType) => {
                          // Create a deep copy of relations
                          const updatedRelations = [...(column.relations || [])];
                          updatedRelations[relationIndex] = {
                            ...updatedRelations[relationIndex],
                            type: newType
                          };
  
                          handleColumnChange(
                            table.tableIdentifier,
                            column.columnIdentifier,
                            'relations',
                            updatedRelations
                          );
                        }}
                        disabled={false}
                      />
                      <Typography variant="caption">
                        {relation.tableIdentifier}.{relation.toColumn}
                      </Typography>
                    </Stack>
                  ) : (
                    <Tooltip
                      title={`${getRelationTypeDisplay(relation.type)} → ${relation.tableIdentifier}.${relation.toColumn} (${getRelationshipName(relation.type)})`}
                      arrow
                    >
                      <span>
                        <StyledRelationChip
                          size="small"
                          icon={<StyledRelationIcon />}
                          label={`${getRelationTypeDisplay(relation.type)} → ${relation.tableIdentifier}`}
                        />
                      </span>
                    </Tooltip>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No relations
              </Typography>
            )}
          </RelationsContainer>
        </TableCell>
        
        {/* Add the save/cancel buttons when editing */}
        {isEditing && (
          <EditActionsContainer>
            <Tooltip title="Save changes">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  if (currentEditingColumn) {
                    saveColumnChanges(
                      table.tableIdentifier,
                      column.columnIdentifier,
                      currentEditingColumn
                    );
                  }
                }}
                sx={{
                  bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.success.main, 0.2),
                  },
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Discard changes">
              <IconButton
                size="small"
                color="error"
                onClick={cancelEditing}
                sx={{
                  bgcolor: (t) => alpha(t.palette.error.main, 0.1),
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.error.main, 0.2),
                  },
                }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </EditActionsContainer>
        )}
      </MotionTableRow>
    );
  }, [
    theme,
    startEditing,
    editingTableId,
    editingColumnId,
    getEditingColumn,
    handleColumnChange,
    saveColumnChanges,
    cancelEditing,
    getRelationTypeDisplay,
    getRelationshipName
  ]);

  // Initialize filtered tables
  useEffect(() => {
    setFilteredTables(editableTables);
  }, [editableTables]);

  // Adjust grid layout based on screen size
  const gridSizes = useMemo(() => ({
    tableList: { xs: 12, sm: 12, md: 5.5, lg: 4.5 },  // Slightly wider table list
    diagram: { xs: 12, sm: 12, md: 6.5, lg: 7.5 },    // Slightly narrower diagram
  }), []);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Grid container spacing={3} sx={{ overflow: 'hidden' }}>
        {/* Table List Column */}
        <Grid item {...gridSizes.tableList}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 700, // Fixed height for the container
          }}>
            {/* Search Box and AI Button Row */}
            <Box sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}>
              <Box sx={{ flexGrow: 1, position: 'relative' }}>
                <StyledSearchInput
                  placeholder="Search tables or columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={<Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                  fullWidth
                  aria-label="Search tables or columns"
                />
              </Box>

              {/* AI Button - Now next to search box */}
              <Tooltip
                title={aiLoading ? "Generating descriptions..." : "Auto-generate descriptions for all columns"}
                arrow
                open={aiButtonTooltipOpen}
                onOpen={() => setAiButtonTooltipOpen(true)}
                onClose={() => setAiButtonTooltipOpen(false)}
              >
                <AIButtonWrapper isAnimating={aiLoading}>
                  <AIFillButton
                    onClick={fillAllDescriptionsWithAI}
                    onMouseEnter={() => setAiButtonTooltipOpen(true)}
                    onMouseLeave={() => setAiButtonTooltipOpen(false)}
                    disabled={aiLoading || !editableTables.length}
                    startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
                    aria-label="Auto-generate descriptions"
                    sx={{
                      boxShadow: aiLoading ?
                        `0 0 12px ${alpha(theme.palette.primary.main, 0.4)}` :
                        undefined,
                    }}
                  >
                    {isMobile ? "Auto-fill" : "Auto-fill Descriptions"}
                  </AIFillButton>
                </AIButtonWrapper>
              </Tooltip>
            </Box>

            {/* Scrollable Table List */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                pr: 1,
                height: 'calc(700px - 60px)', // Fixed height minus search bar
              }}
            >
              <AnimatePresence>
                {filteredTables.length === 0 ? (
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <EmptyStateMessage>
                      <Iconify
                        icon="eva:search-outline"
                        sx={{
                          width: 40,
                          height: 40,
                          color: 'text.secondary',
                          opacity: 0.5,
                          mb: 1
                        }}
                      />
                      <Typography variant="subtitle1" color="text.secondary">
                        No tables found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try adjusting your search query
                      </Typography>
                    </EmptyStateMessage>
                  </m.div>
                ) : (
                  <Stack spacing={2}>
                    {filteredTables.map((table, index) => (
                      <m.div
                        key={table.tableIdentifier}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={tableVariants}
                        layout
                      >
                        <StyledCard selected={selectedTable === table.tableIdentifier}>
                          <CardHeader
                            title={
                              <Box>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleTable(table.tableIdentifier)}
                                      sx={{
                                        transition: 'transform 0.3s ease',
                                        transform: expandedTables[table.tableIdentifier]
                                          ? 'rotate(-180deg)'
                                          : 'rotate(0deg)',
                                        color: 'primary.main',
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                        '&:hover': {
                                          bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
                                        }
                                      }}
                                      aria-label={`Toggle table ${table.tableIdentifier}`}
                                    >
                                      <Iconify icon="eva:arrow-ios-downward-fill" />
                                    </IconButton>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: selectedTable === table.tableIdentifier
                                          ? 'bold'
                                          : 'medium',
                                        color: selectedTable === table.tableIdentifier
                                          ? 'primary.main'
                                          : 'text.primary',
                                      }}
                                    >
                                      {table.tableIdentifier}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={4}>
                                    <StyledBadge
                                      badgeContent={getPrimaryKeyCount(table.tableIdentifier)}
                                      color="warning"
                                      showZero
                                      aria-label={`Primary keys: ${getPrimaryKeyCount(table.tableIdentifier)}`}
                                    >
                                      <Tooltip title="Primary keys">
                                        <KeyIcon
                                          fontSize="small"
                                          sx={{
                                            color: 'warning.main',
                                            opacity: getPrimaryKeyCount(table.tableIdentifier) > 0 ? 1 : 0.4
                                          }}
                                        />
                                      </Tooltip>
                                    </StyledBadge>
                                    <StyledBadge
                                      badgeContent={getRelationCount(table.tableIdentifier)}
                                      color="info"
                                      showZero
                                      aria-label={`Relations: ${getRelationCount(table.tableIdentifier)}`}
                                    >
                                      <Tooltip title="Relations">
                                        <LinkIcon
                                          fontSize="small"
                                          sx={{
                                            color: 'info.main',
                                            opacity: getRelationCount(table.tableIdentifier) > 0 ? 1 : 0.4
                                          }}
                                        />
                                      </Tooltip>
                                    </StyledBadge>
                                    <Chip
                                      label={getColumnCount(table.tableIdentifier)}
                                      size="small"
                                      color={selectedTable === table.tableIdentifier ? 'primary' : 'default'}
                                      sx={{
                                        height: 20,
                                        '& .MuiChip-label': {
                                          px: 1,
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                      aria-label={`Columns: ${getColumnCount(table.tableIdentifier)}`}
                                    />
                                  </Stack>
                                </Stack>
                                {/* Additional information row */}
                                {!expandedTables[table.tableIdentifier] && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      ml: 4,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {getColumnCount(table.tableIdentifier)} columns,{' '}
                                    {getPrimaryKeyCount(table.tableIdentifier)} keys,{' '}
                                    {getRelationCount(table.tableIdentifier)} relations
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{
                              p: 2,
                              pb: expandedTables[table.tableIdentifier] ? 1 : 2,
                              '& .MuiCardHeader-action': { alignSelf: 'center' },
                              ...(expandedTables[table.tableIdentifier] && {
                                borderBottom: (t) => `1px dashed ${t.palette.divider}`,
                              }),
                              background: (t) => {
                                if (selectedTable === table.tableIdentifier) {
                                  if (t.palette.mode === 'dark') {
                                    return alpha(t.palette.primary.dark, 0.1);
                                  }
                                  return alpha(t.palette.primary.lighter, 0.2);
                                }
                                return 'transparent';
                              }
                            }}
                          />
                          <Collapse in={expandedTables[table.tableIdentifier]}>
                            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                              <StyledTableContainer>
                                <Table size="small" aria-label={`${table.tableIdentifier} columns`}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell scope="col" className="column-name">Column</TableCell>
                                      <TableCell scope="col" className="column-type">Type</TableCell>
                                      <TableCell scope="col" className="column-description">Description</TableCell>
                                      <TableCell scope="col" className="column-relations">Relations</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <AnimatePresence>
                                      {table.columns.map((column) => renderColumnRow(table, column))}
                                    </AnimatePresence>
                                  </TableBody>
                                </Table>
                              </StyledTableContainer>
                            </Box>
                          </Collapse>
                        </StyledCard>
                      </m.div>
                    ))}
                  </Stack>
                )}
              </AnimatePresence>
            </Box>
          </Box>
        </Grid>

        {/* Diagram Preview Column - NO SCROLL HERE */}
        <Grid item {...gridSizes.diagram}>
          <Paper
            elevation={3}
            sx={{
              height: 700, // Fixed height to match table list
              overflow: 'hidden', // Prevent any scrolling
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              position: 'relative',
              background: (t) =>
                t.palette.mode === 'dark'
                  ? alpha(t.palette.background.paper, 0.8)
                  : t.palette.background.paper,
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify
                  icon="eva:diagram-fill"
                  width={24}
                  height={24}
                  sx={{ color: 'primary.main' }}
                />
                <Typography variant="h6">Schema Diagram</Typography>
              </Stack>
              {selectedTable && (
                <Chip
                  label={selectedTable}
                  color="primary"
                  size="small"
                  onDelete={() => setSelectedTable(null)}
                  sx={{ height: 24 }}
                  aria-label={`Selected table: ${selectedTable}`}
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                flexGrow: 1,
                position: 'relative',
                borderRadius: 1.5,
                border: (t) => `1px solid ${t.palette.divider}`,
                height: 'calc(700px - 100px)', // Fixed height minus header and padding
                overflow: 'hidden'
              }}
            >
              {filteredTables.length > 0 ? (
                <Box sx={{
                  width: '92%',
                  height: '92%',
                  margin: 'auto',
                  position: 'relative',
                  top: '4%'
                }}>
                  <SchemaVisualization
                    tables={editableTables}
                    selectedTable={selectedTable}
                    onTableClick={(tableId: string) => {
                      toggleTable(tableId);
                    }}
                  />
                </Box>
              ) : (
                <EmptyStateMessage>
                  <Iconify
                    icon="eva:layers-outline"
                    sx={{
                      width: 48,
                      height: 48,
                      color: 'text.secondary',
                      opacity: 0.5,
                      mb: 2
                    }}
                  />
                  <Typography variant="subtitle1" color="text.secondary">
                    No schema to visualize
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Tables will appear here when available
                  </Typography>
                </EmptyStateMessage>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}