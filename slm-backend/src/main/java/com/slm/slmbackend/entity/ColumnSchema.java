package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"columnName", "table_schema_id"}))
public class ColumnSchema {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String columnName;
    private String dataType;
    private String description;

    private Boolean isPrimaryKey;

    @ManyToOne
    @JoinColumn(name = "table_schema_id")
    private TableSchema tableSchema;
}
