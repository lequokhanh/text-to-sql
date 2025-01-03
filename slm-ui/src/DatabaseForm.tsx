import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import TableSchema from "./TableSchema";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Save } from "lucide-react"; // Import icons

interface Column {
    name: string;
    dtype: string;
    description: string;
    constraints: string[];
}

interface ForeignKey {
    references: string;
    column: string;
}

interface Table {
    primary_keys: string[];
    columns: Column[];
    name: string;
    foreign_keys: ForeignKey[];
}

interface Schema {
    database: string;
    tables: Table[];
}

interface ApiResponse {
    statusCode: number;
    message: string;
    data: Schema;
}

interface FormData {
    dbType: string;
    url: string;
    username: string;
    password: string;
}

const DatabaseForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        dbType: "postgresql",
        url: "jdbc:postgresql://host.docker.internal:5432/world-db",
        username: "world",
        password: "world123",
    });
    const [schema, setSchema] = useState<Schema | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [openTables, setOpenTables] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:8181/db/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data: ApiResponse = await response.json();
            if (response.ok) {
                setSchema(data.data);
                localStorage.setItem("dbSchema", JSON.stringify(data.data));
            } else {
                setError(data.message || "Connection failed");
            }
        } catch (err) {
            setError("Failed to connect to database");
        } finally {
            setLoading(false);
        }
    };

    const handleDescriptionChange = (
        tableName: string,
        columnName: string,
        description: string
    ) => {
        if (!schema) return;

        const updatedSchema = JSON.parse(JSON.stringify(schema)) as Schema;
        const table = updatedSchema.tables.find((t) => t.name === tableName);
        if (!table) return;

        const column = table.columns.find((c) => c.name === columnName);
        if (!column) return;

        column.description = description;
        setSchema(updatedSchema);
        localStorage.setItem("dbSchema", JSON.stringify(updatedSchema));
    };

    return (
        <div className="space-y-8 w-full max-w-4xl mx-auto p-4">
            <div className="flex space-x-6">
                <Card className="w-96 h=[200px] overflow-auto">
                    <CardHeader>
                        <CardTitle>Database Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Select
                                value={formData.dbType}
                                onValueChange={(value: string) =>
                                    setFormData({ ...formData, dbType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select database type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="postgresql">
                                        PostgreSQL
                                    </SelectItem>
                                    <SelectItem value="mysql">MySQL</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Connection URL"
                                value={formData.url}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                    setFormData({
                                        ...formData,
                                        url: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Username"
                                value={formData.username}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                    setFormData({
                                        ...formData,
                                        username: e.target.value,
                                    })
                                }
                            />

                            <Input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                            />

                            <Button type="submit" disabled={loading}>
                                {loading ? "Connecting..." : "Connect"}
                            </Button>

                            {error && (
                                <div className="text-red-500">{error}</div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {schema && (
                    <div className="flex-1">
                        <TableSchema schema={schema} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseForm;
