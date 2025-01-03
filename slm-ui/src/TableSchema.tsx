import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
interface Column {
    name: string;
    dtype: string;
    constraints: string[];
    description: string;
  }
  
  interface Table {
    name: string;
    columns: Column[];
    primary_keys: string[];
    foreign_keys: { column: string; references: string }[];
  }
  
  interface Schema {
    tables: Table[];
  }
  
  interface TableData {
    [tableName: string]: {
      [columnName: string]: string;
    };
  }
  
  interface TableSchemaProps {
    schema: Schema;
  }
  
  const TableSchema: React.FC<TableSchemaProps> = ({ schema }) => {
    const [tableData, setTableData] = useState<TableData>({});
  
    useEffect(() => {
      const savedData = JSON.parse(localStorage.getItem('tableData') || '{}') as TableData;
      
      // Set initial data with either saved or default descriptions
      const initialData = schema.tables.reduce((acc, table) => {
        acc[table.name] = table.columns.reduce((columnAcc, column) => {
          columnAcc[column.name] = savedData[table.name]?.[column.name] || column.description || '';
          return columnAcc;
        }, {} as { [columnName: string]: string });
        return acc;
      }, {} as TableData);
  
      setTableData(initialData);
    }, [schema]);
  
    const handleDescriptionChange = (tableName: string, columnName: string, value: string) => {
      setTableData((prevData) => {
        const updatedData = { ...prevData };
        if (!updatedData[tableName]) updatedData[tableName] = {};
        updatedData[tableName][columnName] = value;
        return updatedData;
      });
    };
  
    const handleSave = () => {
      localStorage.setItem('tableData', JSON.stringify(tableData));
      alert('Data saved!');
    };
  
    return (
      <div className="space-y-6">
        {schema.tables.map((table) => (
          <Card key={table.name}>
            <CardHeader>
              <CardTitle>{table.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">Column Name</div>
                  <div className="font-medium">Data Type</div>
                  <div className="font-medium">Description</div>
                </div>
                {table.columns.map((column) => (
                  <div key={column.name} className="grid grid-cols-3 gap-4">
                    <div>{column.name}</div>
                    <div>{column.dtype}</div>
                    <div>
                      <Input
                        placeholder="Description"
                        value={tableData[table.name]?.[column.description] || ''}
                        onChange={(e) => handleDescriptionChange(table.name, column.name, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Save</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  export default TableSchema;
  