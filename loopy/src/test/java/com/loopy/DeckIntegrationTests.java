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

import com.loopy.model.Card;
import com.loopy.model.Deck;
import com.loopy.repository.CardRepository;
import com.loopy.repository.DeckRepository;
import com.loopy.repository.UserProfileRepository;
import com.loopy.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
class DeckIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired DeckRepository decks;
    @Autowired CardRepository cards;
    @Autowired UserRepository users;
    @Autowired UserProfileRepository profiles;

    @AfterEach
    void clean() { cards.deleteAll(); decks.deleteAll(); profiles.deleteAll(); users.deleteAll(); }

    @Test
    void createsNormalizesAndRestrictsDecksToOwner() throws Exception {
        String ownerToken = register("owner@example.com");
        String otherToken = register("other@example.com");
        long deckId = create(ownerToken, "  English B1  ", "  Common words  ");
        mvc.perform(get("/decks").header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("English B1"));
        mvc.perform(get("/decks").header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/decks/{id}", deckId).header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("DECK_NOT_FOUND"));
    }

    @Test
    void updatesArchivesAndRestoresWithoutDeletingCards() throws Exception {
        String token = register("owner@example.com");
        long deckId = create(token, "Deck", "Description");
        Deck deck = decks.findById(deckId).orElseThrow();
        cards.save(Card.builder().deck(deck).front("front").back("back").build());
        mvc.perform(patch("/decks/{id}", deckId).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"description\":null,\"isPublic\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.description").doesNotExist())
            .andExpect(jsonPath("$.isPublic").value(true));
        mvc.perform(patch("/decks/{id}", deckId).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("DECK_UPDATE_EMPTY"));
        mvc.perform(delete("/decks/{id}", deckId).header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
        mvc.perform(get("/decks/{id}", deckId).header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
        assertThat(cards.count()).isEqualTo(1);
        mvc.perform(delete("/decks/{id}", deckId).header("Authorization", "Bearer " + token))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DECK_STATE_CONFLICT"));
        mvc.perform(post("/decks/{id}/restore", deckId).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(post("/decks/{id}/restore", deckId).header("Authorization", "Bearer " + token))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DECK_STATE_CONFLICT"));
    }

    private long create(String token, String name, String description) throws Exception {
        String body = mvc.perform(post("/decks").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"description\":\"" + description + "\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.isPublic").value(false)).andReturn()
            .getResponse().getContentAsString();
        return Long.parseLong(body.replaceFirst(".*\\\"id\\\":(\\d+).*", "$1"));
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"A\",\"email\":\"" + email + "\",\"password\":\"password1\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
