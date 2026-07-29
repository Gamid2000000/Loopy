package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.loopy.model.Card;
import com.loopy.model.CardReviewState;
import com.loopy.model.Deck;
import com.loopy.model.User;
import com.loopy.model.enumeration.CardStatus;
import com.loopy.model.enumeration.DeckStatus;

class CardReviewStateTest {
    @Test
    void initialStateRepresentsAnUnscheduledNewCard() {
        User user = User.builder().build();
        Card card = Card.builder()
                .deck(Deck.builder().owner(user).name("Deck").isPublic(false).status(DeckStatus.ACTIVE).build())
                .front("front").back("back").status(CardStatus.ACTIVE).build();

        CardReviewState state = CardReviewState.builder().user(user).card(card)
                .easinessFactor(2.5d).intervalDays(0).consecutiveCorrectCount(0)
                .lastReviewedAt(null).dueAt(null).build();

        assertThat(state.getEasinessFactor()).isEqualTo(2.5d);
        assertThat(state.getIntervalDays()).isZero();
        assertThat(state.getConsecutiveCorrectCount()).isZero();
        assertThat(state.getLastReviewedAt()).isNull();
        assertThat(state.getDueAt()).isNull();
    }
}
