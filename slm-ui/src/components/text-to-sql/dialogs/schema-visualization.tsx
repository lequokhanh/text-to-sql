import 'reactflow/dist/style.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Edge,
  Node,
  Panel,
  Handle,
  MiniMap,
  Controls,
  Position,
  NodeProps,
  NodeTypes,
  Background,
  MarkerType,
  useReactFlow,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
} from 'reactflow';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Menu from '@mui/material/Menu';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import KeyIcon from '@mui/icons-material/Key';
import LinkIcon from '@mui/icons-material/Link';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import LayersIcon from '@mui/icons-material/Layers';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { alpha, useTheme } from '@mui/material/styles';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import { TableDefinition } from 'src/types/database';

// Define relationship symbols
const RELATION_SYMBOLS = {
  OTM: '1:n', // One-to-Many
  MTO: 'n:1', // Many-to-One
  OTO: '1:1', // One-to-One
};

// Define relationship colors
const RELATION_COLORS = {
  OTM: '#3498db', // One-to-Many - Blue
  MTO: '#2ecc71', // Many-to-One - Green
  OTO: '#9b59b6', // One-to-One - Purple
};

// Define types for the custom node data
interface TableNodeData {
  tableName: string;
  columns: TableDefinition['columns'];
  isSelected: boolean;
}

interface ControlPanelProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  showRelationLabels: boolean;
  onToggleRelationLabels: () => void;
}

// Control panel component
const ControlPanel = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleFullscreen,
  isFullscreen,
  showMinimap,
  onToggleMinimap,
  showRelationLabels,
  onToggleRelationLabels,
}: ControlPanelProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Panel position="top-right">
      <Stack spacing={2} direction="column" alignItems="flex-end">
        <ButtonGroup
          orientation="vertical"
          variant="outlined"
          sx={{
            backgroundColor: isDarkMode ? alpha(theme.palette.grey[900], 0.8) : alpha(theme.palette.background.paper, 0.9),
            borderRadius: 1.5,
            boxShadow: theme.shadows[3],
            border: `1px solid ${isDarkMode ? theme.palette.grey[800] : theme.palette.grey[300]}`,
            overflow: 'hidden',
            '& .MuiButtonGroup-grouped': {
              borderColor: `${isDarkMode ? theme.palette.grey[800] : theme.palette.grey[300]} !important`,
            },
          }}
        >
          <Tooltip title="Zoom in" placement="left" arrow>
            <IconButton onClick={onZoomIn} size="small" sx={{ borderRadius: 0 }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom out" placement="left" arrow>
            <IconButton onClick={onZoomOut} size="small" sx={{ borderRadius: 0 }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit view" placement="left" arrow>
            <IconButton onClick={onFitView} size="small" sx={{ borderRadius: 0 }}>
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} placement="left" arrow>
            <IconButton onClick={onToggleFullscreen} size="small" sx={{ borderRadius: 0 }}>
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="View options" placement="left" arrow>
            <IconButton 
              onClick={handleClick} 
              size="small" 
              sx={{ 
                borderRadius: 0,
                bgcolor: open ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
              }}
            >
              <FilterAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Stack>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: theme.shadows[4],
          }
        }}
      >
        <MenuItem onClick={onToggleMinimap}>
          <ListItemIcon>
            <LayersIcon fontSize="small" color={showMinimap ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText>Show minimap</ListItemText>
          <Switch
            edge="end"
            size="small"
            checked={showMinimap}
            color="primary"
          />
        </MenuItem>
        <MenuItem onClick={onToggleRelationLabels}>
          <ListItemIcon>
            <LinkIcon fontSize="small" color={showRelationLabels ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText>Relation labels</ListItemText>
          <Switch
            edge="end"
            size="small"
            checked={showRelationLabels}
            color="primary"
          />
        </MenuItem>
      </Menu>
    </Panel>
  );
};

