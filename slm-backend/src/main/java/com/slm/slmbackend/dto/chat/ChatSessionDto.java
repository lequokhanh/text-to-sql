package com.slm.slmbackend.dto.chat;

import java.util.List;

import com.slm.slmbackend.entity.ChatMessage;

import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class ChatSessionDto {
    private Integer id;
    private String conversationName;
    private List<ChatMessage> messages;
}
