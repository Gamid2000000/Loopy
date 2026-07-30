# Архитектура Backend Loopy

## 1. Обзор приложения

**Loopy** — это backend REST API-приложение для интервального повторения (spaced repetition)
на основе алгоритма SM-2. Приложение позволяет пользователю создавать колоды карточек,
запускать учебные сессии, оценивать свои знания и отслеживать прогресс через dashboard
и статистику.

Приложение решает задачу эффективного запоминания информации: пользователь создаёт карточки
(вопрос-ответ), а система сама определяет оптимальное время для повторения каждой карточки с
помощью алгоритма SM-2, минимизируя забывание.

**Основные пользовательские сценарии:**
- Регистрация и аутентификация (JWT)
- Создание колод и карточек
- Запуск учебных сессий с автоматическим подбором карточек
- Оценка ответов (AGAIN / HARD / GOOD / EASY)
- Автоматическое планирование повторений (SM-2)
- Dashboard с дневными лимитами и статистикой
- Просмотр статистики за период

**Главный цикл приложения:**

```
регистрация → создание колоды → добавление карточек → запуск занятия
→ получение очереди → ответ на карточку → расчёт SM-2
→ назначение следующего повторения → завершение занятия → dashboard и статистика
```

**Текущий статус MVP:** backend полностью реализует базовые CRUD-операции для всех
основных сущностей, полный цикл учебной сессии, аутентификацию через JWT, дневные
лимиты с учётом timezone, dashboard и статистику.

Исходный код: `loopy/src/main/java/com/loopy/LoopyApplication.java`

---

## 2. Технологический стек

| Компонент | Технология / Версия |
|-----------|---------------------|
| Java | 21 |
| Spring Boot | 4.1.0 |
| База данных (production) | PostgreSQL |
| База данных (тесты) | H2 in-memory (MODE=PostgreSQL) |
| Управление схемой | `ddl-auto=update` (Hibernate) |
| ORM | Spring Data JPA / Hibernate 7.4.1 |
| Аутентификация | JWT (jjwt 0.11.5, HS512) |
| Security | Spring Security (stateless) |
| Пароли | BCrypt |
| Время | `java.time.Instant` (Java) + Joda-Time 2.14.2 (SM-2) |
| Утилиты | Guava 28.1-jre |
| Lombok | ✓ (повсеместно) |
| Validation | Jakarta Validation |
| Тесты | JUnit 5 + Mockito + Spring Test + AssertJ + H2 |
| Сборка | Maven |

---

## 3. Архитектура

### 3.1. Архитектурный стиль

Layered Architecture (controller → service → repository → entity):
- Controllers — тонкие, делегируют в сервисы
- Services — бизнес-логика, валидация, координация репозиториев
- Repositories — Spring Data JPA, кастомные JPQL-запросы
- Entities — только данные + JPA-аннотации + lifecycle-коллбэки (без бизнес-логики)

Все зависимости инжектятся через конструктор (`@RequiredArgsConstructor`).

### 3.2. Структура пакетов

```text
com.loopy
├── config             — SecurityConfig, Clock bean
├── controller         — REST controllers (7 шт.)
├── dto                — нет (DTO находятся в service/dto/)
├── exception          — доменные исключения (15 шт.)
├── exception_handler  — GlobalExceptionFilter, JsonErrorResponse, HttpResponseMessage
├── logging            — LogTimingUtils
├── model              — JPA entities + enums
│   └── enumeration    — CardStatus, DeckStatus, ReviewGrade, StudySessionStatus, StudyCardType, StudySessionCardStatus
├── repository         — Spring Data JPA repositories (8 шт.)
├── security           — JWT-фильтр, JwtTokenProvider, CustomAuthenticationEntryPoint, UserPrincipal
├── service            — бизнес-логика
│   └── dto            — request/response DTO (34 класса)
└── sm2                — SM-2 алгоритм (Scheduler, Item, Review, Session, ...)
```

---

## 4. Модель данных

### 4.1. Обзор entities

| Entity | Таблица | Назначение |
|--------|---------|------------|
| `User` | `users` | Учётная запись (email, password_hash, name) |
| `UserProfile` | `user_profiles` | Профиль пользователя (timezone, лимиты, языки, display name) |
| `Deck` | `decks` | Колода карточек (name, description, isPublic, status) |
| `Card` | `cards` | Карточка (front, back, example, note, status) |
| `CardReviewState` | `card_review_states` | Состояние изучения карточки для конкретного пользователя (EF, interval, dueAt) |
| `StudySession` | `study_sessions` | Учебная сессия (counts, status, timestamps) |
| `StudySessionCard` | `study_session_cards` | Карточка в очереди фиксированной сессии (position, type, status, dueAtSnapshot) |
| `ReviewLog` | `review_logs` | Неизменяемый журнал ответов (snapshots до/после, grade, время) |

### 4.2. Схема связей

```text
User
├── 1:1 UserProfile (user_id → uk_user_profiles_user)
├── 1:N Deck (owner → user_id)
├── 1:N CardReviewState (user → user_id)
├── 1:N StudySession (user → user_id)
└── 1:N ReviewLog (user → user_id)

Deck
├── N:1 User (owner)
├── 1:N Card (deck → deck_id)
└── 1:N StudySession (deck → deck_id)

Card
├── N:1 Deck (deck)
├── 1:N CardReviewState (card → card_id) — по одному состоянию на пользователя
├── 1:N StudySessionCard (card → card_id)
└── 1:N ReviewLog (card → card_id)

StudySession
├── N:1 User
├── N:1 Deck
└── 1:N StudySessionCard (session → session_id)

StudySessionCard
├── N:1 StudySession
├── N:1 Card
└── 1:1 ReviewLog (session_card_id → uk_review_log_session_card)
```

### 4.3. Почему CardReviewState отделён от Card

`CardReviewState` — это состояние изучения карточки **конкретным пользователем**.
Один и тот же `Card` принадлежит одной `Deck`, но может изучаться разными
пользователями (если колода публичная). Каждый пользователь имеет своё
расписание (EF, interval, dueAt), поэтому состояние хранится отдельно.

Уникальное ограничение `uk_card_review_state_user_card (user_id, card_id)`
гарантирует не более одного состояния на пару (пользователь, карточка).

`CardReviewState.java:19`

### 4.4. Подробно по каждой entity

#### User
`User.java`

| Поле | Тип | Обязательное | Примечание |
|------|-----|-------------|------------|
| id | Long (IDENTITY) | ✓ | PK |
| name | String (100) | ✓ | Имя пользователя |
| email | String (320) | ✓ | Уникальный (uk_users_email) |
| passwordHash | String (100) | ✓ | BCrypt хэш |
| createdAt | Instant | ✓ | Автоустановка в @PrePersist |
| updatedAt | Instant | ✓ | Автообновление в @PreUpdate |
| version | Long | ✓ | @Version для optimistic locking |

#### UserProfile
`UserProfile.java`

| Поле | Тип | Обязательное | По умолчанию |
|------|-----|-------------|--------------|
| id | Long (IDENTITY) | ✓ | |
| user | User (1:1 LAZY) | ✓ | uk_user_profiles_user |
| displayName | String (100) | ✓ | = name пользователя |
| nativeLanguage | String (35) | ✗ | null |
| learningLanguage | String (35) | ✗ | null |
| timezone | String (100) | ✓ | "UTC" |
| dailyNewCardsLimit | int | ✓ | 20 |
| dailyReviewLimit | int | ✓ | 100 |
| createdAt | Instant | ✓ | |
| updatedAt | Instant | ✓ | |
| version | Long | ✓ | |

**Разделение User/UserProfile:** User хранит учётные данные, UserProfile —
настройки и предпочтения. Это позволяет менять профиль независимо и не
загромождать таблицу users.

**Создание профиля:** в `UserService.createUser()` одновременно с User.
`UserService.java:52-58`

#### Deck
`Deck.java`

| Поле | Тип | Обязательное |
|------|-----|-------------|
| id | Long (IDENTITY) | ✓ |
| owner | User (LAZY) | ✓ |
| name | String (100) | ✓ |
| description | String (1000) | ✗ |
| isPublic | boolean | ✓ (default false) |
| status | DeckStatus | ✓ (default ACTIVE) |
| createdAt/updatedAt | Instant | ✓ |
| version | Long | ✓ |

Статусы: `ACTIVE`, `ARCHIVED`.

#### Card
`Card.java`

