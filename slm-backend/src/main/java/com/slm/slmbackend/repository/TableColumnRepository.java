package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.TableColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableColumnRepository extends JpaRepository<TableColumn, Integer> {
}
