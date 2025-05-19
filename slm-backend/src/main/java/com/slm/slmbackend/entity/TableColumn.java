package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "table_columns")
public class TableColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String columnIdentifier;
    private String columnType;
    private String columnDescription;
    private Boolean isPrimaryKey;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "from_column")
    private List<ColumnRelation> outgoingRelations;
}
