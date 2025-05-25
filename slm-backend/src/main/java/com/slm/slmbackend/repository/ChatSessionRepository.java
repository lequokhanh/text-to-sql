package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.ChatSession;
import com.slm.slmbackend.entity.DataSourceConfiguration;
import com.slm.slmbackend.entity.UserAccount;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Integer> {
    List<ChatSession> findByUserAndDataSource(UserAccount user, DataSourceConfiguration dataSource);
}
