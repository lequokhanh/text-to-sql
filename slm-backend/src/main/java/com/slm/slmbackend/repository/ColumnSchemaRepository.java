package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.ColumnSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ColumnSchemaRepository extends JpaRepository<ColumnSchema, Integer> {
}