| Поле | Тип | Обязательное |
|------|-----|-------------|
| id | Long (IDENTITY) | ✓ |
| deck | Deck (LAZY) | ✓ |
| front | String (500) | ✓ |
| back | String (2000) | ✓ |
| example | String (3000) | ✗ |
| note | String (3000) | ✗ |
| status | CardStatus | ✓ (default ACTIVE) |
| createdAt/updatedAt | Instant | ✓ |
| version | Long | ✓ |

Статусы: `ACTIVE`, `ARCHIVED`.

#### CardReviewState
`CardReviewState.java`

| Поле | Тип | Обязательное | Значение по умолчанию |
|------|-----|-------------|----------------------|
| id | Long (IDENTITY) | ✓ | |
| user | User (LAZY) | ✓ | |
| card | Card (LAZY) | ✓ | |
| easinessFactor | Double | ✓ | 2.5 |
| intervalDays | Integer | ✓ | 0 |
| consecutiveCorrectCount | Integer | ✓ | 0 |
| lastReviewedAt | Instant | ✗ | null |
| dueAt | Instant | ✗ | null |
| version | Long | ✓ | |

**Уникальное ограничение:** `uk_card_review_state_user_card (user_id, card_id)`.

**Семантика dueAt:**

| Значение | Смысл |
|----------|-------|
| `dueAt == null` | Новая (ни разу не показанная) карточка |
| `dueAt <= now` | Карточка доступна для повторения |
| `dueAt > now` | Карточка запланирована на будущее |

**Начальное состояние** (создаётся в `CardService.create()`):
```
easinessFactor = 2.5
intervalDays = 0
consecutiveCorrectCount = 0
lastReviewedAt = null
dueAt = null
```
`CardService.java:35-38`

#### StudySession
`StudySession.java`

| Поле | Тип | Примечание |
|------|-----|-----------|
| id | Long (IDENTITY) | |
| user | User (LAZY) | |
| deck | Deck (LAZY) | |
| status | StudySessionStatus | ACTIVE / COMPLETED / CANCELLED |
| startedAt | Instant | |
| completedAt | Instant | null до завершения |
| cancelledAt | Instant | null до отмены |
| reviewCardsCount | int | Количество REVIEW-карточек |
| newCardsCount | int | Количество NEW-карточек |
| totalCardsCount | int | reviewCardsCount + newCardsCount |
| completedCardsCount | int | Счётчик отвеченных |
| createdAt/updatedAt | Instant | |
| version | Long | |

Индекс: `idx_study_sessions_user_deck_status (user_id, deck_id, status)`.

#### StudySessionCard
`StudySessionCard.java`

| Поле | Тип | Примечание |
|------|-----|-----------|
| id | Long (IDENTITY) | |
| session | StudySession (LAZY) | |
| card | Card (LAZY) | |
| position | int | Порядковый номер в очереди (с 1) |
| type | StudyCardType | REVIEW или NEW |
| status | StudySessionCardStatus | PENDING / REVIEWED / SKIPPED |
| dueAtSnapshot | Instant | Замороженный dueAt на момент создания сессии |
| reviewedAt | Instant | Момент ответа |
| createdAt/updatedAt | Instant | |
| version | Long | |

Уникальные ограничения:
- `uk_study_session_card (session_id, card_id)` — карточка не может быть в сессии дважды
- `uk_study_session_position (session_id, position)` — позиции уникальны в рамках сессии

Индекс: `idx_study_session_cards_session_status_position (session_id, status, position)`.

#### ReviewLog
`ReviewLog.java`

| Поле | Тип | Примечание |
|------|-----|-----------|
| id | Long (IDENTITY) | |
| user | User (LAZY) | |
| sessionCard | StudySessionCard (LAZY) | 1:1 (uk_review_log_session_card) |
| card | Card (LAZY) | Денормализовано для удобства запросов |
| grade | ReviewGrade | AGAIN/HARD/GOOD/EASY |
| sm2Score | int | Числовой эквивалент grade |
| responseTimeMs | Long | Время ответа (nullable) |
| clientReviewId | UUID | Идемпотентный ключ |
| previousEaseFactor / newEaseFactor | Double | Снапшоты EF |
| previousIntervalDays / newIntervalDays | Integer | Снапшоты интервала |
| previousConsecutiveCorrectCount / newConsecutiveCorrectCount | Integer | Снапшоты correct count |
| previousDueAt | Instant | Предыдущий dueAt (nullable) |
| nextReviewAt | Instant | Новый dueAt |
| reviewedAt | Instant | Момент создания записи |

Уникальные ограничения:
- `uk_review_log_user_client_review (user_id, client_review_id)` — идемпотентность
- `uk_review_log_session_card (session_card_id)` — одна запись на session-card

Индекс: `idx_review_logs_user_reviewed_at (user_id, reviewed_at)` — для статистики.

ReviewLog **неизменяемый** — нет @Setter, нет @Version. Это журнал аудита.

### 4.5. Enum-классы

| Enum | Значения |
|------|----------|
| `CardStatus` | ACTIVE, ARCHIVED |
| `DeckStatus` | ACTIVE, ARCHIVED |
| `ReviewGrade` | AGAIN(1), HARD(3), GOOD(4), EASY(5) |
| `StudyCardType` | REVIEW, NEW |
| `StudySessionCardStatus` | PENDING, REVIEWED, SKIPPED |
| `StudySessionStatus` | ACTIVE, COMPLETED, CANCELLED |

`ReviewGrade` имеет sm2Score (числовой эквивалент) и метод `isSuccessful()`:
успешным считается `sm2Score >= 3`, т.е. HARD, GOOD, EASY — успешные,
AGAIN (score=1) — неуспешный.

---

## 5. Security и JWT

### 5.1. SecurityConfig
`SecurityConfig.java`

- Режим: **stateless** (`SessionCreationPolicy.STATELESS`)
- CSRF: отключён
- CORS: разрешён для `allowedOrigins` (из конфигурации, по умолчанию `http://localhost:3000`),
  методы GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD, любые заголовки, credentials=true, maxAge=3600
- Публичные endpoints: `POST /auth/login`, `POST /auth/register`, `OPTIONS /**`
- Все остальные endpoints требуют аутентификации
- `JwtAuthenticationFilter` добавлен перед `UsernamePasswordAuthenticationFilter`

### 5.2. Регистрация
`AuthController.register()` → `AuthService.register()`

```
HTTP POST /auth/register { name, email, password }
→ @Valid валидация RegisterRequest
→ нормализация email (trim + lowercase)
→ проверка уникальности email (existsByEmail)
→ BCrypt.encode(password)
→ сохранение User
→ создание UserProfile (displayName=name, timezone="UTC", dailyNewCardsLimit=20, dailyReviewLimit=100)
→ генерация JWT (sub=email, HS512)
→ HTTP 201 { accessToken, tokenType="Bearer", expiresIn }
```

`AuthService.java:19-26`, `UserService.java:45-59`

### 5.3. Login
`AuthController.login()` → `AuthService.login()`

```
email + password
→ нормализация email
→ поиск User по email
→ PasswordEncoder.matches(password, passwordHash)
→ генерация JWT
→ AuthResponse
```

### 5.4. JWT

| Параметр | Значение |
|----------|----------|
| Библиотека | jjwt 0.11.5 |
| Алгоритм | HS512 (HMAC-SHA-512) |
| В sub | email пользователя |
| Claims | sub (email), iat, exp |
| Secret | из `app.jwt.secret` (env/application.properties) |
| Срок жизни | `app.jwt.ExpirationMs` (prod: 9000000ms = 2.5ч) |
| Извлечение | Заголовок `Authorization: Bearer <token>` |
| Principal | `UserPrincipal(email, token)` |

`JwtTokenProvider.java`, `JwtAuthenticationFilter.java`

**Как controller получает пользователя:**

```java
@AuthenticationPrincipal UserPrincipal principal
// principal.getEmail() → email
```

Сервисы затем вызывают `UserService.getWithException(normalizeEmail(principal.getEmail()))`
для получения `User` entity.

### 5.5. Обработка ошибок JWT

| Сценарий | Код | Error Response |
|----------|-----|----------------|
| Отсутствует токен | 401 | `{"code":"INVALID_ACCESS_TOKEN","message":"JWT token not valid or missing!","status":401}` |
| Просрочен / повреждён | 401 | то же |
| Валидный токен, но пользователь не найден | 500 (не обработан) | — |

Обработчик: `CustomAuthenticationEntryPoint.java`

---

## 6. User и профиль

### 6.1. Endpoints