// Legend panel component
const LegendPanel = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Panel position="bottom-left">
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: isDarkMode ? alpha(theme.palette.grey[900], 0.9) : alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${isDarkMode ? theme.palette.grey[800] : theme.palette.grey[300]}`,
          width: 180,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Relationship Types</Typography>
        <Stack spacing={1}>
          {Object.entries(RELATION_SYMBOLS).map(([key, value]) => (
            <Stack key={key} direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 3,
                  borderRadius: 1,
                  backgroundColor: RELATION_COLORS[key as keyof typeof RELATION_COLORS],
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{value}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {getRelationshipName(key)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Panel>
  );
};

// Helper function to get relationship name
function getRelationshipName(key: string): string {
  switch (key) {
    case 'OTM': return 'One-to-Many';
    case 'MTO': return 'Many-to-One';
    case 'OTO': return 'One-to-One';
    default: return key;
  }
}

// Custom node component for tables
const TableNode = ({ data }: NodeProps<TableNodeData>) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { isSelected } = data;

  // Define color schemes based on theme and selection state
  // let headerColor: string;
  // if (isSelected) {
  //   headerColor = theme.palette.primary.main;
  // } else if (isDarkMode) {
  //   headerColor = theme.palette.grey[800];
  // } else {
  //   headerColor = '#2D3748';
  // }
  
  let bodyColor: string;
  if (isSelected) {
    if (isDarkMode) {
      bodyColor = alpha(theme.palette.primary.dark, 0.2);
    } else {
      bodyColor = alpha(theme.palette.primary.main, 0.08);
    }
  } else {
    bodyColor = isDarkMode
      ? theme.palette.background.paper
      : theme.palette.common.white;
  }
  
  let borderColor: string;
  if (isSelected) {
    borderColor = theme.palette.primary.main;
  } else if (isDarkMode) {
    borderColor = theme.palette.divider;
  } else {
    borderColor = '#E2E8F0';
  }

  const headerGradient = getHeaderGradient(isSelected, isDarkMode, theme);

  const columnColors = {
    primaryKey: isDarkMode ? theme.palette.warning.main : '#F6AD55',
    text: isDarkMode ? theme.palette.text.primary : '#4A5568',
    type: isDarkMode ? theme.palette.text.secondary : '#718096',
    hover: isDarkMode ? alpha(theme.palette.action.hover, 0.1) : '#F7FAFC',
  };

  // Count primary keys and relations for badge
  const primaryKeysCount = data.columns.filter(col => col.isPrimaryKey).length;
  const relationsCount = data.columns.reduce((count, col) => count + (col.relations?.length || 0), 0);

  // Limit number of columns displayed to prevent oversized nodes
  const displayedColumns = data.columns.slice(0, 12);
  const hasMoreColumns = data.columns.length > 12;

  return (
    <Paper
      elevation={isSelected ? 4 : 1}
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        width: 220,
        boxShadow: isSelected ? theme.shadows[5] : theme.shadows[2],
        '&:hover': {
          boxShadow: isSelected ? theme.shadows[10] : theme.shadows[4],
        },
        border: `1px solid ${borderColor}`,
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        ...(isSelected && {
          transform: 'scale(1.02)',
          zIndex: 10,
        }),
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
      
      {/* Badge indicators for primary keys and relations */}
      {primaryKeysCount > 0 && (
        <Tooltip title={`${primaryKeysCount} Primary Key${primaryKeysCount > 1 ? 's' : ''}`} placement="top" arrow>
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              left: -6,
              zIndex: 2,
              backgroundColor: columnColors.primaryKey,
              color: 'white',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              border: `2px solid ${isDarkMode ? theme.palette.grey[800] : 'white'}`,
              boxShadow: theme.shadows[2],
            }}
          >
            🔑
          </Box>
        </Tooltip>
      )}
      
      {relationsCount > 0 && (
        <Tooltip title={`${relationsCount} Relation${relationsCount > 1 ? 's' : ''}`} placement="top" arrow>
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              zIndex: 2,
              backgroundColor: theme.palette.info.main,
              color: 'white',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              border: `2px solid ${isDarkMode ? theme.palette.grey[800] : 'white'}`,
              boxShadow: theme.shadows[2],
            }}
          >
            🔗
          </Box>
        </Tooltip>
      )}
      
      {/* Table Header */}
      <Box
        sx={{
          background: headerGradient,
          color: theme.palette.common.white,
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isSelected ? theme.palette.primary.dark : borderColor}`,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.tableName}
        </Typography>
        <Chip
          label={data.columns.length.toString()}
          size="small"
          sx={{
            height: 20,
            backgroundColor: alpha(theme.palette.common.white, 0.2),
            color: theme.palette.common.white,
            fontWeight: 'bold',
            fontSize: '0.625rem',
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />
      </Box>

      {/* Table Columns */}
      <Box
        sx={{
          bgcolor: bodyColor,
          transition: 'background-color 0.2s ease',
        }}
      >
        {displayedColumns.map((column, index) => (
          <Box
            key={column.columnIdentifier}
            sx={{
              px: 1.5,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              borderBottom: index < displayedColumns.length - 1 || hasMoreColumns ? `1px solid ${alpha(borderColor, 0.5)}` : 'none',
              '&:hover': {
                bgcolor: columnColors.hover,
              },
              position: 'relative',
              transition: 'background-color 0.1s ease',
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              {column.isPrimaryKey && (
                <KeyIcon
                  sx={{
                    color: columnColors.primaryKey,
                    fontSize: '0.875rem',
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: columnColors.text,
                  fontWeight: column.isPrimaryKey ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 130,
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
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontStyle: 'italic',
                  flexShrink: 0,
                }}
              >
                {column.columnType}
              </Typography>
              {column.relations && column.relations.length > 0 && (
                <Tooltip 
                  title={column.relations.map(r => 
                    `${RELATION_SYMBOLS[r.type as keyof typeof RELATION_SYMBOLS]} → ${r.tableIdentifier}.${r.toColumn}`
                  ).join(', ')}
                  placement="top"
                  arrow
                >
                  <LinkIcon
                    sx={{
                      ml: 0.5,
                      color: theme.palette.info.main,
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Box>
        ))}
        
        {/* Show indicator for hidden columns */}
        {hasMoreColumns && (
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? alpha(theme.palette.grey[800], 0.5) : alpha(theme.palette.grey[100], 0.8),
            }}
          >
            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              + {data.columns.length - displayedColumns.length} more columns
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// Helper function to get header gradient
function getHeaderGradient(isSelected: boolean, isDarkMode: boolean, theme: any): string {
  if (isSelected) {
    return isDarkMode
      ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${theme.palette.primary.main} 100%)`
      : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`;
  }
  
  return isDarkMode
    ? `linear-gradient(90deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[700]} 100%)`
    : `linear-gradient(90deg, #2D3748 0%, #4A5568 100%)`;
}

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showRelationLabels, setShowRelationLabels] = useState(true);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Create ReactFlow nodes from tables with persisted positions
  const initialNodes = useMemo(
    () =>
      tables.map((table, index) => {
        const isSelected = selectedTable === table.tableIdentifier;

        // Use saved position if available, otherwise calculate new position
        const savedPosition = nodePositions[table.tableIdentifier];
        let position;
        
        if (savedPosition) {
          position = savedPosition;
        } else {
          // Position tables in a grid layout for initial render
          const columns = Math.ceil(Math.sqrt(tables.length));
          const col = index % columns;
          const row = Math.floor(index / columns);
          position = { x: col * 300, y: row * 250 };
        }

        return {
          id: table.tableIdentifier,
          type: 'tableNode',
          position,
          data: {
            tableName: table.tableIdentifier,
            columns: table.columns,
            isSelected,
          },
          draggable: true,
          selectable: true,
        };
      }),
    [tables, selectedTable, nodePositions]
  );

  // Create edges from relationships
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

            // Get relation color
            const relationColor = RELATION_COLORS[relation.type as keyof typeof RELATION_COLORS] || 
              (isDarkMode ? theme.palette.grey[500] : '#A0AEC0');

            // Determine edge style based on selection state
            const edgeColor = isHighlighted 
              ? relationColor 
              : alpha(relationColor, isDarkMode ? 0.7 : 0.5);
            
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
              label: showRelationLabels ? RELATION_SYMBOLS[relation.type as keyof typeof RELATION_SYMBOLS] || '' : '',
              style: {
                stroke: edgeColor,
                strokeWidth: isHighlighted ? 2 : 1.5,
              },
              labelStyle: {
                fill: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary,
                fontWeight: isHighlighted ? 'bold' : 'normal',
                fontSize: 12,
                strokeWidth: 0,
              },
              labelBgStyle: {
                fill: isDarkMode 
                  ? alpha(theme.palette.background.paper, 0.8) 
                  : alpha(theme.palette.background.paper, 0.9),
                fillOpacity: 0.8,
                stroke: isDarkMode ? theme.palette.divider : theme.palette.grey[300],
                strokeWidth: isHighlighted ? 1 : 0.5,
              },
              labelShowBg: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: 15,
                height: 15,
              },
              data: {
                isHighlighted,
                relationType: relation.type,
              },
            });
          });
        }
      });
    });

    return edges;
  }, [tables, selectedTable, theme, isDarkMode, showRelationLabels]);

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

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

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

  // Add handler for node drag
  const onNodeDragStop = useCallback((event: any, node: Node) => {
    setNodePositions(prev => ({
      ...prev,
      [node.id]: node.position
    }));
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onNodeDragStop={onNodeDragStop}
      nodeTypes={nodeTypes}
      fitView={false}
      minZoom={0.1}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
      attributionPosition="bottom-right"
      proOptions={{ hideAttribution: true }}
      style={{ 
        backgroundColor: isDarkMode 
          ? alpha(theme.palette.background.default, 0.7) 
          : alpha(theme.palette.grey[50], 0.8),
      }}
    >
      <Background
        color={isDarkMode ? alpha(theme.palette.grey[700], 0.5) : alpha(theme.palette.grey[300], 0.5)}
        gap={16}
        size={1}
      />
      
      <Controls
        position="bottom-right"
        style={{
          display: 'none', // Hide default controls
        }}
      />
      
      {showMinimap && (
        <MiniMap
          style={{
            backgroundColor: isDarkMode ? alpha(theme.palette.grey[900], 0.8) : alpha(theme.palette.common.white, 0.9),
            border: `1px solid ${isDarkMode ? theme.palette.divider : theme.palette.grey[300]}`,
            borderRadius: 8,
          }}
          nodeColor={getNodeColor}
          nodeBorderRadius={4}
          maskColor={isDarkMode ? alpha(theme.palette.grey[900], 0.5) : alpha(theme.palette.grey[200], 0.5)}
          zoomable
          pannable
        />
      )}
      
      <ControlPanel
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={() => fitView({ padding: 0.2 })}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        showRelationLabels={showRelationLabels}
        onToggleRelationLabels={() => setShowRelationLabels(!showRelationLabels)}
      />
      
      <LegendPanel />
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
        borderRadius: 1.5,
        border: `1px solid ${isDarkMode ? theme.palette.divider : '#E2E8F0'}`,
        bgcolor: isDarkMode ? theme.palette.background.default : '#F7FAFC',
        overflow: 'hidden',
        position: 'relative',
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