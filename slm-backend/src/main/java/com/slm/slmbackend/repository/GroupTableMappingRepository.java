package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.GroupTableMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupTableMappingRepository extends JpaRepository<GroupTableMapping, Integer> {
}
