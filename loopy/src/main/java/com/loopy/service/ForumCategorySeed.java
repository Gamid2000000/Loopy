package com.loopy.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.loopy.model.enumeration.ForumCategoryStatus;
import com.loopy.model.ForumCategory;
import com.loopy.repository.ForumCategoryRepository;

@Configuration
public class ForumCategorySeed {

    @Bean
    public ApplicationRunner forumCategoryInitializer(ForumCategoryRepository categories, Clock clock) {
        return args -> seedMissingCategories(categories, clock.instant());
    }

    private void seedMissingCategories(ForumCategoryRepository categories, Instant now) {
        List<ForumCategory> defaults = List.of(
                category("general", "Общее", "Обсуждение изучения языков и Loopy", 0, now),
                category("language-learning", "Изучение языков", "Практика, привычки и методы обучения", 1, now),
                category("decks-and-cards", "Колоды и карточки", "Работа с колодами и карточками", 2, now),
                category("movies-and-subtitles", "Фильмы и субтитры", "Обучение по фильмам и субтитрам", 3, now),
                category("feature-requests", "Предложения по Loopy", "Идеи для развития приложения", 4, now),
                category("bug-reports", "Ошибки", "Сообщения о проблемах в приложении", 5, now));

        defaults.stream().filter(category -> !categories.existsBySlug(category.getSlug()))
                .forEach(categories::save);
    }

    private ForumCategory category(String slug, String name, String description, int position,
            Instant now) {
        return ForumCategory.builder().slug(slug).name(name).description(description)
                .position(position).status(ForumCategoryStatus.ACTIVE).createdAt(now).updatedAt(now)
                .build();
    }
}
