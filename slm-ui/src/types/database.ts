export type TableRelation = {
  tableIdentifier: string;
  toColumn: string;
  type: 'OTM' | 'MTO' | 'OTO' | 'MTM';
};

export type ColumnDefinition = {
  columnIdentifier: string;
  columnType: string;
  columnDescription?: string;
  isPrimaryKey: boolean;
  relations?: TableRelation[];
};

export type TableDefinition = {
  tableIdentifier: string;
  columns: ColumnDefinition[];
};

export type DatabaseSource = {
  databaseType: 'POSTGRESQL' | 'MYSQL' | 'ORACLE';
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
  name: string;
  tableDefinitions: TableDefinition[];
};

export type DatabaseConnectionConfig = {
  url: string;
  username: string;
  password: string;
  dbType: string;
};
