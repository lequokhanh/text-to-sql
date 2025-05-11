package com.slm.slmbackend.service;

import com.slm.slmbackend.dto.chat.AskQuestionRequestDTO;
import com.slm.slmbackend.dto.chat.BotResponseDTO;
import com.slm.slmbackend.entity.ChatSession;
import com.slm.slmbackend.entity.ChatMessage;
import com.slm.slmbackend.entity.UserAccount;

import java.util.List;


public interface ChatService {

    BotResponseDTO askQuestion(UserAccount user, AskQuestionRequestDTO request);

    List<ChatSession> getAllChatSessions(UserAccount user);

    List<ChatMessage> getChatSessionMessages(UserAccount user, Integer sessionId);
} 