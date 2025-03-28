import sqlFormatter from '@sqltools/formatter';

export function formatSqlQuery(query: string): string {
  try {
    return sqlFormatter.format(query, {
      language: 'sql',
      reservedWordCase: 'upper',
      linesBetweenQueries: 2,
      indent: 'standard',
    });
  } catch (error) {
    console.error('Error formatting SQL query:', error);
    return query; // Return original query if formatting fails
  }
}
