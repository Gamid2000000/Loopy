package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

import com.loopy.model.Card;
import com.loopy.model.Deck;
import com.loopy.model.StudySession;
import com.loopy.model.StudySessionCard;
import com.loopy.model.User;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.model.enumeration.StudyCardType;
import com.loopy.model.enumeration.StudySessionCardStatus;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.CardRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.StudySessionCardRepository;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserRepository;

@SpringBootTest
class StudySessionRepositoryTests {

    @Autowired private UserRepository users;
    @Autowired private DeckRepository decks;
    @Autowired private CardRepository cards;
    @Autowired private StudySessionRepository sessions;
    @Autowired private StudySessionCardRepository sessionCards;

    @AfterEach
    void clean() {
        sessionCards.deleteAll();
        sessions.deleteAll();
        cards.deleteAll();
        decks.deleteAll();
        users.deleteAll();
    }

    @Test
    void findsOnlyActiveSessionForItsOwnerAndDeck() {
        User owner = user("owner@example.com");
        User other = user("other@example.com");
        Deck deck = deck(owner);
        StudySession active = session(owner, deck, StudySessionStatus.ACTIVE);
        StudySession cancelled = session(owner, deck, StudySessionStatus.CANCELLED);

        assertThat(sessions.findByUserIdAndDeckIdAndStatus(owner.getId(), deck.getId(),
                StudySessionStatus.ACTIVE)).map(StudySession::getId).contains(active.getId());
        assertThat(sessions.findByIdAndUserId(active.getId(), other.getId())).isEmpty();
        assertThat(sessions.findByUserIdAndDeckIdAndStatus(owner.getId(), deck.getId(),
                StudySessionStatus.CANCELLED)).map(StudySession::getId).contains(cancelled.getId());
    }

    @Test
    void returnsFirstPendingCardByPositionAndEnforcesQueueUniqueness() {
        User owner = user("owner@example.com");
        Deck deck = deck(owner);
        StudySession session = session(owner, deck, StudySessionStatus.ACTIVE);
        Card first = card(deck);
        Card second = card(deck);
        Card third = card(deck);
        StudySessionCard reviewed = item(session, first, 1, StudySessionCardStatus.REVIEWED);
        StudySessionCard skipped = item(session, second, 2, StudySessionCardStatus.SKIPPED);
        StudySessionCard pending = item(session, third, 3, StudySessionCardStatus.PENDING);
        sessionCards.saveAndFlush(reviewed);
        sessionCards.saveAndFlush(skipped);
        sessionCards.saveAndFlush(pending);

        assertThat(sessionCards.findFirstBySessionIdAndStatusOrderByPositionAsc(session.getId(),
                StudySessionCardStatus.PENDING)).map(StudySessionCard::getId).contains(pending.getId());
        assertThatThrownBy(() -> sessionCards.saveAndFlush(item(session, first, 4,
                StudySessionCardStatus.PENDING))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> sessionCards.saveAndFlush(item(session, card(deck), 3,
                StudySessionCardStatus.PENDING))).isInstanceOf(DataIntegrityViolationException.class);
    }

    private User user(String email) {
        return users.save(User.builder().name("User").email(email).passwordHash("hash").build());
    }

    private Deck deck(User owner) {
        return decks.save(Deck.builder().owner(owner).name("Deck").isPublic(false)
                .status(DeckStatus.ACTIVE).build());
    }

    private Card card(Deck deck) {
        return cards.save(Card.builder().deck(deck).front("front " + cards.count()).back("back")
                .status(CardStatus.ACTIVE).build());
    }

    private StudySession session(User user, Deck deck, StudySessionStatus status) {
        return sessions.save(StudySession.builder().user(user).deck(deck).status(status)
                .startedAt(Instant.parse("2026-07-29T12:00:00Z")).reviewCardsCount(0)
                .newCardsCount(0).totalCardsCount(0).build());
    }

    private StudySessionCard item(StudySession session, Card card, int position,
            StudySessionCardStatus status) {
        return StudySessionCard.builder().session(session).card(card).position(position)
                .type(StudyCardType.NEW).status(status).build();
    }
}
