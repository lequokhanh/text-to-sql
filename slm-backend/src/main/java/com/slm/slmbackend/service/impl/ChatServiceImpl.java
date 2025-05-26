package com.slm.slmbackend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slm.slmbackend.dto.chat.AskQuestionRequestDTO;
import com.slm.slmbackend.dto.chat.BotResponseDTO;
import com.slm.slmbackend.dto.datasource.ChatMessageDTO;
import com.slm.slmbackend.dto.datasource.ChatSessionDTO;
import com.slm.slmbackend.dto.datasource.DataSourceConfigurationDetailDTO;
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
import com.slm.slmbackend.service.DataSourceConfigurationService;
import com.slm.slmbackend.service.EmbedService;
import com.slm.slmbackend.service.EngineService;
import com.slm.slmbackend.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {
    private static final String URL_FORMAT = "%s:%s/%s";
    private static final String ENGINE_QUERY_ENDPOINT = "/query";
    private static final String EMBED_QUERY_ENDPOINT = "/api/v1/db/query";
    private static final String SUCCESS_CODE = "0";

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DataSourceConfigurationRepository dataSourceConfigurationRepository;
    private final EngineService engineService;
    private final EmbedService embedService;
    private final DataSourceConfigurationService dataSourceConfigurationService;
    private final ObjectMapper mapper;

    @Override
    public BotResponseDTO askQuestion(UserAccount user, AskQuestionRequestDTO request) {
        // Validate user and request
        if (user == null) {
            throw new AppException(ResponseEnum.UNAUTHORIZED);
        }

        if (request == null || request.getDataSourceId() == null) {
            throw new AppException(ResponseEnum.INVALID_REQUEST);
        }

        if (!StringUtils.hasText(request.getQuestion())) {
            throw new AppException(ResponseEnum.INVALID_REQUEST, "Question cannot be empty");
        }

        try {
            // Get or create chat session
            final ChatSession chatSession;
            if (request.getChatSessionId() != null) {
                chatSession = chatSessionRepository.findById(request.getChatSessionId())
                        .orElseThrow(() -> new AppException(ResponseEnum.CHAT_SESSION_NOT_FOUND));

                if (!Objects.equals(chatSession.getUser().getId(), user.getId())) {
                    throw new AppException(ResponseEnum.CHAT_SESSION_NOT_BELONG_TO_USER);
                }
            } else {
                ChatSession newSession = new ChatSession();
                newSession.setUser(user);
                newSession.setDataSource(dataSourceConfigurationRepository.findById(request.getDataSourceId())
                        .orElseThrow(() -> new AppException(ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND)));
                newSession.setMessages(new ArrayList<>());
                chatSession = chatSessionRepository.save(newSession);
            }

            // Get data source configuration
            DataSourceConfigurationDetailDTO dataSource = dataSourceConfigurationService.getDataSourceConfigurationById(user, request.getDataSourceId(), true);

            // Create user message
            ChatMessage userMessage = new ChatMessage();
            userMessage.setUserRole(UserRole.USER);
            userMessage.setMessage(request.getQuestion());
            userMessage.setChatSession(chatSession); // Add this line to set the session relationship

            // Create bot message
            ChatMessage botMessage = new ChatMessage();
            botMessage.setUserRole(UserRole.BOT);
            botMessage.setChatSession(chatSession); // Add this line to set the session relationship

            // Create response DTO
            BotResponseDTO responseDTO = new BotResponseDTO();
            responseDTO.setChatSessionId(chatSession.getId().toString());

            // Create connection payload
            Map<String, Object> connectionPayload = new HashMap<>();
            connectionPayload.put("url", String.format(URL_FORMAT, dataSource.getHost(), dataSource.getPort(), dataSource.getDatabaseName()));
            connectionPayload.put("username", dataSource.getUsername());
            connectionPayload.put("password", dataSource.getPassword());
            connectionPayload.put("dbType", dataSource.getDatabaseType().name().toLowerCase());

            Map<String, Object> schemaEnrichInfo = new HashMap<>();
            schemaEnrichInfo.put("database_description", dataSource.getDatabaseDescription());
            schemaEnrichInfo.put("enrich_schema", dataSource.getTableDefinitions());
            connectionPayload.put("schema_enrich_info", schemaEnrichInfo);

            // Create engine request
            Map<String, Object> engineRequest = new HashMap<>();
            engineRequest.put("query", request.getQuestion());
            engineRequest.put("connection_payload", connectionPayload);

            CompletableFuture<BotResponseDTO> future = new CompletableFuture<>();

            // Call engine service
            engineService.proxyRequest(ENGINE_QUERY_ENDPOINT, engineRequest)
                    .subscribe(
                            response -> {
                                try {
                                    log.debug("Engine service response received");
                                    JsonNode responseNode = mapper.readTree(response);
                                    String code = responseNode.get("code").asText();
                                    boolean isSuccess = SUCCESS_CODE.equals(code);
                                    String data = isSuccess && responseNode.has("data") ? responseNode.get("data").toString() : null;
                                    String errorMessage = !isSuccess && responseNode.has("message") ? responseNode.get("message").asText() : "Unknown error from service";

                                    if (!isSuccess) {
                                        future.completeExceptionally(
                                                new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, errorMessage));
                                        return;
                                    }

                                    String query = data.replace("\"", "").replace(";", " ");
                                    botMessage.setMessage(query);
                                    responseDTO.setSql(query);
                                    log.debug("Generated SQL query (length: {})", query.length());

                                    // Call embed service
                                    Map<String, String> queryRequest = new HashMap<>();
                                    queryRequest.put("url", String.format(URL_FORMAT, dataSource.getHost(), dataSource.getPort(), dataSource.getDatabaseName()));
                                    queryRequest.put("username", dataSource.getUsername());
                                    queryRequest.put("password", dataSource.getPassword());
                                    queryRequest.put("dbType", dataSource.getDatabaseType().name().toLowerCase());
                                    queryRequest.put("query", query);

                                    embedService.proxyRequest(EMBED_QUERY_ENDPOINT, queryRequest)
                                            .subscribe(
                                                    responseData -> {
                                                        try {
                                                            log.debug("Embed service response received");
                                                            JsonNode embedResponseNode = mapper.readTree(responseData);
                                                            String embedCode = embedResponseNode.get("code").asText();
                                                            boolean embedSuccess = SUCCESS_CODE.equals(embedCode);
                                                            String embedData = embedSuccess && embedResponseNode.has("data") ? embedResponseNode.get("data").toString() : null;
                                                            String embedErrorMessage = !embedSuccess && embedResponseNode.has("message") ? embedResponseNode.get("message").asText() : "Unknown error from service";

                                                            if (!embedSuccess) {
                                                                future.completeExceptionally(
                                                                        new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, embedErrorMessage));
                                                                return;
                                                            }

                                                            responseDTO.setData(embedData);
                                                            botMessage.setResponseData(embedData);

                                                            saveMessagesAndCompleteResponse(userMessage, botMessage, responseDTO, future);
                                                        } catch (Exception e) {
                                                            log.error("Error processing embed service response: {}", e.getMessage());
                                                            future.completeExceptionally(
                                                                    new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Error processing data response: " + e.getMessage()));
                                                        }
                                                    },
                                                    error -> {
                                                        log.error("Embed service call error: {}", error.getMessage());
                                                        future.completeExceptionally(
                                                                new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Embed service call failed: " + error.getMessage()));
                                                    }
                                            );
                                } catch (Exception e) {
                                    log.error("Error processing engine service response: {}", e.getMessage());
                                    future.completeExceptionally(
                                            new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Error processing engine response: " + e.getMessage()));
                                }
                            },
                            error -> {
                                log.error("Engine service call error: {}", error.getMessage());
                                future.completeExceptionally(
                                        new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Engine service call failed: " + error.getMessage()));
                            }
                    );

            return waitForFutureCompletion(future);

        } catch (AppException e) {
            log.error("Application error in askQuestion: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in askQuestion: {}", e.getMessage(), e);
            throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        }
    }

    // New helper method to centralize message saving and future completion
    private void saveMessagesAndCompleteResponse(ChatMessage userMessage, ChatMessage botMessage,
                                                 BotResponseDTO responseDTO,
                                                 CompletableFuture<BotResponseDTO> future) {
        try {
            // Save messages
            chatMessageRepository.save(userMessage);
            chatMessageRepository.save(botMessage);
            future.complete(responseDTO);
        } catch (Exception e) {
            log.error("Error saving chat messages: {}", e.getMessage());
            future.completeExceptionally(
                    new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Error saving chat messages: " + e.getMessage()));
        }
    }

    private BotResponseDTO waitForFutureCompletion(CompletableFuture<BotResponseDTO> future) {
        try {
            return future.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException(ResponseEnum.REQUEST_TIMEOUT, "Request was interrupted");
        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof AppException) {
                throw (AppException) cause;
            }
            throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Error processing request: " + e.getMessage());
        }
    }

    @Override
    public List<ChatSessionDTO> getAllChatSessions(UserAccount user, Integer dataSourceId) {
        if (user == null) {
            throw new AppException(ResponseEnum.UNAUTHORIZED);
        }

        if (dataSourceId == null) {
            throw new AppException(ResponseEnum.INVALID_REQUEST, "Data source ID cannot be null");
        }

        DataSourceConfiguration dataSource = dataSourceConfigurationRepository.findById(dataSourceId)
                .orElseThrow(() -> new AppException(ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND));

        if (dataSource.getOwners().stream().noneMatch(owner -> owner.getId().equals(user.getId()))
        && dataSource.getGroups().stream().noneMatch(group -> group.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId())))) {
            throw new AppException(ResponseEnum.DATA_SOURCE_NOT_BELONG_TO_USER);
        }

        return chatSessionRepository.findByUserAndDataSource(user, dataSource)
                .stream().map(
                        chatSession -> {
                            ChatSessionDTO chatSessionDTO = MapperUtil.mapObject(
                                    chatSession, ChatSessionDTO.class);
                            chatSessionDTO.setDataSourceId(
                                    chatSession.getDataSource() != null ? chatSession.getDataSource().getId() : null);
                            return chatSessionDTO;
                        }
                ).toList();
    }

    @Override
    public List<ChatMessageDTO> getChatSessionMessages(UserAccount user, Integer sessionId) {
        if (user == null) {
            throw new AppException(ResponseEnum.UNAUTHORIZED);
        }

        if (sessionId == null) {
            throw new AppException(ResponseEnum.INVALID_REQUEST, "Session ID cannot be null");
        }

        ChatSession chatSession = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ResponseEnum.CHAT_SESSION_NOT_FOUND));

        validateChatSessionOwnership(chatSession, user);

        return (chatSession.getMessages() != null
                ? chatSession.getMessages().stream()
                .map(message -> MapperUtil
                        .mapObject(message, ChatMessageDTO.class
                        )
                )
                .toList()
                : Collections.emptyList());

    }

    private void validateChatSessionOwnership(ChatSession chatSession, UserAccount user) {
        if (!Objects.equals(chatSession.getUser().getId(), user.getId())) {
            throw new AppException(ResponseEnum.CHAT_SESSION_NOT_BELONG_TO_USER);
        }
    }
}