| Метод | Endpoint | Назначение |
|--------|----------|------------|
| `GET` | `/users/me` | Получение текущего пользователя + профиля |
| `PATCH` | `/users/me/profile` | Частичное обновление профиля |

`UserController.java`

### 6.2. Роли timezone и лимитов

- **timezone** — определяет границы локального дня для дневных лимитов и dashboard
  `DefaultStudyDayService.java`
- **dailyNewCardsLimit** — максимальное число новых карточек в день (по умолчанию 20)
- **dailyReviewLimit** — максимальное число повторений в день (по умолчанию 100)

Лимиты проверяются при создании `StudySession` и отображаются в dashboard.

---

## 7. Deck

### 7.1. Жизненный цикл

| Операция | Endpoint | Метод | Статус |
|----------|----------|-------|--------|
| Создание | `/decks` | POST | 201 |
| Список активных | `/decks` | GET | 200 |
| Детали | `/decks/{deckId}` | GET | 200 |
| Обновление | `/decks/{deckId}` | PATCH | 200 |
| Архивирование | `/decks/{deckId}` | DELETE | 204 |
| Список архивных | `/decks/archived` | GET | 200 |
| Восстановление | `/decks/{deckId}/restore` | POST | 200 |

`DeckController.java`, `DeckService.java`

### 7.2. Правила доступа

- **Owner:** назначается из `UserPrincipal`, не принимается от клиента.
  `DeckService.create()`: `Deck.builder().owner(owner).build()`
- **Чужая колода:** возвращает `404 DECK_NOT_FOUND` (для защиты от перебора ID)
- **Архивированная колода:** при попытке изменения возвращает `409 DECK_STATE_CONFLICT`
- **Soft delete:** `DELETE` меняет статус на `ARCHIVED`, не удаляет физически
- **Оптимистическая блокировка:** через `@Version`, при конфликте → `409 OPTIMISTIC_LOCK_CONFLICT`

### 7.3. PATCH-механика описания

`UpdateDeckRequest` использует Jackson `@JsonSetter` с флагами присутствия:
- Поле не передано → не меняется (`namePresent = false`)
- `"description": null` → очищает описание
- `"name": ""` → ошибка валидации (trim + проверка на пустоту)

`UpdateDeckRequest.java`

---

## 8. Card и CardReviewState

### 8.1. Жизненный цикл

| Операция | Endpoint | Статус |
|----------|----------|--------|
| Создание | `POST /cards/decks/{deckId}` | 201 |
| Список активных | `GET /cards/decks/{deckId}` | 200 |
| Детали | `GET /cards/{cardId}` | 200 |
| Обновление | `PATCH /cards/{cardId}` | 200 |
| Архивирование | `DELETE /cards/{cardId}` | 204 |
| Список архивных | `GET /cards/decks/{deckId}/archived` | 200 |
| Восстановление | `POST /cards/{cardId}/restore` | 200 |

`CardController.java`, `CardService.java`

### 8.2. Ключевые правила

- **Card всегда принадлежит одной Deck** (`@ManyToOne`, не `@ManyToMany`). Это упрощает
  владение: доступ проверяется через `Card → Deck → owner`.
- **Создание CardReviewState:** при создании карточки атомарно создаётся состояние.
  `CardService.create():35-38`
- **Редактирование текста не сбрасывает прогресс:** `CardService.update()` меняет только
  front/back/example/note, не трогает `CardReviewState`.
- **Архивирование не удаляет CardReviewState:** состояние сохраняется — статистика
  остаётся полной, при восстановлении прогресс не теряется.
- **Восстановление не создаёт новое состояние:** используется существующее.

### 8.3. PATCH и различение absent/null

`UpdateCardRequest` использует тот же подход, что и `UpdateDeckRequest`:
- Каждое поле имеет `@JsonIgnore` флаг `xxxPresent`
- `@JsonSetter` устанавливает и значение, и флаг
- `hasChanges()` проверяет, что хотя бы одно поле изменено
- `null` в example/note очищает поле
- `null` в front/back — передаётся как есть (но trim в сервисе упадёт на NPE)

---

## 9. StudySession и очередь

### 9.1. Алгоритм создания

`StudySessionService.create()`

```
1. Получение User (resolveUser)
2. Получение Deck (resolveDeck + проверка ownership через findByIdAndOwnerId)
3. Проверка статуса Deck (ensureDeckActive)
4. Проверка отсутствия активной сессии (ensureNoActiveSession)
5. Получение UserProfile
6. Расчёт локального дня (studyDayService.currentDay)
7. Расчёт дневных лимитов (dailyLimitService.calculate)
8. Выбор REVIEW-карточек (loadDueCards: dueAt <= now AND dueAt IS NOT NULL,
   сортировка: dueAt ASC, id ASC, лимит: remainingReviewLimit)
9. Выбор NEW-карточек (loadNewCards: dueAt IS NULL AND lastReviewedAt IS NULL
   AND consecutiveCorrectCount = 0, сортировка: card.createdAt ASC, card.id ASC,
   лимит: remainingNewLimit)
10. Проверка: хотя бы одна карточка должна быть (ensureHasCards)
11. Создание StudySession (buildSession)
12. Создание StudySessionCard очереди (buildSessionCards):
    сначала REVIEW (position 1..N), потом NEW (position N+1..)
    тип: StudyCardType.REVIEW / .NEW
    статус: PENDING
    dueAtSnapshot = state.getDueAt() (заморожен на момент создания)
13. Сохранение всей очереди (sessionCardRepository.saveAll)
```

### 9.2. Фиксированная очередь

Очередь сохраняется в базе (StudySessionCard) при создании сессии и **не
пересчитывается** при каждом запросе. Это гарантирует:
- Предсказуемый порядок карточек для пользователя
- Консистентность: даже если dueAt изменился, очередь не меняется
- Производительность: один запрос вместо повторной сортировки

`dueAtSnapshot` сохраняет значение `state.getDueAt()` на момент создания сессии.

### 9.3. Статусы сессии

| Статус | Описание |
|--------|----------|
| `ACTIVE` | Сессия в процессе |
| `COMPLETED` | Все карточки отвечены |
| `CANCELLED` | Отменена пользователем |

Допустимые переходы:
```
ACTIVE → COMPLETED (автоматически после последнего ответа)
ACTIVE → CANCELLED (пользователем)
```

Недопустимо: `COMPLETED → ACTIVE`, `CANCELLED → ACTIVE`, `COMPLETED → CANCELLED`.

При отмене: очередь сохраняется, `CardReviewState` не меняется, дневной лимит
освобождается (CANCELLED-сессии не учитываются в лимитах).

`StudySessionService.cancel():102-113`

### 9.4. Endpoints

| Метод | Endpoint | Назначение |
|--------|----------|------------|
| `POST` | `/study-sessions` | Создание |
| `GET` | `/study-sessions/{sessionId}` | Детали |
| `GET` | `/study-sessions/active?deckId=` | Активная сессия по колоде |
| `GET` | `/study-sessions/{sessionId}/current-card` | Текущая карточка |
| `POST` | `/study-sessions/{sessionId}/cancel` | Отмена |
| `POST` | `/study-sessions/{sessionId}/reviews` | Ответ на карточку |

---

## 10. Review и SM-2

### 10.1. Endpoint ответа на карточку

```
POST /study-sessions/{sessionId}/reviews
Body: { sessionCardId, grade, responseTimeMs, clientReviewId }
```

`StudySessionController.submitReview()` → `ReviewService.submit()`

### 10.2. Алгоритм обработки

`ReviewService.submit()`

```
1. resolveUser: получение User
2. Идемпотентность: поиск существующего ReviewLog по userId + clientReviewId
   → если найден: replay() (проверка на совпадение данных, повторный ответ игнорируется)
3. resolveActiveSession: поиск + PESSIMISTIC_WRITE блокировка StudySession
   → проверка ACTIVE
4. resolveCurrentCard: поиск первой PENDING-карточки (PESSIMISTIC_WRITE)
   → проверка порядка: sessionCardId должен совпадать с текущей
5. Получение + PESSIMISTIC_WRITE блокировка CardReviewState
6. sm2ReviewAdapter.schedule(state, grade, now) → ScheduleResult
7. Проверка валидности ScheduleResult (ensureValidSchedule)
8. Создание ReviewLog (buildLog) со снапшотами ДО и ПОСЛЕ
9. Применение расписания к CardReviewState (applySchedule)
10. StudySessionCard.status = REVIEWED, reviewedAt = now
11. session.completedCardsCount += 1
12. Поиск следующей PENDING-карточки
13. Если нет PENDING: session.status = COMPLETED, completedAt = now
14. buildResponse с ReviewResult + SessionProgress + nextCard
```

