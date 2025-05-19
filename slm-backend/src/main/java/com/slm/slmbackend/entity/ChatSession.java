package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Fetch;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_source")
    private DataSourceConfiguration dataSource;

    @ManyToOne
    @JoinColumn(name = "user")
    private UserAccount user;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private List<ChatMessage> messages;
}
