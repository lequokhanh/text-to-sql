package com.slm.slmbackend.service;

import com.slm.slmbackend.dto.chat.AskQuestionRequestDTO;
import com.slm.slmbackend.dto.chat.BotResponseDTO;
import com.slm.slmbackend.dto.datasource.ChatMessageDTO;
import com.slm.slmbackend.dto.datasource.ChatSessionDTO;
import com.slm.slmbackend.entity.UserAccount;

import java.util.List;


public interface ChatService {

    BotResponseDTO askQuestion(UserAccount user, AskQuestionRequestDTO request);

    List<ChatSessionDTO> getAllChatSessions(UserAccount user, Integer dataSourceId);

    List<ChatMessageDTO> getChatSessionMessages(UserAccount user, Integer sessionId);
} 