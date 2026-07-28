package com.loopy.model;

import java.time.Instant;

import com.loopy.model.enumeration.DeckStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "decks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeckStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    private Deck(User owner, String name, String description, boolean isPublic) {
        this.owner = owner;
        this.name = name;
        this.description = description;
        this.isPublic = isPublic;
        this.status = DeckStatus.ACTIVE;
    }

    public static Deck create(User owner, String name, String description, boolean isPublic) {
        return new Deck(owner, name, description, isPublic);
    }

    public void changeName(String name) { this.name = name; }

    public void changeDescription(String description) { this.description = description; }

    public void changePublic(boolean isPublic) { this.isPublic = isPublic; }

    public void archive() { this.status = DeckStatus.ARCHIVED; }

    public void restore() { this.status = DeckStatus.ACTIVE; }

    @PrePersist
    void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }
}
