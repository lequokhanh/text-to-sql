import 'reactflow/dist/style.css';
import { useMemo, useEffect, useCallback } from 'react';
import ReactFlow, {
  Edge,
  Node,
  Handle,
  MiniMap,
  Controls,
  Position,
  NodeProps,
  NodeTypes,
  Background,
  MarkerType,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
} from 'reactflow';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { TableDefinition } from 'src/types/database';

// Define relationship symbols
const RELATION_SYMBOLS = {
  OTM: '1:n', // One-to-Many
  MTO: 'n:1', // Many-to-One
  OTO: '1:1', // One-to-One
  MTM: 'n:n', // Many-to-Many
};

// Define types for the custom node data
interface TableNodeData {
  tableName: string;
  columns: TableDefinition['columns'];
  isSelected: boolean;
}

// Custom node component for tables
const TableNode = ({ data }: NodeProps<TableNodeData>) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { isSelected } = data;

  // Define color schemes based on theme and selection state
  let headerColor;
  let bodyColor;
  let borderColor: string;

  if (isSelected) {
    headerColor = theme.palette.primary.main;
    bodyColor = isDarkMode
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.primary.main, 0.1);
    borderColor = theme.palette.primary.light;
  } else {
    headerColor = isDarkMode ? theme.palette.grey[800] : '#2D3748';
    bodyColor = isDarkMode ? theme.palette.background.paper : theme.palette.common.white;
    borderColor = isDarkMode ? theme.palette.divider : '#E2E8F0';
  }

  const columnColors = {
    primaryKey: isDarkMode ? theme.palette.warning.main : '#F6AD55',
    text: isDarkMode ? theme.palette.text.primary : '#4A5568',
    type: isDarkMode ? theme.palette.text.secondary : '#718096',
    hover: isDarkMode ? alpha(theme.palette.action.hover, 0.1) : '#F7FAFC',
  };

  return (
    <Paper
      elevation={isSelected ? 4 : 1}
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        width: 220,
        boxShadow: isSelected ? theme.shadows[4] : theme.shadows[1],
        '&:hover': {
          boxShadow: isSelected ? theme.shadows[6] : theme.shadows[2],
        },
        position: 'relative',
      }}
    >
      {data.columns.map(
        (column, index) =>
          column.relations &&
          column.relations.length > 0 && (
            <Handle
              key={`source-${column.columnIdentifier}`}
              type="source"
              position={Position.Right}
              id={`right-${column.columnIdentifier}`}
              style={{
                top: `${50 + index * 30}px`, // Position handle at the column level
                right: 0,
                width: 0,
                height: 0,
                opacity: 0,
              }}
            />
          )
      )}

      {/* Multiple target handles for different columns */}
      {data.columns.map(
        (column, index) =>
          column.isPrimaryKey && (
            <Handle
              key={`target-${column.columnIdentifier}`}
              type="target"
              position={Position.Left}
              id={`left-${column.columnIdentifier}`}
              style={{
                top: `${50 + index * 30}px`, // Position handle at the column level
                left: 0,
                width: 0,
                height: 0,
                opacity: 0,
              }}
            />
          )
      )}
      {/* Table Header */}
      <Box
        sx={{
          bgcolor: headerColor,
          color: theme.palette.common.white,
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {data.tableName}
        </Typography>
        <Box
          sx={{
            bgcolor: alpha(theme.palette.common.white, 0.2),
            borderRadius: '12px',
            px: 0.75,
            py: 0.25,
            fontSize: '0.625rem',
          }}
        >
          {data.columns.length}
        </Box>
      </Box>

      {/* Table Columns */}
      <Box
        sx={{
          bgcolor: bodyColor,
          border: `1px solid ${borderColor}`,
          borderTop: 'none',
        }}
      >
        {data.columns.map((column, index) => (
          <Box
            key={column.columnIdentifier}
            sx={{
              px: 1.5,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              borderBottom: index < data.columns.length - 1 ? `1px solid ${borderColor}` : 'none',
              '&:hover': {
                bgcolor: columnColors.hover,
              },
              position: 'relative',
            }}
          >
            {column.isPrimaryKey && (
              <Typography
                component="span"
                sx={{
                  color: columnColors.primaryKey,
                  mr: 0.5,
                  fontSize: '0.625rem',
                }}
              >
                🔑
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{
                color: columnColors.text,
                fontWeight: column.isPrimaryKey ? 'bold' : 'normal',
              }}
            >
              {column.columnIdentifier}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: columnColors.type,
                ml: 'auto',
                fontSize: '0.6875rem',
                opacity: 0.7,
              }}
            >
              {column.columnType}
            </Typography>
            {column.relations && column.relations.length > 0 && (
              <Typography
                component="span"
                sx={{
                  ml: 0.5,
                  fontSize: '0.625rem',
                }}
              >
                🔗
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// Define the custom node types
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

// Inner component props
interface SchemaVisualizationInnerProps {
  tables: TableDefinition[];
  selectedTable: string | null;
  onTableClick?: (tableId: string) => void;
}

// Inner component that uses ReactFlow hooks
function SchemaVisualizationInner({
  tables,
  selectedTable,
  onTableClick,
}: SchemaVisualizationInnerProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Create ReactFlow nodes from tables
  const initialNodes = useMemo(
    () =>
      tables.map((table, index) => {
        const isSelected = selectedTable === table.tableIdentifier;

        // Position tables in a grid layout
        const columns = Math.ceil(Math.sqrt(tables.length));
        const col = index % columns;
        const row = Math.floor(index / columns);

        return {
          id: table.tableIdentifier,
          type: 'tableNode',
          position: { x: col * 300, y: row * 250 },
          data: {
            tableName: table.tableIdentifier,
            columns: table.columns,
            isSelected,
          },
          // Default settings for better compatibility
          draggable: true,
          selectable: true,
        };
      }),
    [tables, selectedTable]
  );

  // Create edges from relationships - with a simplified approach
  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];

    tables.forEach((sourceTable) => {
      const hasRelations = sourceTable.columns.some(
        (col) => col.relations && col.relations.length > 0
      );

      if (!hasRelations) return;

      sourceTable.columns.forEach((column) => {
        if (column.relations?.length) {
          column.relations.forEach((relation) => {
            // Check if target table exists
            const targetTable = tables.find((t) => t.tableIdentifier === relation.tableIdentifier);
            if (!targetTable) return;

            // Find target column (primary key)
            const targetColumnIndex = targetTable.columns.findIndex((col) => col.isPrimaryKey);
            if (targetColumnIndex === -1) return;

            const isHighlighted =
              selectedTable === sourceTable.tableIdentifier ||
              selectedTable === relation.tableIdentifier;

            // Determine edge color
            let edgeColor;
            if (isHighlighted) {
              edgeColor = theme.palette.primary.main;
            } else if (isDarkMode) {
              edgeColor = theme.palette.grey[500];
            } else {
              edgeColor = '#A0AEC0';
            }

            // Create a unique edge ID
            const edgeId = `edge-${sourceTable.tableIdentifier}-${relation.tableIdentifier}-${column.columnIdentifier}`;

            // Add edge with orthogonal routing
            edges.push({
              id: edgeId,
              source: sourceTable.tableIdentifier,
              target: relation.tableIdentifier,
              sourceHandle: `right-${column.columnIdentifier}`,
              targetHandle: `left-${targetTable.columns[targetColumnIndex].columnIdentifier}`,
              type: 'smoothstep', // Custom edge type
              animated: isHighlighted,
              label: RELATION_SYMBOLS[relation.type] || '',
              style: {
                stroke: edgeColor,
                strokeWidth: isHighlighted ? 2 : 1.5,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: 15,
                height: 15,
              },
              data: {
                isHighlighted,
                type: relation.type === 'OTM' ? 'required' : 'optional',
              },
            });
          });
        }
      });
    });

    return edges;
  }, [tables, selectedTable, theme, isDarkMode]);

  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when tables or selected table changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onTableClick) {
        onTableClick(node.id);
      }
    },
    [onTableClick]
  );

  // Node color function for MiniMap
  const getNodeColor = useCallback(
    (node: Node) => {
      const isNodeSelected = (node.data as TableNodeData)?.isSelected;
      if (isNodeSelected) {
        return theme.palette.primary.main;
      }
      return isDarkMode ? theme.palette.grey[700] : '#E2E8F0';
    },
    [theme, isDarkMode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
      attributionPosition="bottom-right"
      proOptions={{ hideAttribution: true }}
    >
      <Background
        color={isDarkMode ? theme.palette.grey[800] : theme.palette.grey[200]}
        gap={16}
        size={1}
      />
      <Controls
        position="bottom-right"
        style={{
          backgroundColor: isDarkMode ? theme.palette.grey[900] : theme.palette.common.white,
          borderColor: isDarkMode ? theme.palette.divider : theme.palette.grey[300],
        }}
      />
      <MiniMap
        style={{
          backgroundColor: isDarkMode ? theme.palette.grey[900] : theme.palette.common.white,
          border: `1px solid ${isDarkMode ? theme.palette.divider : theme.palette.grey[300]}`,
        }}
        nodeColor={getNodeColor}
        nodeBorderRadius={2}
      />
    </ReactFlow>
  );
}

// Main component props
interface SchemaVisualizationProps {
  tables: TableDefinition[];
  selectedTable: string | null;
  width?: number | string;
  height?: number | string;
  onTableClick?: (tableId: string) => void;
  // expandedTables?: Record<string, boolean>; // Kept for backward compatibility
}

// Main component that wraps the inner component with ReactFlowProvider
export function SchemaVisualization({
  tables,
  selectedTable,
  width = '100%',
  height = '100%',
  onTableClick,
}: SchemaVisualizationProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        width,
        height,
        minHeight: 400,
        borderRadius: 1,
        border: `1px solid ${isDarkMode ? theme.palette.divider : '#E2E8F0'}`,
        bgcolor: isDarkMode ? theme.palette.background.default : '#F7FAFC',
        overflow: 'hidden',
      }}
    >
      <ReactFlowProvider>
        <SchemaVisualizationInner
          tables={tables}
          selectedTable={selectedTable}
          onTableClick={onTableClick}
        />
      </ReactFlowProvider>
    </Box>
  );
}
