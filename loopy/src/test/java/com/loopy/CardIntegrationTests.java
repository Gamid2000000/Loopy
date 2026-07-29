package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.loopy.model.CardReviewState;
import com.loopy.repository.CardRepository;
import com.loopy.repository.CardReviewStateRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
class CardIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired CardRepository cards;
    @Autowired CardReviewStateRepository states;
    @Autowired DeckRepository decks;
    @Autowired UserRepository users;
    @Autowired UserProfileRepository profiles;

    @AfterEach
    void clean() { states.deleteAll(); cards.deleteAll(); decks.deleteAll(); profiles.deleteAll(); users.deleteAll(); }

    @Test
    void cardLifecyclePreservesInitialReviewStateAndRestrictsAccess() throws Exception {
        String owner = register("card-owner@example.com");
        String other = register("card-other@example.com");
        long deckId = deck(owner, "English");
        long cardId = card(owner, deckId, "  achieve  ", "  достигать  ", "   ", " note ");

        CardReviewState state = states.findByUserIdAndCardId(users.findByEmail("card-owner@example.com").orElseThrow().getId(), cardId).orElseThrow();
        assertThat(state.getEasinessFactor()).isEqualTo(2.5d);
        assertThat(state.getIntervalDays()).isZero();
        assertThat(state.getConsecutiveCorrectCount()).isZero();
        assertThat(state.getLastReviewedAt()).isNull();
        assertThat(state.getDueAt()).isNull();
        mvc.perform(get("/cards/decks/{id}", deckId).header("Authorization", "Bearer " + owner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].front").value("achieve"));
        mvc.perform(get("/cards/{id}", cardId).header("Authorization", "Bearer " + other))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("CARD_NOT_FOUND"));
        mvc.perform(patch("/cards/{id}", cardId).header("Authorization", "Bearer " + owner)
                .contentType(MediaType.APPLICATION_JSON).content("{\"front\":\" to achieve \",\"example\":null}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.front").value("to achieve")).andExpect(jsonPath("$.example").doesNotExist());
        mvc.perform(patch("/cards/{id}", cardId).header("Authorization", "Bearer " + owner)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CARD_UPDATE_EMPTY"));
        mvc.perform(delete("/cards/{id}", cardId).header("Authorization", "Bearer " + owner)).andExpect(status().isNoContent());
        mvc.perform(get("/cards/{id}", cardId).header("Authorization", "Bearer " + owner)).andExpect(status().isNotFound());
        mvc.perform(get("/cards/decks/{id}/archived", deckId).header("Authorization", "Bearer " + owner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(cardId));
        mvc.perform(post("/cards/{id}/restore", cardId).header("Authorization", "Bearer " + owner))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"));
        assertThat(states.count()).isEqualTo(1);
    }

    @Test
    void rejectsCreationInArchivedOrForeignDeck() throws Exception {
        String owner = register("archive-owner@example.com");
        String other = register("archive-other@example.com");
        long deckId = deck(owner, "Deck");
        mvc.perform(post("/cards/decks/{id}", deckId).header("Authorization", "Bearer " + other)
                .contentType(MediaType.APPLICATION_JSON).content("{\"front\":\"a\",\"back\":\"b\"}"))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("DECK_NOT_FOUND"));
        mvc.perform(delete("/decks/{id}", deckId).header("Authorization", "Bearer " + owner)).andExpect(status().isNoContent());
        mvc.perform(post("/cards/decks/{id}", deckId).header("Authorization", "Bearer " + owner)
                .contentType(MediaType.APPLICATION_JSON).content("{\"front\":\"a\",\"back\":\"b\"}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DECK_STATE_CONFLICT"));
    }

    private long deck(String token, String name) throws Exception {
        String body = mvc.perform(post("/decks").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\"}")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceFirst(".*\\\"id\\\":(\\d+).*", "$1"));
    }
    private long card(String token, long deckId, String front, String back, String example, String note) throws Exception {
        String body = mvc.perform(post("/cards/decks/{id}", deckId).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"front\":\"" + front + "\",\"back\":\"" + back + "\",\"example\":\"" + example + "\",\"note\":\"" + note + "\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.front").value("achieve")).andExpect(jsonPath("$.example").doesNotExist()).andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceFirst(".*\\\"id\\\":(\\d+).*", "$1"));
    }
    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"A\",\"email\":\"" + email + "\",\"password\":\"password1\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
