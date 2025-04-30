export function formatResultsAsMarkdownTable(data: any[]): string {
  if (!data || !data.length) return '```\nNo results found\n```';

  const columns = Object.keys(data[0]);

  // Create header row
  let table = `| ${columns.join(' | ')} |\n`;
  table += `| ${columns.map(() => '---').join(' | ')} |\n`;

  // Add data rows (limit to 50 rows for performance)
  const displayData = data.slice(0, 50);

  displayData.forEach((row) => {
    table += `| ${columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      })
      .join(' | ')} |\n`;
  });

  // Add a note if data was truncated
  if (data.length > 50) {
    table += `\n_Showing 50 of ${data.length} rows_`;
  }

  return table;
}

// Function to generate a CSV filename
export function generateCsvFilename(prefix = 'query-results'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}`;
}

// Function to export table data to CSV
export function exportToCSV(results: Record<string, any>[], fileName: string): void {
  if (!results || !results.length) return;

  // Get headers from the first result object
  const headers = Object.keys(results[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...results.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle different value types for CSV format
          if (value === null) return '';
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
