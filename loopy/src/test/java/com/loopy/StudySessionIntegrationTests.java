package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.persistence.EntityManager;

import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.Deck;
import com.loopy.model.StudySession;
import com.loopy.model.StudySessionCard;
import com.loopy.model.User;
import com.loopy.model.UserProfile;
import com.loopy.model.enumeration.StudySessionCardStatus;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.model.enumeration.StudySessionStatus;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.StudySessionCardRepository;
import com.loopy.repository.StudySessionRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.repository.UserRepository;
import com.loopy.repository.ReviewLogRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Import(StudySessionIntegrationTests.FixedClockConfiguration.class)
class StudySessionIntegrationTests {

    private static final Instant NOW = Instant.parse("2026-07-29T15:30:00Z");

    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private UserProfileRepository profiles;
    @Autowired private DeckRepository decks;
    @Autowired private CardRepository cards;
    @Autowired private CardReviewStateRepository states;
    @Autowired private StudySessionRepository sessions;
    @Autowired private StudySessionCardRepository sessionCards;
    @Autowired private ReviewLogRepository reviewLogs;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    @AfterEach
    void clean() {
        reviewLogs.deleteAll();
        sessionCards.deleteAll();
        sessions.deleteAll();
        states.deleteAll();
        cards.deleteAll();
        decks.deleteAll();
        profiles.deleteAll();
        users.deleteAll();
    }

