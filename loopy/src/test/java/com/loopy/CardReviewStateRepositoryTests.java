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
class CardReviewStateRepositoryTests {
    @Autowired UserRepository users;
    @Autowired DeckRepository decks;
    @Autowired CardRepository cards;
    @Autowired CardReviewStateRepository states;

    @AfterEach
    void clean() { states.deleteAll(); cards.deleteAll(); decks.deleteAll(); users.deleteAll(); }

    @Test
    void persistsInstantDueAtAndEnforcesOneStatePerUserAndCard() {
        User user = users.save(User.builder().name("User").email("repository@example.com").passwordHash("hash").build());
        Deck deck = decks.save(Deck.builder().owner(user).name("Deck").isPublic(false).status(DeckStatus.ACTIVE).build());
        Card card = cards.save(Card.builder().deck(deck).front("front").back("back").status(CardStatus.ACTIVE).build());
        Instant dueAt = Instant.parse("2026-07-28T11:30:00Z");
        CardReviewState state = states.saveAndFlush(CardReviewState.builder().user(user).card(card).easinessFactor(2.5d)
                .intervalDays(0).consecutiveCorrectCount(0).dueAt(dueAt).build());

        assertThat(states.findByUserIdAndCardId(user.getId(), card.getId())).map(CardReviewState::getId).contains(state.getId());
        assertThat(states.findById(state.getId()).orElseThrow().getDueAt()).isEqualTo(dueAt);
        assertThatThrownBy(() -> states.saveAndFlush(CardReviewState.builder().user(user).card(card)
                .easinessFactor(2.5d).intervalDays(0).consecutiveCorrectCount(0)
                .lastReviewedAt(null).dueAt(null).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
