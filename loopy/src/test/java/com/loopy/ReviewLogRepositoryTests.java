package com.loopy;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

import com.loopy.model.Card;
import com.loopy.model.Deck;
import com.loopy.model.ReviewLog;
import com.loopy.model.StudySession;
import com.loopy.model.StudySessionCard;
import com.loopy.model.User;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.model.enumeration.ReviewGrade;
import com.loopy.model.enumeration.StudyCardType;
import com.loopy.model.enumeration.StudySessionCardStatus;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.CardRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.ReviewLogRepository;
import com.loopy.repository.StudySessionCardRepository;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserRepository;

@SpringBootTest
class ReviewLogRepositoryTests {

    @Autowired private UserRepository users;
    @Autowired private DeckRepository decks;
    @Autowired private CardRepository cards;
    @Autowired private StudySessionRepository sessions;
    @Autowired private StudySessionCardRepository sessionCards;
    @Autowired private ReviewLogRepository reviewLogs;

    @AfterEach
    void clean() {
        reviewLogs.deleteAll();
        sessionCards.deleteAll();
        sessions.deleteAll();
        cards.deleteAll();
        decks.deleteAll();
        users.deleteAll();
    }

    @Test
    void enforcesOneIdempotencyKeyPerUser() {
        User user = users.save(User.builder().name("User").email("review-log@example.com")
                .passwordHash("hash").build());
        Deck deck = decks.save(Deck.builder().owner(user).name("Deck").isPublic(false)
                .status(DeckStatus.ACTIVE).build());
        Card firstCard = cards.save(card(deck, "first"));
        Card secondCard = cards.save(card(deck, "second"));
        StudySession session = sessions.save(StudySession.builder().user(user).deck(deck)
                .status(StudySessionStatus.ACTIVE).startedAt(Instant.now()).totalCardsCount(2)
                .build());
        StudySessionCard first = sessionCards.save(sessionCard(session, firstCard, 1));
        StudySessionCard second = sessionCards.save(sessionCard(session, secondCard, 2));
        UUID key = UUID.randomUUID();

        reviewLogs.saveAndFlush(log(user, first, firstCard, key));

        assertThatThrownBy(() -> reviewLogs.saveAndFlush(log(user, second, secondCard, key)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Card card(Deck deck, String front) {
        return Card.builder().deck(deck).front(front).back("back").status(CardStatus.ACTIVE)
                .build();
    }

    private StudySessionCard sessionCard(StudySession session, Card card, int position) {
        return StudySessionCard.builder().session(session).card(card).position(position)
                .type(StudyCardType.NEW).status(StudySessionCardStatus.PENDING).build();
    }

    private ReviewLog log(User user, StudySessionCard sessionCard, Card card, UUID clientReviewId) {
        Instant now = Instant.parse("2026-07-29T10:31:00Z");
        return ReviewLog.builder().user(user).sessionCard(sessionCard).card(card)
                .grade(ReviewGrade.GOOD).sm2Score(4).clientReviewId(clientReviewId)
                .previousEaseFactor(2.5d).newEaseFactor(2.5d).previousIntervalDays(0)
                .newIntervalDays(1).previousConsecutiveCorrectCount(0)
                .newConsecutiveCorrectCount(1).nextReviewAt(now.plusSeconds(86_400L))
                .reviewedAt(now).build();
    }
}
