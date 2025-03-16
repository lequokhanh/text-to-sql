package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.TableDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableDefinitionRepository extends JpaRepository<TableDefinition, Integer> {
}
