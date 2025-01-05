package com.slm.slmbackend.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String conversationName;

    @ManyToOne
    @JoinColumn(name = "data_source")
    private DataSource dataSource;

    @OneToMany(mappedBy = "conversation")
    private List<ConversationDetail> conversationDetails;
}
