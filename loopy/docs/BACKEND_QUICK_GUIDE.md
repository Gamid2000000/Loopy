# Loopy Backend — Краткое руководство

## Назначение

Loopy — backend REST API для интервального повторения (spaced repetition)
на основе алгоритма SM-2. Пользователи создают колоды карточек, запускают
учебные сессии, оценивают знания, а система автоматически планирует повторения.

## Технологии

Java 21, Spring Boot 4.1.0, PostgreSQL, H2 (тесты), JWT (HS512), Spring Security
(stateless), JPA/Hibernate, Lombok, JUnit 5 + Mockito.

## Схема основных entities

```text
User ─── UserProfile (1:1, настройки, timezone, лимиты)
 ├── Deck (1:N, колоды)
 ├── CardReviewState (1:N, состояние изучения карточки)
 ├── StudySession (1:N, учебные сессии)
 └── ReviewLog (1:N, журнал ответов)

Deck ─── Card (1:N, карточки)
      └── StudySession (1:N)

Card ─── CardReviewState (1:N, по одному на пользователя)
     └── StudySessionCard (1:N, карточки в очереди сессии)

StudySession ─── StudySessionCard (1:N, фиксированная очередь)
```

Ключевое: `CardReviewState` хранит состояние изучения карточки пользователем
(EF, interval, dueAt) отдельно от `Card`, что позволяет разным пользователям
иметь своё расписание.

## Основные endpoints

| Endpoint | Метод | Назначение |
|----------|-------|------------|
| `/auth/register` | POST | Регистрация |
| `/auth/login` | POST | Вход |
| `/users/me` | GET | Профиль |
| `/users/me/profile` | PATCH | Настройки |
| `/decks` | GET/POST | Список / создание |
| `/decks/{id}` | GET/PATCH/DELETE | Детали / обновление / архив |
| `/decks/{id}/restore` | POST | Восстановление |
| `/cards/decks/{deckId}` | GET/POST | Карточки колоды / создание |
| `/cards/{id}` | GET/PATCH/DELETE | Детали / обновление / архив |
| `/cards/{id}/restore` | POST | Восстановление |
| `/study-sessions` | POST | Создание сессии |
| `/study-sessions/{id}` | GET | Детали |
| `/study-sessions/active?deckId=` | GET | Активная сессия |
| `/study-sessions/{id}/current-card` | GET | Текущая карточка |
| `/study-sessions/{id}/cancel` | POST | Отмена |
| `/study-sessions/{id}/reviews` | POST | Ответ на карточку |
| `/dashboard` | GET | Dashboard |
| `/statistics/overview?days=30` | GET | Статистика |

Все endpoints (кроме auth) требуют JWT в заголовке `Authorization: Bearer <token>`.
Глобальный префикс: `/api`.

## Главный пользовательский flow

```
1. POST /auth/register → JWT токен
2. POST /decks → создать колоду
3. POST /cards/decks/{deckId} → добавить карточки
4. POST /study-sessions → создать сессию
       система выбирает REVIEW (просроченные) и NEW карточки
       формирует фиксированную очередь
5. GET .../current-card → получить текущую карточку
6. POST .../reviews { grade: AGAIN|HARD|GOOD|EASY, clientReviewId: UUID }
       → SM-2 пересчитывает EF, interval, dueAt
       → возвращает следующую карточку или завершает сессию
7. GET /dashboard → прогресс, лимиты, streak
```

## Основные services

| Service | Ответственность |
|---------|----------------|
| `AuthService` | Регистрация, логин, JWT |
| `UserService` | CRUD пользователей и профилей |
| `DeckService` | CRUD колод, проверка владения |
| `CardService` | CRUD карточек + создание CardReviewState |
| `StudySessionService` | Создание сессии с выбором карточек и формированием очереди |
| `ReviewService` | Обработка ответов, идемпотентность, вызов SM-2 |
| `Sm2ReviewAdapter` | Мост между CardReviewState и SM-2 библиотекой |
| `DailyLimitService` | Расчёт дневных лимитов (REVIEW / NEW) |
| `DefaultStudyDayService` | Расчёт локального дня по timezone |
| `DashboardService` | Сборка dashboard |
| `StatisticsService` | Статистика, streak |

## Как работает SM-2

**Оценки и их смысл:**

| Оценка | SM-2 Score | Успешный? | Эффект |
|--------|-----------|-----------|--------|
| AGAIN | 1 | Нет | interval=0 (повторить сейчас) |
| HARD | 3 | Да | EF немного падает, interval растёт |
| GOOD | 4 | Да | EF почти не меняется, normal интервал |
| EASY | 5 | Да | EF растёт, interval увеличивается |

**Ключевые константы:**
- Минимальный EF: 1.3
- Начальный EF: 2.5
- Первый успешный интервал: 1 день
- Второй успешный интервал: 6 дней
- Далее: `interval = Math.round(prevInterval * EF)`

**Формула EF:**
```
EF' = max(1.3, EF + 0.1 - (5-q)*(0.08 + (5-q)*0.02))
```

## Запуск

```bash
# Требуется: Java 21, PostgreSQL на localhost:5432 (база loopy)

# Тесты (39 штук, H2 in-memory)
./mvnw test

# Запуск приложения
./mvnw spring-boot:run
# Слушает http://localhost:8080/api

# Сборка
./mvnw clean package
```

## Основные ограничения

- Только backend, frontend отсутствует
- Нет refresh token (только access token)
- Нет восстановления пароля и верификации email
- Нет внутридневных learning steps (минимум 1 день)
- AGAIN-карточка не возвращается в той же сессии
- Нет undo review
- Нет импорта/экспорта
- Публичные колоды не реализованы (поле есть, логики нет)
- JWT secret в tracked-конфигурации (риск безопасности)
- Testcontainers не используется (только H2 для тестов)
