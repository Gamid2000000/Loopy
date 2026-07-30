package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.Deck;
import com.loopy.model.User;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.UserRepository;

@SpringBootTest
class StudySessionCardSelectionRepositoryTests {

    private static final Instant NOW = Instant.parse("2026-07-29T12:00:00Z");

    @Autowired
    private UserRepository users;

    @Autowired
    private DeckRepository decks;

    @Autowired
    private CardRepository cards;

    @Autowired
    private CardReviewStateRepository states;

    @AfterEach
    void clean() {
        states.deleteAll();
        cards.deleteAll();
        decks.deleteAll();
        users.deleteAll();
    }

    @Test
    void selectsDueCardsIncludingNowAndOrdersAndLimitsThem() {
        User owner = user("owner@example.com");
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card early = card(deck, CardStatus.ACTIVE);
        Card sameFirst = card(deck, CardStatus.ACTIVE);
        Card sameSecond = card(deck, CardStatus.ACTIVE);
        Card future = card(deck, CardStatus.ACTIVE);
        Card noDue = card(deck, CardStatus.ACTIVE);
        state(owner, early, NOW.minusSeconds(1), NOW.minusSeconds(1), 1);
        state(owner, sameFirst, NOW, NOW.minusSeconds(1), 1);
        state(owner, sameSecond, NOW, NOW.minusSeconds(1), 1);
        state(owner, future, NOW.plusSeconds(1), NOW.minusSeconds(1), 1);
        state(owner, noDue, null, null, 0);

        List<CardReviewState> selected = states.findDueForStudy(owner.getId(), deck.getId(),
                DeckStatus.ACTIVE, CardStatus.ACTIVE, NOW, PageRequest.of(0, 2));

        assertThat(selected).extracting(state -> state.getCard().getId())
                .containsExactly(early.getId(), sameFirst.getId());
    }

    @Test
    void excludesDueCardsFromArchivedForeignAndOtherDecks() {
        User owner = user("owner@example.com");
        User other = user("other@example.com");
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Deck archivedDeck = deck(owner, DeckStatus.ARCHIVED);
        Deck otherDeck = deck(owner, DeckStatus.ACTIVE);
        Card eligible = card(deck, CardStatus.ACTIVE);
        Card archived = card(deck, CardStatus.ARCHIVED);
        Card inArchivedDeck = card(archivedDeck, CardStatus.ACTIVE);
        Card inOtherDeck = card(otherDeck, CardStatus.ACTIVE);
        Card foreign = card(deck, CardStatus.ACTIVE);
        state(owner, eligible, NOW, NOW.minusSeconds(1), 1);
        state(owner, archived, NOW, NOW.minusSeconds(1), 1);
        state(owner, inArchivedDeck, NOW, NOW.minusSeconds(1), 1);
        state(owner, inOtherDeck, NOW, NOW.minusSeconds(1), 1);
        state(other, foreign, NOW, NOW.minusSeconds(1), 1);

        List<CardReviewState> selected = states.findDueForStudy(owner.getId(), deck.getId(),
                DeckStatus.ACTIVE, CardStatus.ACTIVE, NOW, PageRequest.of(0, 10));

        assertThat(selected).extracting(state -> state.getCard().getId()).containsExactly(eligible.getId());
    }

    @Test
    void selectsOnlyFreshCardsInCreatedAtThenIdOrderAndLimitsThem() {
        User owner = user("owner@example.com");
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Card first = card(deck, CardStatus.ACTIVE);
        Card second = card(deck, CardStatus.ACTIVE);
        Card reviewed = card(deck, CardStatus.ACTIVE);
        Card progressed = card(deck, CardStatus.ACTIVE);
        state(owner, first, null, null, 0);
        state(owner, second, null, null, 0);
        state(owner, reviewed, null, NOW, 0);
        state(owner, progressed, null, null, 1);

        List<CardReviewState> selected = states.findNewForStudy(owner.getId(), deck.getId(),
                DeckStatus.ACTIVE, CardStatus.ACTIVE, PageRequest.of(0, 1));

        assertThat(selected).extracting(state -> state.getCard().getId()).containsExactly(first.getId());
    }

    @Test
    void excludesFreshCardsFromArchivedDecksCardsAndForeignOwners() {
        User owner = user("owner@example.com");
        User other = user("other@example.com");
        Deck deck = deck(owner, DeckStatus.ACTIVE);
        Deck archivedDeck = deck(owner, DeckStatus.ARCHIVED);
        Card eligible = card(deck, CardStatus.ACTIVE);
        Card archived = card(deck, CardStatus.ARCHIVED);
        Card inArchivedDeck = card(archivedDeck, CardStatus.ACTIVE);
        Card foreign = card(deck, CardStatus.ACTIVE);
        state(owner, eligible, null, null, 0);
        state(owner, archived, null, null, 0);
        state(owner, inArchivedDeck, null, null, 0);
        state(other, foreign, null, null, 0);

        List<CardReviewState> selected = states.findNewForStudy(owner.getId(), deck.getId(),
                DeckStatus.ACTIVE, CardStatus.ACTIVE, PageRequest.of(0, 10));

        assertThat(selected).extracting(state -> state.getCard().getId()).containsExactly(eligible.getId());
    }

    private User user(String email) {
        return users.save(User.builder().name("User").email(email).passwordHash("hash").build());
    }

    private Deck deck(User owner, DeckStatus status) {
        return decks.save(Deck.builder().owner(owner).name("Deck " + decks.count())
                .isPublic(false).status(status).build());
    }

    private Card card(Deck deck, CardStatus status) {
        return cards.save(Card.builder().deck(deck).front("front " + cards.count()).back("back")
                .status(status).build());
    }

    private void state(User user, Card card, Instant dueAt, Instant lastReviewedAt, int correct) {
        states.save(CardReviewState.builder().user(user).card(card).easinessFactor(2.5d)
                .intervalDays(0).consecutiveCorrectCount(correct).lastReviewedAt(lastReviewedAt)
                .dueAt(dueAt).build());
    }
}
