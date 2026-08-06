import { forumApi } from "../api/forumApi"; import { useForumResource } from "./useForumResource";
export const useForumTopics = (slug: string, page: number, size = 20) => useForumResource(`topics:${slug}:${page}:${size}`, (signal) => forumApi.getForumTopics(slug, page, size, signal), Boolean(slug));
