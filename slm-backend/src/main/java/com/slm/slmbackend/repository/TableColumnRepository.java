package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.TableColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TableColumnRepository extends JpaRepository<TableColumn, Integer> {
}
