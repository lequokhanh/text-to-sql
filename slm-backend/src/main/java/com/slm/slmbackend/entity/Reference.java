package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"from_column", "to_column"}))
public class Reference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "data_source_id")
    private DataSource dataSource;

    @OneToOne
    @JoinColumn(name = "from_column")
    private ColumnSchema fromColumnSchema;

    @ManyToOne
    @JoinColumn(name = "to_column")
    private ColumnSchema toColumnSchema;

    @Enumerated(EnumType.STRING)
    private ReferenceType type;

    public enum ReferenceType {
        OTM, MTO
    }
}