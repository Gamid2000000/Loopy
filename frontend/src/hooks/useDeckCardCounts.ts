import { useEffect, useRef, useState } from "react";
import { getActiveCards } from "../api/cardsApi";

/**
 * Карта "id колоды -> количество карточек (слов) в ней".
 * Значение `null` означает, что подсчёт для этой колоды ещё не завершён (идёт загрузка).
 */
export type DeckCardCounts = Record<number, number | null>;

/**
 * useDeckCardCounts
 * -----------------
 * Подгружает количество карточек для каждой колоды из переданного списка id.
 * Нужно для того, чтобы на плитке колоды (DeckTile) можно было сразу показать
 * пользователю "сколько слов всего в колоде", ещё до того, как он откроет её.
 *
 * Важно: это чисто фронтенд-решение. Отдельного бэкенд-эндпоинта "количество карточек
 * в колоде" нет, поэтому мы переиспользуем существующий эндпоинт получения карточек
 * колоды (`/cards/decks/{id}`), запрашивая всего 1 запись на страницу — нам важно
 * только значение `totalElements` в ответе, а не сам список карточек.
 *
 * Результаты кэшируются на время жизни компонента: при повторном вызове с тем же
 * набором id колод повторные запросы не отправляются.
 */
export function useDeckCardCounts(deckIds: number[]): DeckCardCounts {
  const [counts, setCounts] = useState<DeckCardCounts>({});
  // Храним id колод, для которых запрос уже был отправлен (или завершён),
  // чтобы не дублировать сетевые запросы при повторных рендерах компонента.
  const requested = useRef<Set<number>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const idsToLoad = deckIds.filter((id) => !requested.current.has(id));
    if (idsToLoad.length === 0) return;

    idsToLoad.forEach((id) => requested.current.add(id));
    // Пока количество не пришло — сразу отмечаем колоду как "загружается" (null),
    // чтобы плитка могла показать индикатор загрузки вместо количества слов.
    setCounts((prev) => {
      const next = { ...prev };
      idsToLoad.forEach((id) => {
        if (!(id in next)) next[id] = null;
      });
      return next;
    });

    idsToLoad.forEach((deckId) => {
      getActiveCards(deckId, { sort: "CREATED_DESC", page: 0, size: 1 }, controller.signal)
        .then((page) => {
          setCounts((prev) => ({ ...prev, [deckId]: page.totalElements }));
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          // Если подсчёт не удался (например, сеть моргнула) — не блокируем интерфейс,
          // просто помечаем количество как "неизвестно" (0), плитка это переживёт.
          requested.current.delete(deckId);
          setCounts((prev) => ({ ...prev, [deckId]: 0 }));
        });
    });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckIds.join(",")]);

  return counts;
}