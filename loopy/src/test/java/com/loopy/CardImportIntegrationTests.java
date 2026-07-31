package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class CardImportIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired CardRepository cards;
    @Autowired CardReviewStateRepository states;
    @Autowired DeckRepository decks;
    @Autowired UserRepository users;
    @Autowired UserProfileRepository profiles;

    @AfterEach
    void clean() { states.deleteAll(); cards.deleteAll(); decks.deleteAll(); profiles.deleteAll(); users.deleteAll(); }

    @Test
    void previewRequiresAuth() throws Exception {
        mvc.perform(post("/cards/decks/{deckId}/import/preview", 1)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"f\",\"back\":\"b\"}]}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void commitRequiresAuth() throws Exception {
        mvc.perform(post("/cards/decks/{deckId}/import", 1)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"f\",\"back\":\"b\"}]}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void previewValidRows() throws Exception {
        String token = register("preview-valid@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\" hello \",\"back\":\" world \"},{\"rowNumber\":2,\"front\":\"foo\",\"back\":\"bar\",\"example\":\"  \",\"note\":\"n\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRows").value(2))
                .andExpect(jsonPath("$.validRows").value(2))
                .andExpect(jsonPath("$.invalidRows").value(0))
                .andExpect(jsonPath("$.duplicateInFileRows").value(0))
                .andExpect(jsonPath("$.duplicateInDeckRows").value(0))
                .andExpect(jsonPath("$.rows.length()").value(2))
                .andExpect(jsonPath("$.rows[0].front").value("hello"))
                .andExpect(jsonPath("$.rows[0].back").value("world"))
                .andExpect(jsonPath("$.rows[0].status").value("VALID"))
                .andExpect(jsonPath("$.rows[1].example").doesNotExist())
                .andExpect(jsonPath("$.rows[1].note").value("n"))
                .andExpect(jsonPath("$.rows[0].errors.length()").value(0));
    }

    @Test
    void previewDetectsMissingFront() throws Exception {
        String token = register("missing-front@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"\",\"back\":\"back\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRows").value(1))
                .andExpect(jsonPath("$.validRows").value(0))
                .andExpect(jsonPath("$.invalidRows").value(1))
                .andExpect(jsonPath("$.rows[0].status").value("INVALID"))
                .andExpect(jsonPath("$.rows[0].errors[0]").value("Лицевая сторона обязательна"));
    }

    @Test
    void previewDetectsMissingBack() throws Exception {
        String token = register("missing-back@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"front\",\"back\":\"  \"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows[0].status").value("INVALID"))
                .andExpect(jsonPath("$.rows[0].errors[0]").value("Обратная сторона обязательна"));
    }

    @Test
    void previewDetectsMaxLength() throws Exception {
        String token = register("max-length@example.com");
        long deckId = deck(token, "Deck");

        String longFront = "x".repeat(501);
        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"" + longFront + "\",\"back\":\"back\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows[0].status").value("INVALID"))
                .andExpect(jsonPath("$.rows[0].errors[0]").value("Лицевая сторона превышает 500 символов"));
    }

    @Test
    void previewEmptyRequestFails() throws Exception {
        String token = register("empty-req@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void previewTooManyRowsFails() throws Exception {
        String token = register("too-many@example.com");
        long deckId = deck(token, "Deck");

        StringBuilder sb = new StringBuilder("{\"rows\":[");
        for (int i = 0; i < 501; i++) {
            if (i > 0) sb.append(",");
            sb.append("{\"rowNumber\":").append(i + 1).append(",\"front\":\"f").append(i).append("\",\"back\":\"b").append(i).append("\"}");
        }
        sb.append("]}");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(sb.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CARD_IMPORT_TOO_MANY_ROWS"));
    }

    @Test
    void previewDetectsDuplicateInFile() throws Exception {
        String token = register("dup-file@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"hello\",\"back\":\"world\"},{\"rowNumber\":2,\"front\":\" hello \",\"back\":\" world \"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRows").value(2))
                .andExpect(jsonPath("$.validRows").value(1))
                .andExpect(jsonPath("$.duplicateInFileRows").value(1))
                .andExpect(jsonPath("$.rows[1].status").value("DUPLICATE_IN_FILE"));
    }

    @Test
    void previewDetectsDuplicateInActiveDeck() throws Exception {
        String token = register("dup-deck@example.com");
        long deckId = deck(token, "Deck");
        card(token, deckId, "hello", "world", null, null);

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"hello\",\"back\":\"world\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.validRows").value(0))
                .andExpect(jsonPath("$.duplicateInDeckRows").value(1))
                .andExpect(jsonPath("$.rows[0].status").value("DUPLICATE_IN_DECK"));
    }

    @Test
    void previewDetectsDuplicateInArchivedDeck() throws Exception {
        String token = register("dup-archived@example.com");
        long deckId = deck(token, "Deck");
        long cardId = card(token, deckId, "hello", "world", null, null);

        mvc.perform(delete("/cards/{id}", cardId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"hello\",\"back\":\"world\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicateInDeckRows").value(1))
                .andExpect(jsonPath("$.rows[0].status").value("DUPLICATE_IN_DECK"));
    }

    @Test
    void previewCaseSensitiveDuplicates() throws Exception {
        String token = register("case-sense@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"Hello\",\"back\":\"привет\"},{\"rowNumber\":2,\"front\":\"hello\",\"back\":\"привет\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.validRows").value(2))
                .andExpect(jsonPath("$.duplicateInFileRows").value(0));
    }

    @Test
    void previewForeignDeckReturnsNotFound() throws Exception {
        String owner = register("foreign-owner@example.com");
        String other = register("foreign-other@example.com");
        long deckId = deck(owner, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + other)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"f\",\"back\":\"b\"}]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DECK_NOT_FOUND"));
    }

    @Test
    void previewArchivedDeckRejected() throws Exception {
        String token = register("archived-preview@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(delete("/decks/{id}", deckId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"f\",\"back\":\"b\"}]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DECK_STATE_CONFLICT"));
    }

    @Test
    void previewDoesNotModifyDatabase() throws Exception {
        String token = register("preview-db@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import/preview", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"hello\",\"back\":\"world\"}]}"))
                .andExpect(status().isOk());

        assertThat(cards.count()).isZero();
        assertThat(states.count()).isZero();
    }

    @Test
    void commitCreatesCardAndReviewState() throws Exception {
        String token = register("commit-create@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\" hello \",\"back\":\" world \"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedRows").value(1))
                .andExpect(jsonPath("$.importedRows").value(1))
                .andExpect(jsonPath("$.skippedDuplicateRows").value(0))
                .andExpect(jsonPath("$.cards.length()").value(1))
                .andExpect(jsonPath("$.cards[0].front").value("hello"))
                .andExpect(jsonPath("$.cards[0].back").value("world"));

        assertThat(cards.count()).isEqualTo(1);
        assertThat(states.count()).isEqualTo(1);
    }

    @Test
    void commitInitialSchedulingMatchesNormalCreate() throws Exception {
        String token = register("commit-sched@example.com");
        long deckId = deck(token, "Deck");

        String body = mvc.perform(post("/cards/decks/{deckId}/import", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"hello\",\"back\":\"world\"}]}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long cardId = Long.parseLong(body.replaceFirst(".*\"cardId\":(\\d+).*", "$1"));

        CardReviewState state = states.findByUserIdAndCardId(
                users.findByEmail("commit-sched@example.com").orElseThrow().getId(), cardId).orElseThrow();
        assertThat(state.getEasinessFactor()).isEqualTo(2.5d);
        assertThat(state.getIntervalDays()).isZero();
        assertThat(state.getConsecutiveCorrectCount()).isZero();
        assertThat(state.getLastReviewedAt()).isNull();
        assertThat(state.getDueAt()).isNull();
    }

    @Test
    void commitSkipsDuplicates() throws Exception {
        String token = register("commit-skip@example.com");
        long deckId = deck(token, "Deck");

        card(token, deckId, "hello", "world", null, null);

        mvc.perform(post("/cards/decks/{deckId}/import", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\" hello \",\"back\":\" world \"},{\"rowNumber\":2,\"front\":\"foo\",\"back\":\"bar\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedRows").value(2))
                .andExpect(jsonPath("$.importedRows").value(1))
                .andExpect(jsonPath("$.skippedDuplicateRows").value(1))
                .andExpect(jsonPath("$.cards.length()").value(1))
                .andExpect(jsonPath("$.cards[0].front").value("foo"));

        assertThat(cards.count()).isEqualTo(2);
        assertThat(states.count()).isEqualTo(2);
    }

    @Test
    void commitNoValidRowsReturnsError() throws Exception {
        String token = register("commit-novalid@example.com");
        long deckId = deck(token, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"\",\"back\":\"\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CARD_IMPORT_NO_VALID_ROWS"));
    }

    @Test
    void commitForeignDeckReturnsNotFound() throws Exception {
        String owner = register("commit-foreign@example.com");
        String other = register("commit-other@example.com");
        long deckId = deck(owner, "Deck");

        mvc.perform(post("/cards/decks/{deckId}/import", deckId)
                .header("Authorization", "Bearer " + other)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rows\":[{\"rowNumber\":1,\"front\":\"f\",\"back\":\"b\"}]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DECK_NOT_FOUND"));
    }

    @Test
    void commitMultipleCardsInOneRequest() throws Exception {
        String token = register("commit-multi@example.com");
        long deckId = deck(token, "Deck");

        StringBuilder sb = new StringBuilder("{\"rows\":[");
        for (int i = 0; i < 50; i++) {
            if (i > 0) sb.append(",");
            sb.append("{\"rowNumber\":").append(i + 1).append(",\"front\":\"front").append(i).append("\",\"back\":\"back").append(i).append("\"}");
        }
        sb.append("]}");

        mvc.perform(post("/cards/decks/{deckId}/import", deckId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(sb.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.importedRows").value(50));

        assertThat(cards.count()).isEqualTo(50);
        assertThat(states.count()).isEqualTo(50);
    }

    private long deck(String token, String name) throws Exception {
        String body = mvc.perform(post("/decks").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\"}")).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceFirst(".*\\\"id\\\":(\\d+).*", "$1"));
    }

    private long card(String token, long deckId, String front, String back, String example, String note) throws Exception {
        StringBuilder json = new StringBuilder("{\"front\":\"").append(front).append("\",\"back\":\"").append(back).append("\"");
        if (example != null) json.append(",\"example\":\"").append(example).append("\"");
        if (note != null) json.append(",\"note\":\"").append(note).append("\"");
        json.append("}");
        String body = mvc.perform(post("/cards/decks/{id}", deckId).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.toString()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceFirst(".*\\\"id\\\":(\\d+).*", "$1"));
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"A\",\"email\":\"" + email + "\",\"password\":\"password1\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
