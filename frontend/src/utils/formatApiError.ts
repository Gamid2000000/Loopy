import { ApiError } from "../api/apiError";

const messages: Record<string, string> = {
  FORUM_CATEGORY_NOT_FOUND: "Категория форума не найдена",
  FORUM_TOPIC_NOT_FOUND: "Тема форума не найдена",
  FORUM_TOPIC_LOCKED: "Тема закрыта для новых ответов",
  FORUM_TOPIC_TITLE_INVALID: "Проверьте название темы",
  FORUM_POST_CONTENT_INVALID: "Проверьте текст сообщения",
  CARD_NOT_FOUND: "Карточка не найдена или недоступна",
  DECK_NOT_FOUND: "Колода не найдена или недоступна",
  DECK_STATE_CONFLICT: "Операция недоступна для текущего состояния колоды",
  CARD_STATE_CONFLICT: "Операция недоступна для текущего состояния карточки",
  CARD_UPDATE_EMPTY: "Нет изменений для сохранения",
  CARD_IMPORT_EMPTY: "Нет данных для импорта",
  CARD_IMPORT_TOO_MANY_ROWS: "Слишком много строк для импорта",
  CARD_IMPORT_NO_VALID_ROWS: "Нет валидных строк для импорта",
  CARD_IMPORT_INVALID_ROW: "Невалидная строка импорта",
  OPTIMISTIC_LOCK_CONFLICT: "Карточка была изменена в другом окне. Обновите данные",
  VALIDATION_ERROR: "Проверьте заполнение полей",
  NETWORK_ERROR: "Не удалось подключиться к серверу",
  MUTATION_IN_PROGRESS: "Операция уже выполняется",
};

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) return messages[error.code] ?? "Не удалось выполнить операцию. Попробуйте ещё раз";
  return "Не удалось выполнить операцию. Попробуйте ещё раз";
}
