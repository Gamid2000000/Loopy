export const paths = {
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  decks: "/decks",
  deck: "/decks/:deckId",
  cards: "/decks/:deckId/cards",
  cardImport: "/decks/:deckId/cards/import",
  study: "/study",
  studySession: "/study-sessions/:sessionId",
  statistics: "/statistics",
  profile: "/profile",
} as const;
