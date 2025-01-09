export interface Column {
    name: string;
    dtype: string;
    description: string;
    constraints: string[];
}

export interface ForeignKey {
    column: string;
    references: string;
}

export interface Table {
    name: string;
    primary_keys: string[];
    columns: Column[];
    foreign_keys: ForeignKey[];
    selected?: boolean;
}

export interface DatabaseSchema {
    database: string;
    tables: Table[];
}

export interface ApiResponse {
    statusCode: number;
    message: string;
    data: {
        database: string;
        tables: Table[];
    };
}