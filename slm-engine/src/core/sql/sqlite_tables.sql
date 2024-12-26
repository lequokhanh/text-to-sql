-- Get all table names and their column details
WITH tables AS (
    SELECT name AS table_name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
),
column_info AS (
    SELECT 
        t.table_name,
        p.name AS column_name,
        p.type AS data_type,
        p.pk AS is_primary_key,
        NULL AS foreign_key_reference -- Placeholder for FK
    FROM tables t, pragma_table_info(t.table_name) AS p
),
foreign_keys AS (
    SELECT 
        t.table_name,
        fk."from" AS column_name,
        fk."table" || '.' || fk."to" AS foreign_key_reference
    FROM tables t, pragma_foreign_key_list(t.table_name) AS fk
)
SELECT 
    ci.table_name,
    ci.column_name,
    ci.data_type,
    ci.is_primary_key,
    COALESCE(fk.foreign_key_reference, NULL) AS foreign_key_reference
FROM 
    column_info ci
LEFT JOIN 
    foreign_keys fk
ON 
    ci.table_name = fk.table_name AND ci.column_name = fk.column_name;
