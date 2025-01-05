package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"tableName", "data_source_id"}))
public class TableSchema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tableName;

    @ManyToOne
    @JoinColumn(name = "data_source_id")
    private DataSource dataSource;

    @OneToMany(mappedBy = "tableSchema")
    private List<ColumnSchema> columnSchemas;


}
