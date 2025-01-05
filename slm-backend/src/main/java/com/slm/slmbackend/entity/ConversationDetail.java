package com.slm.slmbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ConversationDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String sqlCommand;
    private String data;

    @ManyToOne
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    public enum Role {
        BOT, USER
    }
}

