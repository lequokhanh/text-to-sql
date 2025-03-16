package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.IdCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface IdCounterRepository extends JpaRepository<IdCounter, String> {
    @Modifying
    @Query("UPDATE IdCounter i SET i.currentId = i.currentId + :increment WHERE i.entityName = :entityName")
    @Transactional
    void incrementId(@Param("entityName") String entityName, @Param("increment") Long increment);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i.currentId FROM IdCounter i WHERE i.entityName = :entityName")
    Optional<Long> getCurrentId(@Param("entityName") String entityName);
}