// Relation types
export type RelationType = 'OTM' | 'MTO' | 'OTO' | 'MTM';

// Column relation
export interface ColumnRelation {
  id: number;
  tableIdentifier: string;
  toColumn: string;
  type: RelationType;
}

// Column definition
export interface ColumnDefinition {
  id: number;
  columnIdentifier: string;
  columnType: string;
  columnDescription?: string;
  isPrimaryKey: boolean;
  relations?: ColumnRelation[];
}

// Table definition
export interface TableDefinition {
  id: number;
  tableIdentifier: string;
  columns: ColumnDefinition[];
}

// Group types
export interface GroupUpsertDTO {
  name: string;
  tableIds: number[];
}

export interface GroupDTO {
  id: number;
  name: string;
}

export interface GroupDetailDTO extends GroupDTO {
  tableIds: number[];
  members: UserAccountDTO[];
  dataSourceConfiguration: DataSourceConfigurationDTO;
}

export interface AddUserToGroupDTO {
  userIds: number[];
}

// User types
export interface UserAccountDTO {
  id: number;
  username: string;
}

// Data source types
export interface DataSourceConfigurationDTO {
  id: number;
  databaseType: DatabaseType;
  name: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  collectionName?: string;
}

export interface DataSourceConfigurationViewDTO extends DataSourceConfigurationDTO {
  owners: UserAccountDTO[];
  groups: GroupDTO[];
}

export interface DataSourceConfigurationDetailDTO extends DataSourceConfigurationDTO {
  tableDefinitions: TableDefinition[];
}

// Update DTOs
export interface UpdateColumnDTO {
  columnIdentifier: string;
  columnType: string;
  columnDescription?: string;
  isPrimaryKey: boolean;
}

export interface UpdateRelationDTO {
  type: RelationType;
}

export interface UpdateTableDTO {
  tableIdentifier: string;
}

// Create DTOs
export interface CreateColumnDTO {
  columnIdentifier: string;
  columnType: string;
  columnDescription?: string;
  isPrimaryKey: boolean;
}

export interface CreateRelationDTO {
  toColumn: string;
  tableIdentifier: string;
  type: RelationType;
}

export interface CreateTableDTO {
  tableIdentifier: string;
  columns: CreateColumnDTO[];
}

// Database type enum
export type DatabaseType = 'POSTGRESQL' | 'MYSQL';

export type DatabaseSource = {
  id: string;
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
  host?: string;
  port?: string;
  databaseName?: string;
};