**Одна транзакция** (`@Transactional`): шаги 1–13 атомарны.

### 10.3. Сопоставление оценок и SM-2

| Оценка | sm2Score | Успешный? | EF delta (от 2.5) |
|--------|----------|-----------|-------------------|
| AGAIN  | 1        | Нет       | -4.40 → 1.3 (clamp) |
| HARD   | 3        | Да        | -0.68 → 1.82 |
| GOOD   | 4        | Да        | -0.08 → 2.42 |
| EASY   | 5        | Да        | +0.20 → 2.70 |

`ReviewGrade.java`, `Scheduler.java`

Успешным считается `isSuccessful()` → `sm2Score >= 3`.

### 10.4. Адаптер SM-2

`Sm2ReviewAdapter.java` — преобразует `CardReviewState` → SM-2 `Item`,
вызывает библиотеку SM-2, преобразует результат обратно.

```java
sm2ReviewAdapter.schedule(state, grade, now)
// state: CardReviewState (Double EF, Integer interval, etc.)
// grade: ReviewGrade (AGAIN/HARD/GOOD/EASY)
// now: Instant
// → ScheduleResult (double easinessFactor, int intervalDays,
//                   int consecutiveCorrectCount, Instant dueAt)
```

### 10.5. Формула SM-2 (Scheduler)

`Scheduler.java`

**Формула EF:**
```
EF' = max(1.3, EF + 0.1 - (5-q) * (0.08 + (5-q) * 0.02))
```
где q — это sm2Score (1, 3, 4, 5).

**Логика изменения interval:**

1. **AGAIN (score < 3):**
   - interval = 0 (повторить немедленно)
   - consecutiveCorrectCount = 0
   - EF не меняется

2. **Успех (score >= 3), первое повторение (count становится 1):**
   - interval = 1 день (static mapping)
   - EF обновляется по формуле

3. **Успех (score >= 3), второе повторение (count становится 2):**
   - interval = 6 дней (static mapping)
   - EF обновляется

4. **Успех (score >= 3), третье и далее:**
   - interval = Math.round(prevInterval * EF)
   - EF обновляется

5. **Lapsed (забыл в течение сессии, но исправился):**
   - consecutiveCorrectCount = 1
   - interval = 1
   - EF **не** обновляется

**Расчёт dueAt:**
```java
dueDate = now + wholeDays + round(24 * fractionalHours)
```

`Scheduler.updateItemSchedule()`

### 10.6. Пример

```
До:
  EF = 2.5, interval = 6, consecutiveCorrect = 2

Ответ: GOOD (q = 4)

EF' = max(1.3, 2.5 + 0.1 - (5-4)*(0.08 + (5-4)*0.02))
    = max(1.3, 2.5 + 0.1 - 1*(0.08 + 1*0.02))
    = max(1.3, 2.5 + 0.1 - 0.10)
    = max(1.3, 2.5)
    = 2.5

correctCount = 3

Фиксированного маппинга для count=3 нет →
  interval = Math.round(6 * 2.5) = Math.round(15.0) = 15

После:
  EF = 2.5, interval = 15, consecutiveCorrect = 3
  dueAt = now + 15 дней
```

### 10.7. Идемпотентность review

`ReviewService.submit()`

- `clientReviewId` (UUID) — генерируется клиентом
- Уникальность: `uk_review_log_user_client_review (user_id, client_review_id)`
- При повторе того же `clientReviewId`:
  - Если все поля совпадают (sessionId, sessionCardId, grade, responseTimeMs) → 200,
    возвращается тот же результат, состояние не пересчитывается
  - Если поля разные → `409 REVIEW_IDEMPOTENCY_CONFLICT`
- Двойная защита: уникальность `study_session_card_id` гарантирует только один ответ
  на карточку в любом случае
- PESSIMISTIC_WRITE блокировки предотвращают race condition на уровне БД

---

## 11. Дневные лимиты и timezone

### 11.1. StudyDayService / DefaultStudyDayService

`StudyDayService.java`, `DefaultStudyDayService.java`

Интерфейс с двумя методами:
- `currentDay(profile, now)` — определение текущего локального дня
- `day(profile, date)` — день по конкретной дате

Результат: `UserDayRange(date, zoneId, start, end)` — полуинтервал `[start, end)`.

Пример для timezone `Europe/Warsaw`:
```
now = 2026-07-29T22:30:00Z (00:30 MSK 30 июля)
date = 2026-07-30
start = 2026-07-29T22:00:00Z (полночь в Варшаве)
end = 2026-07-30T22:00:00Z (полночь следующих суток)
```

### 11.2. DailyLimitService

`DailyLimitService.java`

```java
calculate(userId, profile, day)
→ sumReviewCardsByUserAndStartedAtBetween(userId, day.start, day.end)
→ sumNewCardsByUserAndStartedAtBetween(userId, day.start, day.end)
→ reviewRemaining = max(0, dailyReviewLimit - sumReview)
→ newRemaining = max(0, dailyNewCardsLimit - sumNew)
```

Учитываются сессии со статусом `ACTIVE` и `COMPLETED` (не `CANCELLED`).
`StudySessionRepository.sumReviewCardsByUserAndStartedAtBetween()`,
`StudySessionRepository.sumNewCardsByUserAndStartedAtBetween()`

### 11.3. Логика переиспользуется

`DailyLimitService` вызывается:
- При создании StudySession (для ограничения очереди)
- В DashboardService (для показа remaining)

---

## 12. Dashboard

### 12.1. Endpoint

```
GET /dashboard
→ DashboardResponse {
    generatedAt, timezone, localDate,
    availability, today, cardStates,
    activeSessions, recentSessions, streak
  }
```

`DashboardController.java` → `DashboardService.getDashboard()`

### 12.2. Блоки ответа

| Поле | Описание |
|------|----------|
| `generatedAt` | Момент генерации (Instant) |
| `timezone` | Timezone пользователя |
| `localDate` | Локальная дата |
| `availability` | Доступность карточек и лимиты |
| `today` | Сегодняшняя активность |
| `cardStates` | Распределение карточек по состоянию |
| `activeSessions` | Активные сессии |
| `recentSessions` | 5 последних завершённых |
| `streak` | Текущая и максимальная серия |

### 12.3. Формулы availability

`DashboardService.availability()`
```
dueReviewCardsCount = countDueForDashboard (dueAt IS NOT NULL AND dueAt <= now)
newCardsCount = countNewForDashboard (dueAt IS NULL, ни разу не показаны)
scheduledCardsCount = countScheduledForDashboard (dueAt > now)

availableReviewCardsCount = min(dueReviewCardsCount, remainingReviewLimit)
availableNewCardsCount = min(newCardsCount, remainingNewLimit)
```

`CardReviewStateRepository.countDueForDashboard()`, `countNewForDashboard()`,
`countScheduledForDashboard()`

### 12.4. Today

```
answeredCardsCount = количество ReviewLog сегодня
successRate = успешные / всего * 100 (0 если пусто)
studyTimeMs = sum(responseTimeMs) — только не-null значения
completedSessionsCount = количество COMPLETED-сессий сегодня
gradeDistribution: { again, hard, good, easy }
```

### 12.5. Разница queued и answered

- **queued cards** — карточки, добавленные в сессии (reviewCardsCount + newCardsCount)
  в рамках дневного окна. Учитываются ACTIVE и COMPLETED сессии.
- **answered cards** — карточки, на которые пользователь реально ответил
  (ReviewLog за сегодня).

---

## 13. Statistics

### 13.1. Endpoint

```
GET /statistics/overview?days=30
```

Параметры: `days` от 7 до 90 (по умолчанию 30).

`StatisticsController.java` → `StatisticsService.overview()`

### 13.2. Ответ

```json
{
  "timezone": "...",
  "fromDate": "2026-07-30",
  "toDate": "2026-07-30",
  "totalAnswers": 42,
  "successfulAnswers": 35,
  "successRate": 83.33,
  "totalStudyTimeMs": 120000,
  "averageResponseTimeMs": 5000,
  "completedSessions": 3,
  "gradeDistribution": { "again": 7, "hard": 5, "good": 20, "easy": 10 },
  "streak": { "current": 5, "longest": 10 },
  "activity": [ { "date": "...", "answers": 0, "successful": 0, "studyTimeMs": 0 }, ... ]
}
```

