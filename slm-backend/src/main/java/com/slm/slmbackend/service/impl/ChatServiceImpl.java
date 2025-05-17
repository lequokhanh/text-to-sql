package com.slm.slmbackend.service.impl;

import com.slm.slmbackend.dto.chat.AskQuestionRequestDTO;
import com.slm.slmbackend.dto.chat.BotResponseDTO;
import com.slm.slmbackend.entity.ChatMessage;
import com.slm.slmbackend.entity.ChatSession;
import com.slm.slmbackend.entity.DataSourceConfiguration;
import com.slm.slmbackend.entity.UserAccount;
import com.slm.slmbackend.enums.ResponseEnum;
import com.slm.slmbackend.enums.UserRole;
import com.slm.slmbackend.exception.AppException;
import com.slm.slmbackend.repository.ChatMessageRepository;
import com.slm.slmbackend.repository.ChatSessionRepository;
import com.slm.slmbackend.repository.DataSourceConfigurationRepository;
import com.slm.slmbackend.service.ChatService;
import com.slm.slmbackend.service.EmbedService;
import com.slm.slmbackend.service.EngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DataSourceConfigurationRepository dataSourceConfigurationRepository;
    private final EngineService engineService;
    private final EmbedService embedService;
    @Override
    @Transactional
    public BotResponseDTO askQuestion(UserAccount user, AskQuestionRequestDTO request) {
        // Get or create chat session
        ChatSession chatSession;
        if (request.getChatSessionId() != null) {
            chatSession = chatSessionRepository.findById(request.getChatSessionId())
                    .orElseThrow(() -> new AppException(ResponseEnum.CHAT_SESSION_NOT_FOUND));
            
            // Validate user owns the chat session
            if (!chatSession.getUser().getId().equals(user.getId())) {
                throw new AppException(ResponseEnum.CHAT_SESSION_NOT_BELONG_TO_USER);
            }
        } else {
            // create new chat session
            chatSession = new ChatSession();
            chatSession.setUser(user);
            chatSession.setDataSource(dataSourceConfigurationRepository.findById(request.getDataSourceId())
                    .orElseThrow(() -> new AppException(ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND)));
        }

        // Get data source
        DataSourceConfiguration dataSource = dataSourceConfigurationRepository.findById(request.getDataSourceId())
                .orElseThrow(() -> new AppException(ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND));

        // Validate user has access to the data source
        if (!dataSource.getOwners().contains(user)) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER);
        }

        // Create and save user message
        ChatMessage userMessage = new ChatMessage();
        userMessage.setUserRole(UserRole.USER);
        userMessage.setMessage(request.getQuestion());
        userMessage = chatMessageRepository.save(userMessage);
        chatSession.getMessages().add(userMessage);
        chatSessionRepository.save(chatSession);

        // Prepare request for engine service
        Map<String, Object> engineRequest = new HashMap<>();
        engineRequest.put("question", request.getQuestion());
        engineRequest.put("dataSource", dataSource);

        // Call engine service and handle response
        Mono<String> responseMono = engineService.proxyRequest("/query", engineRequest);
        
        // Create and save bot response
        ChatMessage botMessage = new ChatMessage();
        botMessage.setUserRole(UserRole.BOT);
        
        final ChatMessage finalBotMessage = botMessage;
        BotResponseDTO botResponseDTO = new BotResponseDTO();
        responseMono.subscribe(response -> {
            finalBotMessage.setMessage(response);

            Map<String, String> connectionRequest = new HashMap<>();

            connectionRequest.put("url", String.format("%s:%s/%s",
                    dataSource.getHost(),
                    dataSource.getPort(),
                    dataSource.getDatabaseName()));
            connectionRequest.put("username", dataSource.getUsername());
            connectionRequest.put("password", dataSource.getPassword());
            connectionRequest.put("type", dataSource.getDatabaseType().name().toLowerCase());
            connectionRequest.put("query", response);

            String responseData = embedService.proxyRequest("/api/v1/db/query", connectionRequest)
                    .doOnError(error -> {
                        throw new AppException(ResponseEnum.DATASOURCE_CONNECT_FAILED);
                    })
                    .block();
            // get responseData.data
            ObjectMapper mapper = new ObjectMapper();
            try {
                JsonNode jsonNode = mapper.readTree(responseData);
                finalBotMessage.setResponseData(jsonNode.get("data").toString());

                ChatMessage savedBotMessage = chatMessageRepository.save(finalBotMessage);
                chatSession.getMessages().add(savedBotMessage);
            } catch (JsonProcessingException e) {
                throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR.getCode(), e.getMessage());
            }

            botResponseDTO.setChatSessionId(chatSession.getId().toString());
            botResponseDTO.setSql(finalBotMessage.getMessage());
            botResponseDTO.setData(finalBotMessage.getResponseData());
            
            // Update chat session name if it's the first message
            if (chatSession.getMessages() == null || chatSession.getMessages().isEmpty()) {
                String sessionName = request.getQuestion().length() > 50 
                    ? request.getQuestion().substring(0, 47) + "..."
                    : request.getQuestion();
                chatSession.setConversationName(sessionName);
                chatSessionRepository.save(chatSession);
            }
        });

        return botResponseDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatSession> getAllChatSessions(UserAccount user) {
        return chatSessionRepository.findByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessage> getChatSessionMessages(UserAccount user, Integer sessionId) {
        ChatSession chatSession = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ResponseEnum.CHAT_SESSION_NOT_FOUND));
        
        // Validate user owns the chat session
        if (!chatSession.getUser().equals(user)) {
            throw new AppException(ResponseEnum.CHAT_SESSION_NOT_BELONG_TO_USER);
        }
        
        return chatSession.getMessages();
    }
} 