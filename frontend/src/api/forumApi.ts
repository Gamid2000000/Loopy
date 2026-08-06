import { apiClient } from "./apiClient";
import type { CreateForumPostRequest, CreateForumTopicRequest, CreatedForumPostResponse, CreatedForumTopicResponse, ForumCategory, ForumTopic, ForumTopicSummary, PageResponse } from "../types/forum";
const query = (page: number, size: number) => new URLSearchParams({ page: String(page), size: String(size) });
export const forumApi = {
  getForumCategories: (signal?: AbortSignal) => apiClient<ForumCategory[]>("/forum/categories", { signal }),
  getForumTopics: (categorySlug: string, page: number, size: number, signal?: AbortSignal) => apiClient<PageResponse<ForumTopicSummary>>(`/forum/categories/${encodeURIComponent(categorySlug)}/topics?${query(page, size)}`, { signal }),
  getForumTopic: (topicId: number, page: number, size: number, signal?: AbortSignal) => apiClient<ForumTopic>(`/forum/topics/${topicId}?${query(page, size)}`, { signal }),
  createForumTopic: (categorySlug: string, request: CreateForumTopicRequest) => apiClient<CreatedForumTopicResponse>(`/forum/categories/${encodeURIComponent(categorySlug)}/topics`, { method: "POST", body: JSON.stringify(request) }),
  createForumPost: (topicId: number, request: CreateForumPostRequest) => apiClient<CreatedForumPostResponse>(`/forum/topics/${topicId}/posts`, { method: "POST", body: JSON.stringify(request) }),
};
