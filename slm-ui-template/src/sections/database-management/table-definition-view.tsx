import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CancelIcon from '@mui/icons-material/Close';
import TableContainer from '@mui/material/TableContainer';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import { TableDefinition, ColumnDefinition } from 'src/types/database';

import { SchemaVisualization } from './schema-visualization';

// ----------------------------------------------------------------------

type Props = {
  tables: TableDefinition[];
  onTablesUpdate?: (updatedTables: TableDefinition[]) => void;
};

export function TableDefinitionView({ tables, onTablesUpdate }: Props) {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  // Deep copy tables for editing
  const [editableTables, setEditableTables] = useState<TableDefinition[]>([]);

  useEffect(() => {
    setEditableTables(JSON.parse(JSON.stringify(tables)));
  }, [tables]);

  const toggleTable = (tableId: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableId]: !prev[tableId],
    }));
    setSelectedTable(tableId);
  };

  const startEditing = (tableId: string, columnId: string) => {
    setEditingTableId(tableId);
    setEditingColumnId(columnId);
  };

  const cancelEditing = () => {
    setEditingTableId(null);
    setEditingColumnId(null);
    // Revert to original data
    setEditableTables(JSON.parse(JSON.stringify(tables)));
  };

  const saveChanges = () => {
    if (onTablesUpdate) {
      onTablesUpdate(editableTables);
    }
    setEditingTableId(null);
    setEditingColumnId(null);
  };

  const handleColumnChange = (
    tableId: string,
    columnId: string,
    field: keyof ColumnDefinition,
    value: any
  ) => {
    setEditableTables((prevTables) =>
      prevTables.map((table) => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map((column) => {
              if (column.columnIdentifier === columnId) {
                return { ...column, [field]: value };
              }
              return column;
            }),
          };
        }
        return table;
      })
    );
  };

  const renderColumnRow = (table: TableDefinition, column: ColumnDefinition) => {
    const isEditing =
      editingTableId === table.tableIdentifier && editingColumnId === column.columnIdentifier;

    return (
      <TableRow key={column.columnIdentifier}>
        <TableCell sx={{ pl: 4 }}>
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
                fullWidth
              />
            ) : (
              <Typography variant="body2">{column.columnIdentifier}</Typography>
            )}
            {column.isPrimaryKey && (
              <Iconify
                icon="mdi:key-variant"
                sx={{ color: 'warning.main', width: 16, height: 16 }}
              />
            )}
          </Stack>
        </TableCell>
        <TableCell>
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
              fullWidth
            />
          ) : (
            column.columnType
          )}
        </TableCell>
        <TableCell sx={{ maxWidth: 200, overflowWrap: 'break-word' }}>
          {isEditing ? (
            <TextField
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
              fullWidth
              multiline
            />
          ) : (
            column.columnDescription || '-'
          )}
        </TableCell>
        <TableCell sx={{ maxWidth: 200, overflowWrap: 'break-word' }}>
          {column.relations?.map((relation) => (
            <Typography
              key={`${relation.tableIdentifier}-${relation.toColumn}`}
              variant="caption"
              display="block"
            >
              {`${relation.type} → ${relation.tableIdentifier}.${relation.toColumn}`}
            </Typography>
          ))}
        </TableCell>
        <TableCell align="right">
          {isEditing ? (
            <Stack direction="row" spacing={1}>
              <IconButton size="small" color="primary" onClick={saveChanges}>
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={cancelEditing}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <IconButton
              size="small"
              onClick={() => startEditing(table.tableIdentifier, column.columnIdentifier)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Grid container spacing={2}>
      {/* Table List */}
      <Grid item xs={12} md={4}>
        <Scrollbar>
          <Stack spacing={3}>
            {editableTables.map((table) => (
              <Card
                key={table.tableIdentifier}
                sx={{
                  ...(selectedTable === table.tableIdentifier && {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                    borderStyle: 'solid',
                  }),
                }}
              >
                <CardHeader
                  title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => toggleTable(table.tableIdentifier)}
                        sx={{
                          transform: expandedTables[table.tableIdentifier]
                            ? 'rotate(-180deg)'
                            : 'none',
                        }}
                      >
                        <Iconify icon="eva:arrow-ios-downward-fill" />
                      </IconButton>
                      <Typography variant="subtitle1">{table.tableIdentifier}</Typography>
                    </Stack>
                  }
                />

                <Collapse in={expandedTables[table.tableIdentifier]}>
                  <Box sx={{ p: 2 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Column</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Relations</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {table.columns.map((column) => renderColumnRow(table, column))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Collapse>
              </Card>
            ))}
          </Stack>
        </Scrollbar>
      </Grid>

      {/* Diagram Preview */}
      <Grid item xs={12} md={8}>
        <Paper
          elevation={3}
          sx={{
            height: '100%',
            p: 2,
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Schema Diagram
          </Typography>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <SchemaVisualization tables={editableTables} selectedTable={selectedTable} />
          </Box>
        </Paper>
      </Grid>

      {/* Save Button for All Changes */}
      {editingTableId && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveChanges}
              >
                Save All Changes
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </Stack>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}