### 13.3. Расчёт

- Период: от `today.date().minusDays(days - 1)` до `today.end()`
- Учитывается timezone пользователя
- Пустые дни (без активности) заполняются нулями
- `totalAnswers` / `successfulAnswers` / `successRate` — по всем ReviewLog в периоде
- `totalStudyTimeMs` = sum(responseTimeMs) — null-значения не участвуют
- `averageResponseTimeMs` = totalStudyTimeMs / количество ненулевых responseTimeMs
- `completedSessions` = количество COMPLETED-сессий в периоде
- `gradeDistribution` — количество каждого ReviewGrade
- `activity` — массив дней с показателями

`null responseTimeMs` исключается из среднего, так как это означает, что клиент
не передал время ответа.

---

## 14. Streak (серия)

`StatisticsService.calculateStreak()`

### Текущий streak

Алгоритм:
1. Начинаем с `today`, идём назад.
2. Если день имеет хотя бы 1 ответ — streak увеличивается.
3. Если сегодня ответов нет, проверяем вчера: если вчера было — streak = 0,
   но текущая дата "вчера", и от неё считаем.
4. Если ни сегодня, ни вчера — streak = 0.

### Longest streak

Считается по всем уникальным датам с активностью (несколько ответов в один день
считаются одним активным днём). Последовательные дни без пропусков формируют серию.

### Примеры

1. Ответы: 27, 28, 29 июля. Сегодня 29 июля.
   → current streak = 3, longest streak = 3

2. Ответы: 25, 26, 27 июля. Сегодня 29 июля (вчера и сегодня нет).
   → current streak = 0, longest streak = 3

3. Ответы: 27, 28 июля. Сегодня 29 июля (сегодня нет, но вчера было).
   → current streak = 2 (28, 27), longest streak = 2

`StatisticsService.calculateStreak():78-94`

---

## 15. Repository layer

### 15.1. Обзор

| Repository | Ключевые запросы |
|------------|-----------------|
| `UserRepository` | `findByEmail`, `existsByEmail` |
| `UserProfileRepository` | `findByUserId` |
| `DeckRepository` | `findAllByOwnerIdAndStatus...`, `findByIdAndOwnerIdAndStatus`, `findByIdAndOwnerId`, `findWithLockByIdAndOwnerId` (PESSIMISTIC_WRITE) |
| `CardRepository` | `findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus` (Page), `findByIdAndDeckOwnerIdAndDeckStatusAndStatus`, `findByIdAndDeckOwnerId` |
| `CardReviewStateRepository` | `findByUserIdAndCardId`, `findWithLockByUserIdAndCardId` (PESSIMISTIC_WRITE), `existsByUserIdAndCardId`, `findDueForStudy` (JPQL), `findNewForStudy` (JPQL), `countDueForDashboard` (JPQL), `countNewForDashboard` (JPQL), `countScheduledForDashboard` (JPQL) |
| `StudySessionRepository` | `findByIdAndUserId`, `findWithLockByIdAndUserId` (PESSIMISTIC_WRITE), `findByUserIdAndDeckIdAndStatus`, `sumReviewCardsByUserAndStartedAtBetween` (JPQL aggregate), `sumNewCardsByUserAndStartedAtBetween` (JPQL aggregate), `countByUserIdAndStatusAndCompletedAtGreaterThanEqualAndCompletedAtLessThan`, `findActiveSummaries` (JPQL constructor), `findRecentCompletedSummaries` (JPQL constructor) |
| `StudySessionCardRepository` | `findFirstBySessionIdAndStatusOrderByPositionAsc`, `findFirstWithLockBySessionIdAndStatusOrderByPositionAsc` (PESSIMISTIC_WRITE), `countBySessionIdAndStatus` |
| `ReviewLogRepository` | `findByUserIdAndClientReviewId`, `findStatisticsByUserAndReviewedAtBetween` (JPQL projection), `findAllStatisticsByUser` (JPQL projection) |

### 15.2. Access-filtered методы

Все методы, возвращающие данные, фильтруют по owner-у:
- `findByIdAndDeckOwnerId(...)` — карточка доступна только владельцу колоды
- `findByIdAndOwnerIdAndStatus(...)` — колода доступна только владельцу
- `findByUserIdAndDeckIdAndStatus(...)` — сессия доступна только владельцу

Чужие ресурсы возвращают `Optional.empty()` → сервис выбрасывает `NotFoundException` → 404.

### 15.3. PESSIMISTIC_WRITE

Применяется в трёх местах:
- `DeckRepository.findWithLockByIdAndOwnerId` — создание сессии
- `StudySessionRepository.findWithLockByIdAndUserId` — review
- `StudySessionCardRepository.findFirstWithLockBySessionIdAndStatusOrderByPositionAsc` — review
- `CardReviewStateRepository.findWithLockByUserIdAndCardId` — review

### 15.4. Projections и конструкторы

- `ReviewLogStatisticsProjection` — проекция (reviewedAt, grade, responseTimeMs)
  для статистики и dashboard
- `ActiveStudySessionResponse` — constructor expression в JPQL для активных сессий
- `RecentStudySessionResponse` — constructor expression для недавних сессий

### 15.5. Пагинация

- `CardRepository.findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus` — `Page<Card>`
- `CardReviewStateRepository.findDueForStudy` / `findNewForStudy` — через `Pageable`
  (limit, не реальная пагинация)
- `StudySessionRepository.findRecentCompletedSummaries` — через `PageRequest.of(0, 5)`

### 15.6. Предотвращение N+1

- Все связи — `FetchType.LAZY`
- Dashboard делает отдельные агрегатные запросы (countDue, countNew, countScheduled)
  вместо загрузки всех состояний
- Статистика использует проекцию вместо загрузки полных entities

---

## 16. Service layer

### 16.1. Обзор

| Service | Ответственность | @Transactional |
|---------|----------------|---------------|
| `AuthService` | Регистрация, логин, генерация JWT | Нет (делегирует UserService) |
| `UserService` | CRUD пользователей и профилей | Нет (read-only и save) |
| `DeckService` | CRUD колод, проверка владения | Да (create, update, archive, restore) |
| `CardService` | CRUD карточек, создание CardReviewState | Да (create, update, archive, restore) |
| `CardReviewStateService` | Управление состояниями | Нет |
| `StudySessionService` | Создание/отмена сессий, очередь | Да (create, cancel) |
| `ReviewService` | Обработка ответов (review) | Да (submit) |
| `Sm2ReviewAdapter` | Преобразование CardReviewState ↔ SM-2 Item | Нет (stateless component) |
| `DailyLimitService` | Расчёт дневных лимитов | Нет (read-only) |
| `DefaultStudyDayService` | Расчёт локального дня по timezone | Нет (stateless) |
| `DashboardService` | Сборка dashboard | Нет (read-only) |
| `StatisticsService` | Статистика и streak | Нет (read-only) |

### 16.2. Где начинается транзакция

Транзакции на уровне сервисов (`@Transactional`):
- `CardService.create()` — создание Card + CardReviewState атомарно
- `StudySessionService.create()` — создание Session + всей очереди атомарно
- `ReviewService.submit()` — полный review pipeline атомарно
- `DeckService` / `CardService` — archive/update/restore

### 16.3. Циклические зависимости

Нет. Сервисы не ссылаются друг на друга циклически. Зависимости:
- `AuthService` → `UserService`
- `CardService` → `UserService`
- `DeckService` → `UserService`
- `StudySessionService` → `UserService`, `StudyDayService`, `DailyLimitService`
- `ReviewService` → `UserService`, `Sm2ReviewAdapter`
- `DashboardService` → `UserService`, `StudyDayService`, `DailyLimitService`, `StatisticsService`
- `StatisticsService` → `UserService`, `StudyDayService`

### 16.4. Разделение ответственности

- **Controller** — принимает HTTP, вызывает сервис, возвращает DTO
- **Service** — бизнес-логика, проверки, координация репозиториев
- **Repository** — доступ к данным
- **Entity** — только данные

Бизнес-логика не находится в контроллерах и репозиториях.

---

## 17. Controller layer

### 17.1. Полный список endpoints

