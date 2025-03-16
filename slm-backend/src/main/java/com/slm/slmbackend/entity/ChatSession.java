package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "chat_sessions")
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String conversationName;

    @ManyToOne
    @JoinColumn(name = "data_source")
    private DataSourceConfiguration dataSource;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "conversation_id")
    private List<ChatMessage> messages;
}
