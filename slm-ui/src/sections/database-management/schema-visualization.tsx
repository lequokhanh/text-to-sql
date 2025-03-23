import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { TableDefinition } from 'src/types/database';

// Define relationship symbols
const RELATION_SYMBOLS = {
  OTM: '1:n', // One-to-Many
  MTO: 'n:1', // Many-to-One
  OTO: '1:1', // One-to-One
  MTM: 'n:n', // Many-to-Many
};

// Colors similar to dbdiagram.io
const COLORS = {
  table: {
    header: '#2D3748',
    headerText: '#FFFFFF',
    body: '#FFFFFF',
    border: '#E2E8F0',
    selected: {
      header: '#3182CE',
      headerText: '#FFFFFF',
      body: '#EBF8FF',
      border: '#90CDF4',
    },
  },
  column: {
    primaryKey: '#F6AD55',
    text: '#4A5568',
    type: '#718096',
    hover: '#F7FAFC',
  },
  relation: {
    line: '#A0AEC0',
    symbol: '#4A5568',
    selected: '#3182CE',
  },
};

type Props = {
  tables: TableDefinition[];
  selectedTable: string | null;
  // Optional props for more customization
  width?: number | string;
  height?: number | string;
  onTableClick?: (tableId: string) => void;
  // expandedTables prop is still accepted for backward compatibility
  // but will be ignored as all tables are always expanded
  expandedTables?: Record<string, boolean>;
};