| Метод | Endpoint | Назначение | Auth | Статус |
|-------|----------|------------|------|--------|
| `POST` | `/auth/register` | Регистрация | Нет | 201 |
| `POST` | `/auth/login` | Вход | Нет | 200 |
| `GET` | `/auth/me` | Проверка токена (email) | Да | 200 |
| `GET` | `/users/me` | Текущий пользователь + профиль | Да | 200 |
| `PATCH` | `/users/me/profile` | Обновление профиля | Да | 200 |
| `POST` | `/decks` | Создание колоды | Да | 201 |
| `GET` | `/decks` | Список активных колод | Да | 200 |
| `GET` | `/decks/archived` | Список архивных колод | Да | 200 |
| `GET` | `/decks/{deckId}` | Детали колоды | Да | 200 |
| `PATCH` | `/decks/{deckId}` | Обновление колоды | Да | 200 |
| `DELETE` | `/decks/{deckId}` | Архивирование колоды | Да | 204 |
| `POST` | `/decks/{deckId}/restore` | Восстановление колоды | Да | 200 |
| `POST` | `/cards/decks/{deckId}` | Создание карточки | Да | 201 |
| `GET` | `/cards/decks/{deckId}` | Активные карточки колоды | Да | 200 |
| `GET` | `/cards/decks/{deckId}/archived` | Архивные карточки колоды | Да | 200 |
| `GET` | `/cards/{cardId}` | Детали карточки | Да | 200 |
| `PATCH` | `/cards/{cardId}` | Обновление карточки | Да | 200 |
| `DELETE` | `/cards/{cardId}` | Архивирование карточки | Да | 204 |
| `POST` | `/cards/{cardId}/restore` | Восстановление карточки | Да | 200 |
| `POST` | `/study-sessions` | Создание учебной сессии | Да | 201 |
| `GET` | `/study-sessions/{sessionId}` | Детали сессии | Да | 200 |
| `GET` | `/study-sessions/active?deckId=` | Активная сессия колоды | Да | 200 |
| `GET` | `/study-sessions/{sessionId}/current-card` | Текущая карточка | Да | 200 |
| `POST` | `/study-sessions/{sessionId}/cancel` | Отмена сессии | Да | 204 |
| `POST` | `/study-sessions/{sessionId}/reviews` | Ответ на карточку | Да | 200 |
| `GET` | `/dashboard` | Dashboard | Да | 200 |
| `GET` | `/statistics/overview?days=N` | Статистика | Да | 200 |

Глобальный префикс: `/api` (из `server.servlet.context-path=/api`).

Base URL: `http://localhost:8080/api`

---

## 18. DTO

### 18.1. Почему entities не возвращаются напрямую

- Безопасность: скрытие полей (passwordHash, version)
- Контроль над форматом: имена полей, вложенность
- Стабильность API: изменения entity не ломают клиентов
- Проекции: агрегатные данные (dashboard, статистика)

### 18.2. Группы DTO

| Группа | Классы |
|--------|--------|
| auth | `RegisterRequest`, `LoginRequest`, `AuthResponse` |
| profile | `CurrentUserResponse`, `UpdateUserProfileRequest`, `UserProfileResponse` |
| deck | `CreateDeckRequest`, `UpdateDeckRequest`, `DeckResponse`, `DeckSummaryResponse` |
| card | `CreateCardRequest`, `UpdateCardRequest`, `CardResponse`, `CardSummaryResponse` |
| study session | `CreateStudySessionRequest`, `StudySessionResponse`, `CurrentStudyCardResponse` |
| review | `SubmitReviewRequest`, `SubmitReviewResponse`, `ReviewResultResponse`, `SessionProgressResponse` |
| dashboard | `DashboardResponse`, `StudyAvailabilityResponse`, `TodayStudyResponse`, `CardStateDistributionResponse`, `ActiveStudySessionResponse`, `RecentStudySessionResponse`, `StreakResponse`, `ActivityDayResponse` |
| statistics | `StatisticsOverviewResponse`, `GradeDistributionResponse` |

### 18.3. PATCH-механика

Для `UpdateDeckRequest` и `UpdateCardRequest`:
- Каждое поле имеет `@JsonIgnore` boolean флаг `xxxPresent` (изначально false)
- `@JsonSetter` устанавливает и значение, и флаг
- Отсутствующее в JSON поле → флаг false → не меняется
- `"field": null` → флаг true, значение null → очистка nullable-поля
- `"field": ""` → зависит от сервиса (trim + проверка)
- `hasChanges()` → true если хотя бы один флаг true

Для `UpdateUserProfileRequest` используется проверка `!= null` — менее точный,
но достаточный подход (профиль не имеет обязательных nullable-полей).

---

## 19. Ошибки

### 19.1. Формат

```json
{
  "code": "DECK_NOT_FOUND",
  "message": "Deck was not found",
  "status": 404
}
```

`JsonErrorResponse.java`

### 19.2. Глобальный обработчик

`GlobalExceptionFilter.java` (`@ControllerAdvice`)

### 19.3. HTTP статусы

| Статус | Когда |
|--------|-------|
| 400 | Validation error, пустой PATCH, некорректные параметры |
| 401 | Невалидный/отсутствующий JWT, неверные учётные данные |
| 403 | Не используется (все проверки через 404 для маскировки) |
| 404 | Ресурс не найден или принадлежит другому пользователю |
| 409 | Конфликт состояния (уже архивирован, уже активен, etc.) |
| 500 | Необработанные исключения |

### 19.4. Ключевые error codes

| Code | Исключение | Статус |
|------|-----------|--------|
| `INVALID_ACCESS_TOKEN` | JWT missing/invalid | 401 |
| `INVALID_CREDENTIALS` | Неверный email/пароль | 401 |
| `EMAIL_ALREADY_EXISTS` | Дубликат email | 409 |
| `USER_NOT_FOUND` | Пользователь/профиль не найден | 404 |
| `DECK_NOT_FOUND` | Колода не найдена | 404 |
| `DECK_STATE_CONFLICT` | Конфликт состояния колоды | 409 |
| `DECK_UPDATE_EMPTY` | Пустой PATCH | 400 |
| `CARD_NOT_FOUND` | Карточка не найдена | 404 |
| `CARD_STATE_CONFLICT` | Конфликт состояния карточки | 409 |
| `CARD_UPDATE_EMPTY` | Пустой PATCH | 400 |
| `STUDY_SESSION_NOT_FOUND` | Сессия не найдена | 404 |
| `STUDY_SESSION_ALREADY_ACTIVE` | Дубликат активной сессии | 409 |
| `STUDY_SESSION_NOT_ACTIVE` | Операция на неактивной сессии | 409 |
| `STUDY_SESSION_ALREADY_CANCELLED` | Повторная отмена | 409 |
| `STUDY_SESSION_ALREADY_COMPLETED` | Операция на завершённой | 409 |
| `STUDY_SESSION_CARD_NOT_CURRENT` | Неверный порядок карточек | 409 |
| `REVIEW_IDEMPOTENCY_CONFLICT` | Конфликт идемпотентности | 409 |
| `NO_CARDS_AVAILABLE` | Нет доступных карточек | 409 |
| `VALIDATION_ERROR` | Ошибка валидации | 400 |
| `OPTIMISTIC_LOCK_CONFLICT` | Конкурентное изменение | 409 |
| `DATA_INTEGRITY_VIOLATION` | Нарушение constraint | 409 |

### 19.5. Особенности

- **Чужой ресурс → 404** (не 403): для предотвращения перебора ID.
  `DeckService.findActive()` → `findByIdAndOwnerIdAndStatus()` → `orElseThrow(DeckNotFoundException)`
- **JWT ошибки не превращаются в 500:** `JwtAuthenticationFilter` ловит исключения,
  `CustomAuthenticationEntryPoint` возвращает 401.
- **`DECK_STATE_CONFLICT`** — единый код для конфликтов состояния колоды
  (архивирована, уже активна, уже архивирована).

---

## 20. Транзакции

| Операция | Service method | @Transactional | Что изменяется атомарно |
|----------|---------------|---------------|------------------------|
| Регистрация | `UserService.createUser()` | Нет | User + UserProfile (не в одной транзакции!) |
| Создание карточки | `CardService.create()` | Да | Card + CardReviewState |
| Создание сессии | `StudySessionService.create()` | Да | StudySession + очередь StudySessionCard |
| Review | `ReviewService.submit()` | Да | CardReviewState + ReviewLog + StudySessionCard + StudySession |
| Отмена сессии | `StudySessionService.cancel()` | Да | StudySession.status + cancelledAt |
| Архивирование | `DeckService.archive()` / `CardService.archive()` | Да | Status change |
| Восстановление | `DeckService.restore()` / `CardService.restore()` | Да | Status change |
| Обновление | `DeckService.update()` / `CardService.update()` | Да | Изменение полей |

