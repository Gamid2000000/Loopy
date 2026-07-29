package com.loopy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.loopy.model.User;
import com.loopy.repository.UserProfileRepository;
import com.loopy.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Autowired
    UserProfileRepository profiles;

    @AfterEach
    void clean() {
        profiles.deleteAll();
        users.deleteAll();
    }

    @Test
    void registerNormalizesEmailHashesPasswordAndCreatesProfile() throws Exception {
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"  Anna  \",\"email\":\" Anna@Example.COM \",\"password\":\"password1\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty());

        User user = users.findByEmail("anna@example.com").orElseThrow();
        assertThat(user.getName()).isEqualTo("Anna");
        assertThat(user.getPasswordHash()).startsWith("$2").isNotEqualTo("password1");
        assertThat(profiles.findByUserId(user.getId())).isPresent();
    }

    @Test
    void duplicateRegistrationReturnsConflict() throws Exception {
        register("a@example.com");
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"A\",\"email\":\"A@EXAMPLE.COM\",\"password\":\"password1\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void loginDoesNotRevealWhichCredentialIsWrong() throws Exception {
        register("a@example.com");

        String unknown = mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"missing@example.com\",\"password\":\"password1\"}"))
            .andExpect(status().isUnauthorized())
            .andReturn().getResponse().getContentAsString();

        String wrong = mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@example.com\",\"password\":\"wrongpass\"}"))
            .andExpect(status().isUnauthorized())
            .andReturn().getResponse().getContentAsString();

        assertThat(unknown).isEqualTo(wrong);
    }

    @Test
    void authenticatedUserCanReadAndPartiallyUpdateOnlyOwnProfile() throws Exception {
        String token = register("a@example.com");

        mvc.perform(get("/users/me"))
            .andExpect(status().isUnauthorized());

        mvc.perform(get("/users/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("a@example.com"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        mvc.perform(patch("/users/me/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"timezone\":\"Europe/Moscow\",\"dailyNewCardsLimit\":20}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.timezone").value("Europe/Moscow"))
            .andExpect(jsonPath("$.dailyNewCardsLimit").value(20))
            .andExpect(jsonPath("$.dailyReviewLimit").value(100));

        mvc.perform(get("/users/me")
                .header("Authorization", "Bearer bad.token"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_ACCESS_TOKEN"));
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"A\",\"email\":\""
                        + email
                        + "\",\"password\":\"password1\"}"))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return body.replaceFirst(".*\\\"accessToken\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