export function SchemaVisualization({
  tables,
  selectedTable,
  width = '100%',
  height = '100%',
  onTableClick,
  expandedTables = {},
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const contentDivRef = useRef<HTMLDivElement | null>(null);

  // State to store table positions (allows for dragging)
  const [tablePositions, setTablePositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

  // For tracking drag state
  const dragRef = useRef<{
    isDragging: boolean;
    tableId: string | null;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
  }>({
    isDragging: false,
    tableId: null,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0,
  });

  // Layout settings
  const TABLE_WIDTH = 220;
  const TABLE_HEADER_HEIGHT = 36;
  const COLUMN_HEIGHT = 28;
  const HORIZONTAL_SPACING = 60;
  const VERTICAL_SPACING = 80;
  const PADDING = 20;

  // Calculate table dimensions including columns
  const getTableDimensions = (table: TableDefinition) => {
    // All tables are always expanded
    const columnsHeight = table.columns.length * COLUMN_HEIGHT;
    return {
      width: TABLE_WIDTH,
      height: TABLE_HEADER_HEIGHT + columnsHeight,
    };
  };

  // Calculate initial table positions
  const calculateInitialTablePositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};

    // Simple grid layout for demonstration
    const cols = Math.ceil(Math.sqrt(tables.length));

    tables.forEach((table, index) => {
      const dimensions = getTableDimensions(table);
      const col = index % cols;
      const row = Math.floor(index / cols);

      positions[table.tableIdentifier] = {
        x: col * (TABLE_WIDTH + HORIZONTAL_SPACING) + PADDING,
        y: row * (dimensions.height + VERTICAL_SPACING) + PADDING,
        width: dimensions.width,
        height: dimensions.height,
      };
    });

    return positions;
  }, [tables, TABLE_WIDTH, HORIZONTAL_SPACING, VERTICAL_SPACING, PADDING]);

  // Draw relationship lines between tables
  const drawRelationships = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear existing lines
    const existingLines = svg.querySelectorAll('.relation-line, .relation-label');
    existingLines.forEach((line) => line.remove());

    tables.forEach((sourceTable) => {
      sourceTable.columns.forEach((column) => {
        if (column.relations?.length) {
          column.relations.forEach((relation) => {
            const sourcePos = tablePositions[sourceTable.tableIdentifier];
            const targetTable = tables.find((t) => t.tableIdentifier === relation.tableIdentifier);

            if (!targetTable || !sourcePos) return;

            const targetPos = tablePositions[relation.tableIdentifier];
            if (!targetPos) return;

            // Find the target column in the target table
            const targetColumn = targetTable.columns.find(
              (c) => c.columnIdentifier === relation.toColumn
            );

            // Calculate start and end points - always use column positions since all tables are expanded
            const columnIndex = sourceTable.columns.findIndex(
              (c) => c.columnIdentifier === column.columnIdentifier
            );
            const startY =
              sourcePos.y + TABLE_HEADER_HEIGHT + columnIndex * COLUMN_HEIGHT + COLUMN_HEIGHT / 2;

            let endY = 0;
            let startX = 0;
            let endX = 0;

            if (targetColumn) {
              // Position at the specific column
              const colIdx = targetTable.columns.findIndex(
                (c) => c.columnIdentifier === targetColumn.columnIdentifier
              );
              endY = targetPos.y + TABLE_HEADER_HEIGHT + colIdx * COLUMN_HEIGHT + COLUMN_HEIGHT / 2;
            } else {
              // Position at the table header center if target column not found
              endY = targetPos.y + TABLE_HEADER_HEIGHT / 2;
            }

            // Determine which side of the tables to connect
            if (sourcePos.x < targetPos.x) {
              // Source is to the left of target
              startX = sourcePos.x + sourcePos.width;
              endX = targetPos.x;
            } else {
              // Source is to the right of target
              startX = sourcePos.x;
              endX = targetPos.x + targetPos.width;
            }

            // Create a path for the relationship line
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.classList.add('relation-line');

            // Calculate control points for a cubic bezier curve
            const dx = Math.abs(endX - startX);
            const controlPointOffset = Math.min(50, dx / 2);

            let path;
            if (sourcePos.x < targetPos.x) {
              path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${
                endX - controlPointOffset
              } ${endY}, ${endX} ${endY}`;
            } else {
              path = `M ${startX} ${startY} C ${startX - controlPointOffset} ${startY}, ${
                endX + controlPointOffset
              } ${endY}, ${endX} ${endY}`;
            }

            pathEl.setAttribute('d', path);
            pathEl.setAttribute('fill', 'none');
            pathEl.setAttribute('stroke', COLORS.relation.line);
            pathEl.setAttribute('stroke-width', '1.5');
            pathEl.setAttribute('marker-end', 'url(#arrowhead)');

            // Highlight if this relation involves the selected table
            if (
              selectedTable &&
              (sourceTable.tableIdentifier === selectedTable ||
                relation.tableIdentifier === selectedTable)
            ) {
              pathEl.setAttribute('stroke', COLORS.relation.selected);
              pathEl.setAttribute('stroke-width', '2');
            }

            svg.appendChild(pathEl);

            // Add relationship type label
            const relationSymbol = RELATION_SYMBOLS[relation.type];
            if (relationSymbol) {
              // Calculate position for the label (midpoint of the path)
              const labelX = (startX + endX) / 2;
              const labelY = (startY + endY) / 2;

              const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              textEl.setAttribute('x', `${labelX}`);
              textEl.setAttribute('y', `${labelY}`);
              textEl.setAttribute('text-anchor', 'middle');
              textEl.setAttribute('dy', '-6');
              textEl.setAttribute('font-size', '10');
              textEl.setAttribute('fill', COLORS.relation.symbol);
              textEl.classList.add('relation-label');

              // Add a white background for better readability
              const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              const padding = 3;
              bgRect.setAttribute('width', `${relationSymbol.length * 6 + padding * 2}px`);
              bgRect.setAttribute('height', '14px');
              bgRect.setAttribute('x', `${labelX - (relationSymbol.length * 3 + padding)}`);
              bgRect.setAttribute('y', `${labelY - 14}`);
              bgRect.setAttribute('fill', 'white');
              bgRect.setAttribute('rx', '2');
              svg.appendChild(bgRect);

              textEl.textContent = relationSymbol;
              svg.appendChild(textEl);
            }
          });
        }
      });
    });
  }, [tables, tablePositions, selectedTable, COLUMN_HEIGHT, TABLE_HEADER_HEIGHT]);

  // Update content div dimensions based on table positions
  const updateContentDimensions = useCallback(() => {
    if (!contentDivRef.current) return;

    // Determine content size for container scrolling
    let maxRight = 0;
    let maxBottom = 0;

    Object.values(tablePositions).forEach((pos) => {
      maxRight = Math.max(maxRight, pos.x + pos.width);
      maxBottom = Math.max(maxBottom, pos.y + pos.height);
    });

    contentDivRef.current.style.width = `${maxRight + PADDING}px`;
    contentDivRef.current.style.height = `${maxBottom + PADDING}px`;
  }, [tablePositions, PADDING]);
  // Handle mouse move event to update dragging position
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current.isDragging || !dragRef.current.tableId) return;

      e.preventDefault();

      // Calculate the new position
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const newX = dragRef.current.originalX + dx;
      const newY = dragRef.current.originalY + dy;

      // Update the table's position
      const { tableId } = dragRef.current;
      const tableEl = document.getElementById(`table-${tableId}`);

      if (tableEl) {
        tableEl.style.left = `${newX}px`;
        tableEl.style.top = `${newY}px`;
      }

      // Update the tablePositions state (but not yet - wait until mouseup for performance)
      setTablePositions((prev) => ({
        ...prev,
        [tableId]: {
          ...prev[tableId],
          x: newX,
          y: newY,
        },
      }));

      // Redraw relationships in real-time for visual feedback
      drawRelationships();
    },
    [drawRelationships]
  );

  // Handle mouse up event to end dragging
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;

      e.preventDefault();

      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Update content dimensions
      updateContentDimensions();

      // Reset drag state
      dragRef.current = {
        isDragging: false,
        tableId: null,
        startX: 0,
        startY: 0,
        originalX: 0,
        originalY: 0,
      };
    },
    [handleMouseMove, updateContentDimensions]
  );

  // Handle mouse down event to start dragging
  const handleMouseDown = useCallback(
    (e: MouseEvent, tableId: string) => {
      if (dragRef.current.isDragging) return;

      // Only initiate drag when clicking the header
      const target = e.target as Element;
      if (!target.closest('.table-header')) return;

      e.preventDefault();

      // Get the current position of the table
      const pos = tablePositions[tableId];

      dragRef.current = {
        isDragging: true,
        tableId,
        startX: e.clientX,
        startY: e.clientY,
        originalX: pos.x,
        originalY: pos.y,
      };

      // Add event listeners for drag and end drag
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [tablePositions, handleMouseMove, handleMouseUp]
  );

  // Initialize the component
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize table positions if they haven't been set yet
    if (Object.keys(tablePositions).length === 0) {
      setTablePositions(calculateInitialTablePositions());
      return; // Return early - the next effect will handle rendering
    }

    // Clear existing visualization
    const container = containerRef.current;
    container.innerHTML = '';

    // Create content div
    const contentDiv = document.createElement('div');
    contentDiv.style.position = 'relative';
    contentDivRef.current = contentDiv;

    // Create SVG element for relationships
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.zIndex = '1';
    svg.style.pointerEvents = 'none'; // Make sure SVG doesn't interfere with dragging
    svgRef.current = svg;

    // Add arrow marker definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', COLORS.relation.line);

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Update container size
    container.style.width = typeof width === 'number' ? `${width}px` : width;
    container.style.height = typeof height === 'number' ? `${height}px` : height;

    // Draw tables
    tables.forEach((table) => {
      const pos = tablePositions[table.tableIdentifier];
      if (!pos) return;

      const isSelected = selectedTable === table.tableIdentifier;

      // Create table container
      const tableEl = document.createElement('div');
      tableEl.classList.add('schema-table');
      tableEl.id = `table-${table.tableIdentifier}`;
      tableEl.style.position = 'absolute';
      tableEl.style.left = `${pos.x}px`;
      tableEl.style.top = `${pos.y}px`;
      tableEl.style.width = `${pos.width}px`;
      tableEl.style.borderRadius = '4px';
      tableEl.style.overflow = 'hidden';
      tableEl.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
      tableEl.style.transition = 'box-shadow 0.2s ease';
      tableEl.style.cursor = 'move'; // Use move cursor to indicate draggability

      if (isSelected) {
        tableEl.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)';
      }

      // Add mousedown event for drag functionality
      tableEl.addEventListener('mousedown', (e) => handleMouseDown(e, table.tableIdentifier));

      // Add click event listener if provided (use mouseup to prevent conflicts with dragging)
      if (onTableClick) {
        tableEl.addEventListener('click', (e) => {
          // Only trigger the click if we're not dragging
          if (!dragRef.current.isDragging) {
            onTableClick(table.tableIdentifier);
          }
        });
      }

      // Create table header
      const headerEl = document.createElement('div');
      headerEl.classList.add('table-header');
      headerEl.style.backgroundColor = isSelected
        ? COLORS.table.selected.header
        : COLORS.table.header;
      headerEl.style.color = COLORS.table.headerText;
      headerEl.style.padding = '8px 12px';
      headerEl.style.fontWeight = 'bold';
      headerEl.style.fontSize = '14px';
      headerEl.style.height = `${TABLE_HEADER_HEIGHT}px`;
      headerEl.style.display = 'flex';
      headerEl.style.alignItems = 'center';
      headerEl.style.justifyContent = 'space-between';
      headerEl.style.boxSizing = 'border-box';
      headerEl.textContent = table.tableIdentifier;

      // Add table icon/badge showing number of columns
      const badgeEl = document.createElement('span');
      badgeEl.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      badgeEl.style.borderRadius = '12px';
      badgeEl.style.padding = '2px 6px';
      badgeEl.style.fontSize = '10px';
      badgeEl.textContent = `${table.columns.length}`;
      headerEl.appendChild(badgeEl);

      tableEl.appendChild(headerEl);

      // Always show columns since all tables are expanded
      const columnsContainer = document.createElement('div');
      columnsContainer.style.backgroundColor = isSelected
        ? COLORS.table.selected.body
        : COLORS.table.body;
      columnsContainer.style.border = `1px solid ${
        isSelected ? COLORS.table.selected.border : COLORS.table.border
      }`;
      columnsContainer.style.borderTop = 'none';

      table.columns.forEach((column, index) => {
        const columnEl = document.createElement('div');
        columnEl.style.padding = '6px 12px';
        columnEl.style.fontSize = '12px';
        columnEl.style.height = `${COLUMN_HEIGHT}px`;
        columnEl.style.display = 'flex';
        columnEl.style.alignItems = 'center';
        columnEl.style.boxSizing = 'border-box';
        columnEl.style.borderBottom =
          index < table.columns.length - 1
            ? `1px solid ${isSelected ? COLORS.table.selected.border : COLORS.table.border}`
            : 'none';
        columnEl.style.position = 'relative';

        // Add hover effect
        columnEl.onmouseenter = () => {
          columnEl.style.backgroundColor = COLORS.column.hover;
        };
        columnEl.onmouseleave = () => {
          columnEl.style.backgroundColor = 'transparent';
        };

        // Primary key indicator
        if (column.isPrimaryKey) {
          const keyIcon = document.createElement('span');
          keyIcon.textContent = '🔑 ';
          keyIcon.style.color = COLORS.column.primaryKey;
          keyIcon.style.marginRight = '4px';
          keyIcon.style.fontSize = '10px';
          columnEl.appendChild(keyIcon);
        }

        // Column name
        const nameEl = document.createElement('span');
        nameEl.textContent = column.columnIdentifier;
        nameEl.style.color = COLORS.column.text;
        nameEl.style.fontWeight = column.isPrimaryKey ? 'bold' : 'normal';
        columnEl.appendChild(nameEl);

        // Column type (with some spacing)
        const typeEl = document.createElement('span');
        typeEl.textContent = column.columnType;
        typeEl.style.color = COLORS.column.type;
        typeEl.style.marginLeft = 'auto';
        typeEl.style.fontSize = '11px';
        typeEl.style.opacity = '0.7';
        columnEl.appendChild(typeEl);

        // Relational icon if it has relations
        if (column.relations && column.relations.length > 0) {
          const relIcon = document.createElement('span');
          relIcon.textContent = '🔗';
          relIcon.style.marginLeft = '4px';
          relIcon.style.fontSize = '10px';
          columnEl.appendChild(relIcon);
        }

        columnsContainer.appendChild(columnEl);
      });

      tableEl.appendChild(columnsContainer);
      contentDiv.appendChild(tableEl);
    });

    // Add SVG for relationships
    contentDiv.appendChild(svg);
    container.appendChild(contentDiv);

    // Update content dimensions
    updateContentDimensions();

    // Draw relationships
    drawRelationships();
  }, [
    tables,
    tablePositions,
    selectedTable,
    width,
    height,
    onTableClick,
    calculateInitialTablePositions,
    updateContentDimensions,
    drawRelationships,
    handleMouseDown,
  ]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        height,
        minHeight: 400,
        position: 'relative',
        overflow: 'auto',
        bgcolor: '#F7FAFC',
        borderRadius: 1,
        border: '1px solid #E2E8F0',
      }}
    />
  );
}
