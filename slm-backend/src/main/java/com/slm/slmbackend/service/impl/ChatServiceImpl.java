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

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {
    private static final String URL_FORMAT = "%s:%s/%s";
    private static final String ENGINE_QUERY_ENDPOINT = "/query";
    private static final String EMBED_QUERY_ENDPOINT = "/api/v1/db/query";
    private static final String ENGINE_SUGGESTIONS_ENDPOINT = "/suggest-questions";
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
                newSession.setConversationName(request.getQuestion());
                newSession.setUser(user);
                newSession.setDataSource(dataSourceConfigurationRepository.findById(request.getDataSourceId())
                        .orElseThrow(() -> new AppException(ResponseEnum.DATA_SOURCE_CONFIGURATION_NOT_FOUND)));
                newSession.setMessages(new ArrayList<>());
                chatSession = chatSessionRepository.save(newSession);
            }

            // Get data source configuration
            DataSourceConfigurationDetailDTO dataSource = dataSourceConfigurationService
                    .getDataSourceConfigurationById(user, request.getDataSourceId(), true);

            // Create user message
            ChatMessage userMessage = new ChatMessage();
            userMessage.setUserRole(UserRole.USER);
            userMessage.setMessage(request.getQuestion());
            userMessage.setChatSession(chatSession);

            // Create bot message
            ChatMessage botMessage = new ChatMessage();
            botMessage.setUserRole(UserRole.BOT);
            botMessage.setChatSession(chatSession);

            // Create response DTO
            BotResponseDTO responseDTO = new BotResponseDTO();
            responseDTO.setChatSessionId(chatSession.getId().toString());

            // Create connection payload
            Map<String, Object> connectionPayload = new HashMap<>();
            connectionPayload.put("url", String.format(URL_FORMAT, dataSource.getHost(), dataSource.getPort(),
                    dataSource.getDatabaseName()));
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

            // Call engine service synchronously
            String engineResponse = engineService.sendSynchronousRequest(ENGINE_QUERY_ENDPOINT, engineRequest);
            JsonNode responseNode = mapper.readTree(engineResponse);
            String code = responseNode.get("code").asText();
            boolean isSuccess = SUCCESS_CODE.equals(code);
            String data = isSuccess && responseNode.has("data") ? responseNode.get("data").toString() : null;
            String errorMessage = !isSuccess && responseNode.has("message") ? responseNode.get("message").asText()
                    : "Unknown error from service";

            if (!isSuccess) {
                throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, errorMessage);
            }

            @SuppressWarnings("null")
            String query = data.replace("\"", "").replace(";", " ");
            botMessage.setMessage(query);
            responseDTO.setSql(query);
            log.debug("Generated SQL query (length: {})", query.length());

            // Call embed service synchronously
            Map<String, String> queryRequest = new HashMap<>();
            queryRequest.put("url", String.format(URL_FORMAT, dataSource.getHost(), dataSource.getPort(),
                    dataSource.getDatabaseName()));
            queryRequest.put("username", dataSource.getUsername());
            queryRequest.put("password", dataSource.getPassword());
            queryRequest.put("dbType", dataSource.getDatabaseType().name().toLowerCase());
            queryRequest.put("query", query);

            String embedResponse = embedService.sendSynchronousRequest(EMBED_QUERY_ENDPOINT, queryRequest);
            JsonNode embedResponseNode = mapper.readTree(embedResponse);
            String embedCode = embedResponseNode.get("code").asText();
            boolean embedSuccess = SUCCESS_CODE.equals(embedCode);
            String embedData = embedSuccess && embedResponseNode.has("data") ? embedResponseNode.get("data").toString()
                    : null;
            String embedErrorMessage = !embedSuccess && embedResponseNode.has("message")
                    ? embedResponseNode.get("message").asText()
                    : "Unknown error from service";

            if (!embedSuccess) {
                throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, embedErrorMessage);
            }

            responseDTO.setData(embedData);
            botMessage.setResponseData(embedData);

            // Save messages
            chatMessageRepository.save(userMessage);
            chatMessageRepository.save(botMessage);

            return responseDTO;

        } catch (AppException e) {
            log.error("Application error in askQuestion: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in askQuestion: {}", e.getMessage(), e);
            throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
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
                && dataSource.getGroups().stream().noneMatch(
                        group -> group.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId())))) {
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
                        })
                .toList();
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
                                .mapObject(message, ChatMessageDTO.class))
                        .toList()
                : Collections.emptyList());

    }

    private void validateChatSessionOwnership(ChatSession chatSession, UserAccount user) {
        if (!Objects.equals(chatSession.getUser().getId(), user.getId())) {
            throw new AppException(ResponseEnum.CHAT_SESSION_NOT_BELONG_TO_USER);
        }
    }

    @Override
    public List<String> getSuggestions(UserAccount user, Integer dataSourceId) {
        try {
            DataSourceConfigurationDetailDTO dataSource = dataSourceConfigurationService
                    .getDataSourceConfigurationById(user, dataSourceId, false);
            Map<String, Object> request = new HashMap<>();
            request.put("tables", dataSource.getTableDefinitions().stream().limit(4).toList());
            request.put("top_k", 4);

            String response = engineService.sendSynchronousRequest(ENGINE_SUGGESTIONS_ENDPOINT, request);
            JsonNode responseNode = mapper.readTree(response);
            String code = responseNode.get("code").asText();
            boolean isSuccess = SUCCESS_CODE.equals(code);
            if (!isSuccess) {
                throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR,
                        "Error getting suggestions: " + responseNode.get("message").asText());
            }

            List<String> suggestions = new ArrayList<>();
            JsonNode suggestionsNode = responseNode.get("data").get("suggestions");
            for (JsonNode suggestion : suggestionsNode) {
                suggestions.add(suggestion.get("question").asText());
            }
            return suggestions;
        } catch (Exception e) {
            log.error("Error getting suggestions: {}", e.getMessage());
            throw new AppException(ResponseEnum.INTERNAL_SERVER_ERROR, "Error getting suggestions: " + e.getMessage());
        }
    }
}