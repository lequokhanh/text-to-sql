import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Box
} from '@mui/material';

const DBSchemaWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(2);
  const [dbConfig, setDbConfig] = useState({
    url: '',
    username: '',
    password: '',
    database: '',
    dbType: 'postgresql'
  });
  const [schemaData, setSchemaData] = useState(null);
  const [editedTables, setEditedTables] = useState({});

  const steps = ['Database Connection', 'Schema Configuration', 'Chat Interface'];

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8181/db/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `jdbc:${dbConfig.dbType}://localhost:5432/${dbConfig.database}`,
          username: dbConfig.username,
          password: dbConfig.password,
          dbType: dbConfig.dbType
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        setSchemaData(data.data);
        // Initialize editedTables with current descriptions
        const initialEdited = {};
        data.data.tables.forEach(table => {
          initialEdited[table.name] = table.columns.map(col => ({
            ...col,
            editedDescription: col.description
          }));
        });
        setEditedTables(initialEdited);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDescriptionEdit = (tableIndex, columnIndex, newDescription) => {
    const tableName = schemaData.tables[tableIndex].name;
    setEditedTables(prev => ({
      ...prev,
      [tableName]: prev[tableName].map((col, idx) =>
        idx === columnIndex ? { ...col, editedDescription: newDescription } : col
      )
    }));
  };

  const handleChatStart = () => {
    const modifiedSchema = {
      ...schemaData,
      tables: schemaData.tables.map(table => ({
        ...table,
        columns: editedTables[table.name]
      }))
    };
    console.log('Modified schema for Ollama:', modifiedSchema);
    setCurrentStep(2);
  };

  const renderStep1 = () => (
    <form onSubmit={handleConnect}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, margin: 'auto' }}>
        <FormControl fullWidth>
          <InputLabel>Database Type</InputLabel>
          <Select
            value={dbConfig.dbType}
            label="Database Type"
            onChange={(e) => setDbConfig(prev => ({ ...prev, dbType: e.target.value }))}
          >
            <MenuItem value="postgresql">PostgreSQL</MenuItem>
            <MenuItem value="mysql">MySQL</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Database Name"
          value={dbConfig.database}
          onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
          fullWidth
        />

        <TextField
          label="Username"
          value={dbConfig.username}
          onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
          fullWidth
        />

        <TextField
          label="Password"
          type="password"
          value={dbConfig.password}
          onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
          fullWidth
        />

        <Button
          variant="contained"
          color="primary"
          type="submit"
          fullWidth
        >
          Connect
        </Button>
      </Box>
    </form>
  );

  const renderStep2 = () => (
    <Box sx={{ mt: 2 }}>
      {schemaData?.tables.map((table, tableIndex) => (
        <Card key={table.name} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {table.name}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Column Name</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editedTables[table.name]?.map((column, columnIndex) => (
                    <TableRow key={column.name}>
                      <TableCell>{column.name}</TableCell>
                      <TableCell>{column.dtype}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          value={column.editedDescription}
                          onChange={(e) => handleDescriptionEdit(tableIndex, columnIndex, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="contained"
        color="primary"
        onClick={handleChatStart}
        fullWidth
      >
        Continue to Chat
      </Button>
    </Box>
  );

  const renderStep3 = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Chat with AI
        </Typography>
        <Paper
          elevation={3}
          sx={{
            height: 400,
            p: 2,
            overflowY: 'auto',
            bgcolor: 'grey.50'
          }}
        >
          <Typography color="text.secondary">
            Chat interface connecting to Ollama...
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Box height={"100px"}/>
      <Box sx={{ maxWidth: 900, margin: 'auto', p: 3 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
      </Box>
    </>
  );
};

export default DBSchemaWorkflow;
