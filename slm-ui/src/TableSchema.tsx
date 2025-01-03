import React, { useState, useEffect } from "react";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const [openTable, setOpenTable] = useState<string>(
        schema.tables[0]?.name || ""
    ); // Open the first table by default

    useEffect(() => {
        const savedData = JSON.parse(
            localStorage.getItem("tableData") || "{}"
        ) as TableData;

        const initialData = schema.tables.reduce((acc, table) => {
            acc[table.name] = table.columns.reduce((columnAcc, column) => {
                columnAcc[column.name] =
                    savedData[table.name]?.[column.name] ||
                    column.description ||
                    "";
                return columnAcc;
            }, {} as { [columnName: string]: string });
            return acc;
        }, {} as TableData);

        setTableData(initialData);
    }, [schema]);

    const handleDescriptionChange = (
        tableName: string,
        columnName: string,
        value: string
    ) => {
        setTableData((prevData) => {
            const updatedData = { ...prevData };
            if (!updatedData[tableName]) updatedData[tableName] = {};
            updatedData[tableName][columnName] = value;
            return updatedData;
        });
    };

    const handleSave = () => {
        localStorage.setItem("tableData", JSON.stringify(tableData));
        alert("Data saved!");
    };

    const handleAccordionChange = (value: string) => {
        // If all accordions are closed, keep the first one open
        if (!value) {
            setOpenTable(schema.tables[0]?.name || ""); // Reopen the first accordion if no value
        } else {
            setOpenTable(value); // Otherwise, set the selected accordion as open
        }
    };

    return (
        <div className="space-y-6">
            <Accordion
                type="single"
                value={openTable}
                onValueChange={handleAccordionChange}
                collapsible
                className="w-full"
            >
                {schema.tables.map((table) => (
                    <AccordionItem key={table.name} value={table.name}>
                        <AccordionTrigger className="bg-white text-black w-full">
                            {table.name}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="font-medium">
                                        Column Name
                                    </div>
                                    <div className="font-medium">Data Type</div>
                                    <div className="font-medium">
                                        Description
                                    </div>
                                </div>
                                {table.columns.map((column) => (
                                    <div
                                        key={column.name}
                                        className="grid grid-cols-3 gap-4"
                                    >
                                        <div>{column.name}</div>
                                        <div>{column.dtype}</div>
                                        <div>
                                            <Input
                                                placeholder="Description"
                                                value={
                                                    tableData[table.name]?.[
                                                        column.name
                                                    ] || column.description
                                                }
                                                onChange={(e) =>
                                                    handleDescriptionChange(
                                                        table.name,
                                                        column.name,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <Button onClick={handleSave}>Save</Button>
        </div>
    );
};

export default TableSchema;
