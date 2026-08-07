import { ApiError } from "../api/apiError";

const messages: Record<string, string> = {
  FORUM_CATEGORY_NOT_FOUND: "Категория форума не найдена",
  FORUM_TOPIC_NOT_FOUND: "Тема форума не найдена",
  FORUM_POST_NOT_FOUND: "Сообщение не найдено",
  FORUM_TOPIC_LOCKED: "Тема закрыта для изменений",
  FORUM_TOPIC_TITLE_INVALID: "Проверьте название темы",
  FORUM_POST_CONTENT_INVALID: "Проверьте текст сообщения",
  FORUM_TOPIC_FORBIDDEN: "Нет доступа к редактированию темы",
  FORUM_POST_FORBIDDEN: "Нет доступа к редактированию сообщения",
  FORUM_CONTENT_VERSION_CONFLICT: "Контент был изменён в другой вкладке. Обновите страницу и повторите действие",
  FORUM_FIRST_POST_DELETE_FORBIDDEN: "Первое сообщение темы нельзя удалить отдельно",
  OPTIMISTIC_LOCK_CONFLICT: "Контент был изменён в другой вкладке. Обновите страницу и повторите действие",
  CARD_NOT_FOUND: "Карточка не найдена или недоступна",
  DECK_NOT_FOUND: "Колода не найдена или недоступна",
  DECK_STATE_CONFLICT: "Операция недоступна для текущего состояния колоды",
  CARD_STATE_CONFLICT: "Операция недоступна для текущего состояния карточки",
  CARD_UPDATE_EMPTY: "Нет изменений для сохранения",
  CARD_IMPORT_EMPTY: "Нет данных для импорта",
  CARD_IMPORT_TOO_MANY_ROWS: "Слишком много строк для импорта",
  CARD_IMPORT_NO_VALID_ROWS: "Нет валидных строк для импорта",
  CARD_IMPORT_INVALID_ROW: "Невалидная строка импорта",
  VALIDATION_ERROR: "Проверьте заполнение полей",
  NETWORK_ERROR: "Не удалось подключиться к серверу",
  MUTATION_IN_PROGRESS: "Операция уже выполняется",
};

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) return messages[error.code] ?? "Не удалось выполнить операцию. Попробуйте ещё раз";
  return "Не удалось выполнить операцию. Попробуйте ещё раз";
}
