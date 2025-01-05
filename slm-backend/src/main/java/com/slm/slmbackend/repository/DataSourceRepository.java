package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.ConversationDetail;
import com.slm.slmbackend.entity.DataSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DataSourceRepository extends JpaRepository<DataSource, Integer> {
}
