package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.DataSource;
import com.slm.slmbackend.entity.TableSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TableSchemaRepository extends JpaRepository<TableSchema, Integer> {
}
