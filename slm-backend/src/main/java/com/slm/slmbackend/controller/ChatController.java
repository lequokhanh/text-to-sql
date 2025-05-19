package com.slm.slmbackend.controller;

import com.slm.slmbackend.dto.chat.AskQuestionRequestDTO;
import com.slm.slmbackend.dto.chat.BotResponseDTO;
import com.slm.slmbackend.dto.datasource.ChatMessageDTO;
import com.slm.slmbackend.dto.datasource.ChatSessionDTO;
import com.slm.slmbackend.entity.UserAccount;
import com.slm.slmbackend.response.ResponseWrapper;
import com.slm.slmbackend.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "API for managing chat sessions and messages")
public class ChatController {
    private final ChatService chatService;

    private UserAccount getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (UserAccount) authentication.getPrincipal();
    }

    @Operation(summary = "Ask a question in chat", 
               description = "Sends a question to the chat and gets a response")
    @ApiResponse(responseCode = "200", description = "Question processed successfully")
    @PostMapping("/ask")
    public ResponseWrapper<BotResponseDTO> askQuestion(@Valid @RequestBody AskQuestionRequestDTO request) {
        return ResponseWrapper.success(chatService.askQuestion(getAuthenticatedUser(), request));
    }

    @Operation(summary = "Get all chat sessions", 
               description = "Retrieves all chat sessions for the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of chat sessions retrieved successfully")
    @GetMapping("/sessions")
    public ResponseWrapper<List<ChatSessionDTO>> getAllChatSessions() {
        return ResponseWrapper.success(chatService.getAllChatSessions(getAuthenticatedUser()));
    }

    @Operation(summary = "Get chat session messages", 
               description = "Retrieves all messages for a specific chat session")
    @ApiResponse(responseCode = "200", description = "List of messages retrieved successfully")
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseWrapper<List<ChatMessageDTO>> getChatSessionMessages(
            @Parameter(description = "ID of the chat session") @PathVariable Integer sessionId) {
        return ResponseWrapper.success(chatService.getChatSessionMessages(getAuthenticatedUser(), sessionId));
    }
} 