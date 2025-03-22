package com.slm.slmbackend.entity;

import com.slm.slmbackend.enums.RelationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

@Entity
@Getter
@Setter
@Table(name = "column_relations")
@Accessors(chain = true)
public class ColumnRelation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_source_id")
    private DataSourceConfiguration dataSource;

    @ManyToOne
    @JoinColumn(name = "from_column")
    private TableColumn fromColumn;

    @ManyToOne
    @JoinColumn(name = "to_column")
    private TableColumn toColumn;

    @Enumerated(EnumType.STRING)
    private RelationType type;
}
