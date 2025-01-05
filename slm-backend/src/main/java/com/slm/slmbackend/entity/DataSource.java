package com.slm.slmbackend.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class DataSource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private DatabaseType databaseType;

    @Column(nullable = false)
    private String host;

    @Column(nullable = false)
    private Integer port;

    @Column(nullable = false)
    private String databaseName;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @OneToMany(mappedBy = "dataSource")
    private List<TableSchema> tableSchemas;

    @OneToMany(mappedBy = "dataSource")
    private List<Reference> references;

    @OneToMany(mappedBy = "dataSource")
    private List<Conversation> conversations;

    public enum DatabaseType {
        POSTGRESQL,
        MYSQL
    }
}
