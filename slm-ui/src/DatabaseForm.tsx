import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DatabaseForm = () => {
  const [formData, setFormData] = useState({
    dbType: '',
    url: '',
    username: '',
    password: ''
  });
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8181/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        setSchema(data.data);
        localStorage.setItem('dbSchema', JSON.stringify(data.data));
      } else {
        setError(data.message || 'Connection failed');
      }
    } catch (err) {
      setError('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const handleDescriptionChange = (tableName, columnName, description) => {
    const updatedSchema = JSON.parse(JSON.stringify(schema));
    const table = updatedSchema.tables.find(t => t.name === tableName);
    const column = table.columns.find(c => c.name === columnName);
    column.description = description;
    setSchema(updatedSchema);
    localStorage.setItem('dbSchema', JSON.stringify(updatedSchema));
  };

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select 
              value={formData.dbType}
              onValueChange={(value) => setFormData({...formData, dbType: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlserver">SQL Server</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Connection URL"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />

            <Input
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />

            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <Button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>

            {error && <div className="text-red-500">{error}</div>}
          </form>
        </CardContent>
      </Card>

      {schema && (
        <div className="space-y-6">
          {schema.tables.map(table => (
            <Card key={table.name}>
              <CardHeader>
                <CardTitle>{table.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {table.columns.map(column => (
                    <div key={column.name} className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{column.name}</p>
                        <p className="text-sm text-gray-500">
                          Type: {column.dtype}
                          {column.constraints.length > 0 && ` (${column.constraints.join(', ')})`}
                          {table.primary_keys.includes(column.name) && ' (Primary Key)'}
                          {table.foreign_keys.some(fk => fk.column === column.name) && 
                            ` (FK → ${table.foreign_keys.find(fk => fk.column === column.name).references})`}
                        </p>
                      </div>
                      <Input
                        placeholder="Description"
                        value={column.description || ''}
                        onChange={(e) => handleDescriptionChange(table.name, column.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseForm;