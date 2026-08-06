import { forumApi } from "../api/forumApi"; import { useForumResource } from "./useForumResource";
export const useForumCategories = () => useForumResource("categories", forumApi.getForumCategories);