**Важно:** `UserService.createUser()` не аннотирован `@Transactional`. User
и UserProfile сохраняются не в одной транзакции. Теоретически возможно
состояние, когда User создан, а UserProfile — нет.

**Rollback:** при любом непроверяемом исключении в `@Transactional` методе
все изменения откатываются.

---

## 21. Конкурентность

### 21.1. Механизмы

1. **`@Version` (optimistic locking):** User, Card, Deck, StudySession,
   StudySessionCard, CardReviewState. При конфликте → `ObjectOptimisticLockingFailureException` → 409.
   `ReviewLog` — без @Version (immutable log).

2. **`PESSIMISTIC_WRITE`:** Блокировка строк в БД на время транзакции.
   Применяется в `ReviewService.submit()` для:
   - StudySession (`findWithLockByIdAndUserId`)
   - StudySessionCard (`findFirstWithLockBySessionIdAndStatusOrderByPositionAsc`)
   - CardReviewState (`findWithLockByUserIdAndCardId`)
   И в `StudySessionService.create()` для Deck (`findWithLockByIdAndOwnerId`).

3. **Уникальные ограничения:**
   - `uk_users_email` — предотвращает дубликаты email
   - `uk_card_review_state_user_card` — одно состояние на пару
   - `uk_review_log_user_client_review` — идемпотентность review
   - `uk_review_log_session_card` — один ответ на карточку
   - `uk_study_session_card` — карточка не может быть в сессии дважды
   - `uk_study_session_position` — уникальные позиции

4. **Idempotency key:** `clientReviewId` (UUID) + уникальный constraint.

5. **Постоянный порядок блокировок:** Session → SessionCard → CardReviewState.

### 21.2. Сценарии

1. **Два параллельных создания активной сессии:**
   - `findByUserIdAndDeckIdAndStatus` → H2 не блокирует
   - Уникальный constraint на `(session_id, card_id)` не предотвращает две сессии
   - **Риск:** возможен race condition на H2 (create-check-act). Требуется
     уникальный constraint `(user_id, deck_id, status=ACTIVE)` или
     `PESSIMISTIC_WRITE` на уровне БД.

2. **Два ответа на одну session-card:**
   - `PESSIMISTIC_WRITE` на `StudySessionCard` + `uk_review_log_session_card`
     гарантируют, что только один ответ будет записан.

3. **Два одинаковых `clientReviewId`:**
   - Первый запрос создаёт `ReviewLog`. Второй находит существующий через
     `findByUserIdAndClientReviewId` → `replay()` (200).

4. **Два разных ключа на одну карточку:**
   - `PESSIMISTIC_WRITE` + `uk_review_log_session_card` → второй упадёт с
     `DataIntegrityViolationException`.

5. **Одновременный PATCH одной entity:**
   - Optimistic locking (`@Version`) → второй получит
     `ObjectOptimisticLockingFailureException` → 409.

### 21.3. Покрытие тестами

H2-тесты покрывают:
- Уникальные ограничения (repository tests)
- Идемпотентность review (StudySessionIntegrationTests)
- Оптимистическую блокировку (не тестируется напрямую на H2)

**Не покрыто (требует PostgreSQL/Testcontainers):**
- Race condition при параллельном создании сессии
- Полноценное поведение PESSIMISTIC_WRITE (H2 имеет упрощённую реализацию)
- Optimistic locking conflict при параллельных PATCH

---

## 22. Индексы и производительность

### 22.1. Фактические индексы

| Индекс | Таблица | Колонки | Запрос |
|--------|---------|---------|--------|
| `uk_users_email` | users | email | findByEmail |
| `uk_user_profiles_user` | user_profiles | user_id | findByUserId |
| `uk_card_review_state_user_card` | card_review_states | user_id, card_id | findByUserIdAndCardId |
| `idx_study_sessions_user_deck_status` | study_sessions | user_id, deck_id, status | findByUserIdAndDeckIdAndStatus, aggregate queries |
| `uk_study_session_card` | study_session_cards | session_id, card_id | Уникальность |
| `uk_study_session_position` | study_session_cards | session_id, position | Уникальность |
| `idx_study_session_cards_session_status_position` | study_session_cards | session_id, status, position | findFirstBySessionIdAndStatusOrderByPositionAsc |
| `uk_review_log_user_client_review` | review_logs | user_id, client_review_id | findByUserIdAndClientReviewId |
| `uk_review_log_session_card` | review_logs | session_card_id | 1:1 |
| `idx_review_logs_user_reviewed_at` | review_logs | user_id, reviewed_at | findStatisticsByUserAndReviewedAtBetween |

### 22.2. Отсутствующие индексы

- `cards(deck_id, status)` — нет отдельного индекса, используется
  derived query `findAllByDeckIdAndDeckOwnerIdAndDeckStatusAndStatus`
- `decks(owner_id, status)` — нет отдельного индекса,
  используется `findAllByOwnerIdAndStatusOrderByUpdatedAtDesc`
- `card_review_states(user_id, due_at)` — нет индекса,
  но `findDueForStudy` и `countDueForDashboard` фильтруют по user + dueAt

### 22.3. Производительность

- **Проекции:** `ReviewLogStatisticsProjection` для статистики — не загружает полные entity
- **Агрегаты:** `sumReviewCardsByUserAndStartedAtBetween`, `countBy...` — считают на стороне БД
- **Пагинация:** `Page<Card>` с `PageRequest`
- **Dashboard избегает N+1:** агрегатные запросы в `CardReviewStateRepository` и `StudySessionRepository`
  вместо загрузки коллекций
- **Потенциально дорогие запросы:**
  - `findAllStatisticsByUser` — без временных ограничений (streak по всей истории)
  - `findDueForStudy` / `findNewForStudy` — без индекса на `(user_id, due_at)`
  - `loadDueCards` / `loadNewCards` — join по card.deck + card

---

## 23. Тесты

### 23.1. Обзор

| Test class | Область | Тип | Тестов |
|------------|---------|-----|--------|
| `AuthIntegrationTests` | Auth (register, login, profile) | Интеграционный (MockMvc) | 4 |
| `CardIntegrationTests` | Card lifecycle + access control | Интеграционный (MockMvc) | 2 |
| `CardReviewStateRepositoryTests` | Уникальный constraint CardReviewState | Repository | 1 |
| `CardReviewStateTest` | Начальное состояние CardReviewState | Unit | 1 |
| `DashboardStatisticsSuccessSemanticsTests` | Семантика успешности (HARD=успех) | Unit (Mockito) | 5 |
| `DeckIntegrationTests` | Deck lifecycle + access control | Интеграционный (MockMvc) | 2 |
| `LoopyApplicationTests` | Smoke test (context loads) | Интеграционный | 1 |
| `ReviewLogRepositoryTests` | Уникальный constraint clientReviewId | Repository | 1 |
| `Sm2ReviewAdapterTests` | SM-2 расчёты для NEW и REVIEW | Unit (Parameterized) | 8 |
| `StudyDayServiceTest` | Timezone и границы дня | Unit | 1 |
| `StudySessionCardSelectionRepositoryTests` | Выбор карточек для сессии | Repository | 4 |
| `StudySessionIntegrationTests` | Полный цикл сессии (MockMvc) | Интеграционный (+fixed Clock) | 7 |
| `StudySessionRepositoryTests` | Поиск сессий + уникальные constraints | Repository | 2 |

**Всего: 39 тестов. Результат: BUILD SUCCESS (0 failures, 0 errors).**

### 23.2. Сценарии покрытые тестами

- Регистрация с нормализацией email, создание профиля
- Дубликат email → 409
- Логин (неверный email vs неверный пароль — одинаковый ответ)
- Аутентификация и доступ к профилю
- Deck: создание, нормализация имени, доступ владельца/чужого, PATCH,
  архивирование/восстановление, защита от повторных операций
- Card: создание + автоматический CardReviewState, PATCH, архивирование/восстановление,
  защита от чужих и архивных колод
- CardReviewState: начальные значения, уникальный constraint
- StudySession: создание с выбором REVIEW/NEW, фиксированная очередь,
  изоляция snapshot, активная сессия, отмена, дневные лимиты, timezone,
  полный review flow с идемпотентностью и автозавершением
- ReviewLog: уникальность clientReviewId и sessionCardId
- SM-2: правильные интервалы для AGAIN/HARD/GOOD/EASY на новых и повторных карточках
- Day: границы дня и timezone
- Успешность: HARD считается успешным в dashboard и статистике

### 23.3. Особенности тестов

