package com.slm.slmbackend.entity;

import com.slm.slmbackend.enums.DatabaseType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "data_source_configurations")
@Accessors(chain = true)
public class DataSourceConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private DatabaseType databaseType;
    private String name;

    private String host;
    private Integer port;
    private String databaseName;
    private String username;
    private String password;
    private String databaseDescription;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.MERGE, CascadeType.REFRESH})
    @JoinTable(
            name = "data_source_owners",
            joinColumns = @JoinColumn(name = "data_source_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    private List<UserAccount> owners;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "data_source_id")
    private List<UserGroup> groups;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "data_source_id")
    private List<TableDefinition> tableDefinitions = new ArrayList<>();
}


