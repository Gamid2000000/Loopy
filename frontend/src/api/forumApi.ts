import { apiClient } from "./apiClient";
import type { CreateForumPostRequest, CreateForumTopicRequest, CreatedForumPostResponse, CreatedForumTopicResponse, DeletedForumPostResponse, ForumCategory, ForumTopic, ForumTopicSummary, PageResponse, UpdateForumPostRequest, UpdateForumTopicRequest, UpdatedForumPostResponse, UpdatedForumTopicResponse } from "../types/forum";
const query = (page: number, size: number) => new URLSearchParams({ page: String(page), size: String(size) });
export const forumApi = {
  getForumCategories: (signal?: AbortSignal) => apiClient<ForumCategory[]>("/forum/categories", { signal }),
  getForumTopics: (categorySlug: string, page: number, size: number, signal?: AbortSignal) => apiClient<PageResponse<ForumTopicSummary>>(`/forum/categories/${encodeURIComponent(categorySlug)}/topics?${query(page, size)}`, { signal }),
  getForumTopic: (topicId: number, page: number, size: number, signal?: AbortSignal) => apiClient<ForumTopic>(`/forum/topics/${topicId}?${query(page, size)}`, { signal }),
  createForumTopic: (categorySlug: string, request: CreateForumTopicRequest) => apiClient<CreatedForumTopicResponse>(`/forum/categories/${encodeURIComponent(categorySlug)}/topics`, { method: "POST", body: JSON.stringify(request) }),
  createForumPost: (topicId: number, request: CreateForumPostRequest) => apiClient<CreatedForumPostResponse>(`/forum/topics/${topicId}/posts`, { method: "POST", body: JSON.stringify(request) }),
  updateForumTopic: (topicId: number, request: UpdateForumTopicRequest) => apiClient<UpdatedForumTopicResponse>(`/forum/topics/${topicId}`, { method: "PATCH", body: JSON.stringify(request) }),
  deleteForumTopic: (topicId: number, version: number) => apiClient<null>(`/forum/topics/${topicId}?version=${version}`, { method: "DELETE" }),
  updateForumPost: (postId: number, request: UpdateForumPostRequest) => apiClient<UpdatedForumPostResponse>(`/forum/posts/${postId}`, { method: "PATCH", body: JSON.stringify(request) }),
  deleteForumPost: (postId: number, version: number) => apiClient<DeletedForumPostResponse>(`/forum/posts/${postId}?version=${version}`, { method: "DELETE" }),
};