- H2 in-memory database для всех Spring-тестов
- Фиксированный `Clock` в `StudySessionIntegrationTests` (через `@TestConfiguration`)
- `StudyDayServiceTest` и `DashboardStatisticsSuccessSemanticsTests` — без Spring,
  чистые unit-тесты
- `Sm2ReviewAdapterTests` — параметризованные тесты с `@MethodSource`

---

## 24. Конфигурация

### 24.1. application.properties (production)

```properties
spring.application.name=loopy
server.servlet.context-path=/api
spring.jpa.hibernate.ddl-auto=update
spring.datasource.url=jdbc:postgresql://localhost:5432/loopy
spring.datasource.username=rashid
spring.datasource.password=rashid
app.jwt.secret=<из переменной окружения или файла>
app.jwt.ExpirationMs=9000000
security.allowedOrigins=http://localhost:3000
```

### 24.2. application.properties (test)

```properties
spring.datasource.url=jdbc:h2:mem:loopy;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE;NON_KEYWORDS=INTERVAL
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=create-drop
app.jwt.secret=Pgd8YOXIsKaZiB8H35t2p5TDLJmFtbmeHnLzrcST6Bi0ySGdgNshZkQpAKlZqEGt9YzbrLaC2FpkqOJW5v/PBg==
app.jwt.ExpirationMs=3600000
security.allowedOrigins=http://localhost:3000
```

### 24.3. Важные настройки

- **ddl-auto:** `update` (prod), `create-drop` (test)
- **CORS:** настраивается через `security.allowedOrigins`
- **Jackson:** стандартная конфигурация Spring Boot
- **Clock bean:** `Clock.systemUTC()` в `SecurityConfig.java`
- **Логирование:** `JwtAuthenticationFilter` логирует каждый запрос
  (method, path, status, duration)
- **Профили:** не используются (только default)

### 24.4. Безопасность конфигурации

- `app.jwt.secret` в `application.properties` — хранится в tracked-файле,
  что является риском безопасности. Рекомендуется использовать переменные
  окружения (`JWT_SECRET`) и исключить значение из репозитория.

---

## 25. Полные пользовательские сценарии

### 25.1. Новый пользователь

```
POST /api/auth/register { "name": "Alice", "email": " ALICE@test.com ", "password": "secret123" }
→ email нормализован → "alice@test.com"
→ password хеширован BCrypt
→ User создан
→ UserProfile создан (displayName="Alice", timezone="UTC", dailyNewCardsLimit=20, dailyReviewLimit=100)
→ JWT возвращён
→ GET /api/dashboard → пустой dashboard (нет колод, карточек, сессий)
```

### 25.2. Создание материала

```
POST /api/decks { "name": "English", "description": "Vocabulary" } → 201
POST /api/cards/decks/1 { "front": "cat", "back": "кошка" }
→ Card создана (статус ACTIVE)
→ CardReviewState создан (EF=2.5, interval=0, correctCount=0, dueAt=null, lastReviewedAt=null)
→ 201
```

### 25.3. Первое занятие

```
POST /api/study-sessions { "deckId": 1 }
→ дневные лимиты: reviewRemaining=100, newRemaining=20
→ loadDueCards: пусто (dueAt=null у всех)
→ loadNewCards: 1 карточка (dueAt IS NULL, lastReviewedAt IS NULL, correctCount=0)
→ StudySession создан (reviewCardsCount=0, newCardsCount=1, totalCardsCount=1)
→ StudySessionCard создан (position=1, type=NEW, status=PENDING)

GET /api/study-sessions/1/current-card → cardId=1, front="cat"

POST /api/study-sessions/1/reviews {
  "sessionCardId": 1,
  "grade": "GOOD",
  "clientReviewId": "uuid-..."
}
→ SM-2: EF=2.5, q=4, newEF=2.5, correctCount=1, interval=1 (static mapping)
→ CardReviewState обновлён: EF=2.5, interval=1, correctCount=1,
  lastReviewedAt=NOW, dueAt=NOW+1day
→ ReviewLog создан со снапшотами ДО и ПОСЛЕ
→ StudySessionCard.status = REVIEWED
→ completedCardsCount = 1
→ PENDING карточек нет → session.status = COMPLETED, completedAt = NOW
→ 200 (nextCard = null, remainingCardsCount = 0)
```

### 25.4. Повторение просроченной карточки

```
Через день:
dueAt <= now
→ loadDueCards возвращает карточку
→ тип: REVIEW
→ очередь: REVIEW перед NEW
→ ответ GOOD:
  EF=2.5, correctCount=2, interval=6 (static mapping)
  dueAt = NOW + 6 дней
```

### 25.5. Ошибка сети при review

```
POST /api/study-sessions/1/reviews { ..., "clientReviewId": "uuid-123" }
→ обработан, ReviewLog создан, состояние обновлено
→ клиент не получил ответ (сеть)
→ клиент повторяет запрос с тем же clientReviewId
→ ReviewService находит существующий ReviewLog по userId + clientReviewId
→ replay(): данные совпадают → 200, возвращается тот же результат
→ состояние не пересчитывается
```

### 25.6. Отмена сессии

```
POST /api/study-sessions/1/cancel
→ StudySession.status = CANCELLED
→ cancelledAt = NOW
→ очередь StudySessionCard сохраняется (статусы не меняются)
→ CardReviewState не меняется
→ при расчёте дневных лимитов CANCELLED-сессии игнорируются
→ можно создать новую сессию
```

### 25.7. Архивирование

**Архивирование Deck:**
- Deck больше не появляется в списке активных
- GET /decks/{id} → 404
- Нельзя создать новую сессию для этой колоды (DECK_STATE_CONFLICT)
- Существующая фиксированная очередь не меняется
- CardReviewState сохраняется
- ReviewLog сохраняется (статистика не ломается)

**Архивирование Card:**
- Card больше не появляется в списке активных
- GET /cards/{id} → 404
- Не выбирается в новые сессии
- Существующая фиксированная очередь не меняется
- CardReviewState сохраняется
- ReviewLog сохраняется
- При восстановлении прогресс не теряется

---

## 26. Известные ограничения

- Frontend отсутствует (только backend)
- Refresh token не реализован — только access token
- Восстановление пароля отсутствует
- Верификация email отсутствует
- Внутридневные learning steps отсутствуют (SM-2 даёт минимум 1 день)
- Повтор AGAIN внутри той же сессии не возвращает карточку обратно в очередь
- Undo review отсутствует
- Импорт/экспорт колод отсутствует
- Публичные колоды не реализованы (поле `isPublic` есть, но не используется)
- Ролевая модель отсутствует (все пользователи равны)
- Уведомления отсутствуют
- Testcontainers/PostgreSQL concurrency tests отсутствуют
- Нет уникального ограничения на `(user_id, deck_id, status=ACTIVE)` для StudySession
  (возможен race condition при создании двух активных сессий на H2)
- `UserService.createUser()` не транзакционен — возможен частичный сбой
  (User создан, UserProfile — нет)
- `CardReviewStateNotFoundException` не имеет обработчика в `GlobalExceptionFilter`
  (упадёт в 500)
- JWT secret хранится в tracked-файле конфигурации

---

## 27. Команды запуска

```bash
# Сборка
./mvnw clean package        # Windows: mvnw.cmd clean package

# Тесты
./mvnw test                 # Windows: mvnw.cmd test

# Запуск
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run

# Конкретный тест
./mvnw -Dtest=AuthServiceTest test
```

Приложение слушает порт 8080 (по умолчанию), контекстный путь `/api`.
Требуется PostgreSQL на `localhost:5432` с базой `loopy`.

---

## 28. Направления дальнейшего развития

1. Frontend (React/TypeScript)
2. Refresh token (повышение безопасности)
3. Восстановление пароля и email-верификация
4. Внутридневные learning steps (10 мин, 1 час, etc.)
5. AGAIN-повтор в рамках сессии
6. Undo review
7. Импорт/экспорт (CSV, Anki-совместимый формат)
8. Публичные колоды (реализовать на основе поля `isPublic`)
9. Testcontainers для тестирования PostgreSQL-specific поведения
10. Миграции БД (Flyway/Liquibase) вместо `ddl-auto=update`
11. Вынос JWT secret из tracked-файла в переменные окружения
12. Уникальный constraint для `(user_id, deck_id, status=ACTIVE)` на `study_sessions`
13. Добавить `@Transactional` на `UserService.createUser()`
14. Добавить обработчик `CardReviewStateNotFoundException` в `GlobalExceptionFilter`
