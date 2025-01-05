package com.slm.slmbackend.repository;

import com.slm.slmbackend.entity.Conversation;
import com.slm.slmbackend.entity.ConversationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConversationDetailRepository extends JpaRepository<ConversationDetail, Integer> {
}
