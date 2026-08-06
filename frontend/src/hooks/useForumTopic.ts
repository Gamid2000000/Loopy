import { forumApi } from "../api/forumApi"; import { useForumResource } from "./useForumResource";
export const useForumTopic = (id: number | null, page: number, size = 20) => useForumResource(`topic:${id}:${page}:${size}`, (signal) => forumApi.getForumTopic(id as number, page, size, signal), id !== null);