    @Test
    void createsStableOrderedQueueWithSnapshotsAndContract() throws Exception {
        String token = register("owner@example.com");
        User owner = users.findByEmail("owner@example.com").orElseThrow();
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card review = card(deck, "review");
        Card fresh = card(deck, "fresh");
        state(owner, review, NOW, NOW.minusSeconds(1), 1);
        state(owner, fresh, null, null, 0);

        long sessionId = create(token, deck.getId());
        List<StudySessionCard> queue = sessionCards.findAll();

        assertThat(queue).hasSize(2);
        assertThat(queue).extracting(StudySessionCard::getPosition).containsExactly(1, 2);
        assertThat(queue).extracting(item -> item.getCard().getId()).containsExactly(review.getId(), fresh.getId());
        assertThat(queue).extracting(StudySessionCard::getDueAtSnapshot).containsExactly(NOW, null);
        StudySession session = sessions.findById(sessionId).orElseThrow();
        assertThat(session.getStartedAt()).isEqualTo(NOW);
        assertThat(session.getReviewCardsCount()).isEqualTo(1);
        assertThat(session.getNewCardsCount()).isEqualTo(1);
        assertThat(session.getTotalCardsCount()).isEqualTo(2);
        mvc.perform(get("/study-sessions/{id}", sessionId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").doesNotExist())
                .andExpect(jsonPath("$.currentPosition").value(1));
        mvc.perform(get("/study-sessions/{id}/current-card", sessionId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cardId").value(review.getId()));
    }

    @Test
    void rejectsNoCardsForeignAndArchivedDecksAndUnauthenticatedRequests() throws Exception {
        String ownerToken = register("owner@example.com");
        String otherToken = register("other@example.com");
        User owner = users.findByEmail("owner@example.com").orElseThrow();
        Deck empty = deck(owner, DeckStatus.ACTIVE);
        Deck archived = deck(owner, DeckStatus.ARCHIVED);

        mvc.perform(post("/study-sessions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"deckId\":" + empty.getId() + "}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + empty.getId() + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NO_CARDS_AVAILABLE"));
        assertThat(sessions.count()).isZero();
        mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + empty.getId() + "}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("DECK_NOT_FOUND"));
        mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + archived.getId() + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DECK_STATE_CONFLICT"));
    }

    @Test
    void activeSessionEndpointsAreOwnerIsolatedAndCancellationKeepsQueue() throws Exception {
        String ownerToken = register("owner@example.com");
        String otherToken = register("other@example.com");
        User owner = users.findByEmail("owner@example.com").orElseThrow();
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card card = card(deck, "fresh");
        state(owner, card, null, null, 0);
        long sessionId = create(ownerToken, deck.getId());

        mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + deck.getId() + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("STUDY_SESSION_ALREADY_ACTIVE"));
        mvc.perform(get("/study-sessions/active").header("Authorization", "Bearer " + ownerToken)
                .param("deckId", String.valueOf(deck.getId()))).andExpect(status().isOk());
        mvc.perform(get("/study-sessions/{id}", sessionId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("STUDY_SESSION_NOT_FOUND"));
        mvc.perform(get("/study-sessions/{id}/current-card", sessionId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(post("/study-sessions/{id}/cancel", sessionId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(post("/study-sessions/{id}/cancel", sessionId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
        assertThat(sessions.findById(sessionId).orElseThrow().getCancelledAt()).isEqualTo(NOW);
        assertThat(sessionCards.count()).isEqualTo(1);
        mvc.perform(post("/study-sessions/{id}/cancel", sessionId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("STUDY_SESSION_ALREADY_CANCELLED"));
        mvc.perform(get("/study-sessions/{id}/current-card", sessionId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("STUDY_SESSION_NOT_ACTIVE"));
        mvc.perform(get("/study-sessions/active").header("Authorization", "Bearer " + ownerToken)
                .param("deckId", String.valueOf(deck.getId()))).andExpect(status().isNotFound());
        assertThat(create(ownerToken, deck.getId())).isPositive();
    }

    @Test
    void queueDoesNotChangeWhenCardStateAndDeckChangeAfterCreation() throws Exception {
        String token = register("owner@example.com");
        User owner = users.findByEmail("owner@example.com").orElseThrow();
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card original = card(deck, "original");
        CardReviewState originalState = state(owner, original, NOW, NOW.minusSeconds(1), 1);
        long sessionId = create(token, deck.getId());
        Card added = card(deck, "added");
        state(owner, added, NOW, NOW.minusSeconds(1), 1);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> entityManager
                .createNativeQuery("update card_review_states set due_at = ? where id = ?")
                .setParameter(1, NOW.plusSeconds(3600)).setParameter(2, originalState.getId())
                .executeUpdate());
        original.setStatus(CardStatus.ARCHIVED);
        cards.saveAndFlush(original);

        mvc.perform(get("/study-sessions/{id}", sessionId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalCardsCount").value(1));
        mvc.perform(get("/study-sessions/{id}/current-card", sessionId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cardId").value(original.getId()));
        assertThat(sessionCards.findAll()).hasSize(1);
        assertThat(sessionCards.findAll().getFirst().getPosition()).isEqualTo(1);
    }

    @Test
    void dailyLimitsIncludeCompletedAndExcludeCancelledWithoutGoingNegative() throws Exception {
        String token = register("owner@example.com");
        User owner = users.findByEmail("owner@example.com").orElseThrow();
        profile(owner, "UTC", 1, 1);
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card review = card(deck, "review");
        Card fresh = card(deck, "fresh");
        state(owner, review, NOW, NOW.minusSeconds(1), 1);
        state(owner, fresh, null, null, 0);
        session(owner, deck, StudySessionStatus.COMPLETED, 1, 1, NOW.minusSeconds(1));
        session(owner, deck, StudySessionStatus.CANCELLED, 99, 99, NOW.minusSeconds(1));

        mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + deck.getId() + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NO_CARDS_AVAILABLE"));
        assertThat(sessions.count()).isEqualTo(2);
    }

    @Test
    void timezoneChangesTheDailyWindowAtUtcMidnightBoundary() throws Exception {
        String utcToken = register("utc@example.com");
        String tokyoToken = register("tokyo@example.com");
        User utc = users.findByEmail("utc@example.com").orElseThrow();
        User tokyo = users.findByEmail("tokyo@example.com").orElseThrow();
        profile(utc, "UTC", 1, 100);
        profile(tokyo, "Asia/Tokyo", 1, 100);
        Deck utcDeck = deck(utc, DeckStatus.ACTIVE);
        Deck tokyoDeck = deck(tokyo, DeckStatus.ACTIVE);
        state(utc, card(utcDeck, "utc"), null, null, 0);
        state(tokyo, card(tokyoDeck, "tokyo"), null, null, 0);
        session(utc, utcDeck, StudySessionStatus.COMPLETED, 0, 1, Instant.parse("2026-07-29T14:00:00Z"));
        session(tokyo, tokyoDeck, StudySessionStatus.COMPLETED, 0, 1, Instant.parse("2026-07-29T14:00:00Z"));

        assertThat(create(tokyoToken, tokyoDeck.getId())).isPositive();
        mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + utcToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + utcDeck.getId() + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NO_CARDS_AVAILABLE"));
    }

    @Test
    void submitsReviewIdempotentlyAndCompletesSessionAfterLastCard() throws Exception {
        String token = register("owner@example.com");
        User owner = users.findByEmail("owner@example.com").orElseThrow();
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card review = card(deck, "review");
        Card fresh = card(deck, "fresh");
        CardReviewState reviewState = state(owner, review, NOW, NOW.minusSeconds(1), 2);
        reviewState.setIntervalDays(6);
        states.saveAndFlush(reviewState);
        state(owner, fresh, null, null, 0);
        long sessionId = create(token, deck.getId());
        List<StudySessionCard> queue = sessionCards.findAll();
        StudySessionCard first = queue.stream().filter(item -> item.getPosition() == 1).findFirst()
                .orElseThrow();
        StudySessionCard second = queue.stream().filter(item -> item.getPosition() == 2).findFirst()
                .orElseThrow();
        String reviewId = "dbcd89d1-e9bd-49e7-ab8d-e57348dc09c1";

        mvc.perform(post("/study-sessions/{id}/reviews", sessionId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewBody(first.getId(), "GOOD", reviewId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review.sm2Score").value(4))
                .andExpect(jsonPath("$.review.newIntervalDays").value(15))
                .andExpect(jsonPath("$.session.status").value("ACTIVE"))
                .andExpect(jsonPath("$.session.reviewedCardsCount").value(1))
                .andExpect(jsonPath("$.nextCard.sessionCardId").value(second.getId()));
        assertThat(reviewLogs.count()).isEqualTo(1);
        assertThat(states.findById(reviewState.getId()).orElseThrow().getIntervalDays()).isEqualTo(15);
        assertThat(sessionCards.findById(first.getId()).orElseThrow().getStatus())
                .isEqualTo(StudySessionCardStatus.REVIEWED);

        mvc.perform(post("/study-sessions/{id}/reviews", sessionId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewBody(first.getId(), "GOOD", reviewId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.session.reviewedCardsCount").value(1));
        assertThat(reviewLogs.count()).isEqualTo(1);

        mvc.perform(post("/study-sessions/{id}/reviews", sessionId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewBody(first.getId(), "EASY", reviewId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REVIEW_IDEMPOTENCY_CONFLICT"));

        mvc.perform(post("/study-sessions/{id}/reviews", sessionId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reviewBody(second.getId(), "EASY", "0b2f1aec-5cf2-4e9e-9c1c-14db9e8a2f83")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.session.status").value("COMPLETED"))
                .andExpect(jsonPath("$.session.remainingCardsCount").value(0))
                .andExpect(jsonPath("$.nextCard").doesNotExist());
        StudySession completed = sessions.findById(sessionId).orElseThrow();
        assertThat(completed.getCompletedAt()).isEqualTo(NOW);
        assertThat(completed.getCompletedCardsCount()).isEqualTo(2);
    }

    private long create(String token, long deckId) throws Exception {
        String body = mvc.perform(post("/study-sessions").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"deckId\":" + deckId + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceFirst(".*\\\"id\\\":(\\d+).*", "$1"));
    }

    private String reviewBody(long sessionCardId, String grade, String clientReviewId) {
        return "{\"sessionCardId\":" + sessionCardId + ",\"grade\":\"" + grade
                + "\",\"responseTimeMs\":4200,\"clientReviewId\":\"" + clientReviewId
                + "\"}";
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"A\",\"email\":\"" + email + "\",\"password\":\"password1\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }

    private Deck deck(User owner, DeckStatus status) {
        return decks.save(Deck.builder().owner(owner).name("Deck " + decks.count()).isPublic(false)
                .status(status).build());
    }

    private Card card(Deck deck, String front) {
        return cards.save(Card.builder().deck(deck).front(front).back("back").status(CardStatus.ACTIVE).build());
    }

    private CardReviewState state(User user, Card card, Instant dueAt, Instant lastReviewedAt, int correct) {
        return states.save(CardReviewState.builder().user(user).card(card).easinessFactor(2.5d)
                .intervalDays(0).consecutiveCorrectCount(correct).lastReviewedAt(lastReviewedAt).dueAt(dueAt).build());
    }

    private void profile(User user, String timezone, int newLimit, int reviewLimit) {
        UserProfile profile = profiles.findByUserId(user.getId()).orElseThrow();
        profile.setTimezone(timezone);
        profile.setDailyNewCardsLimit(newLimit);
        profile.setDailyReviewLimit(reviewLimit);
        profiles.saveAndFlush(profile);
    }

    private void session(User user, Deck deck, StudySessionStatus status, int review, int fresh, Instant startedAt) {
        sessions.save(StudySession.builder().user(user).deck(deck).status(status).startedAt(startedAt)
                .reviewCardsCount(review).newCardsCount(fresh).totalCardsCount(review + fresh).build());
    }

    @TestConfiguration
    static class FixedClockConfiguration {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(NOW, ZoneOffset.UTC);
        }
    }
}
