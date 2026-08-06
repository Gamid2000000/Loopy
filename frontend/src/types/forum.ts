export interface ForumAuthor { id: number; username: string; }
export interface ForumCategory { id: number; slug: string; name: string; description: string | null; topicsCount: number; lastActivityAt: string | null; }
export interface ForumCategoryBrief { id: number; slug: string; name: string; }
export interface ForumTopicSummary { id: number; categorySlug: string; title: string; author: ForumAuthor; pinned: boolean; locked: boolean; postsCount: number; createdAt: string; lastActivityAt: string; }
export interface ForumPost { id: number; author: ForumAuthor; content: string; createdAt: string; updatedAt: string; edited: boolean; }
export interface PageResponse<T> { content: T[]; totalPages: number; totalElements: number; size: number; number: number; first: boolean; last: boolean; empty: boolean; }
export interface ForumTopic { id: number; category: ForumCategoryBrief; title: string; author: ForumAuthor; pinned: boolean; locked: boolean; postsCount: number; createdAt: string; updatedAt: string; lastActivityAt: string; posts: PageResponse<ForumPost>; }
export interface CreateForumTopicRequest { title: string; content: string; }
export interface CreateForumPostRequest { content: string; }
export interface CreatedForumTopicResponse { topicId: number; firstPostId: number; categorySlug: string; title: string; createdAt: string; }
export interface CreatedForumPostResponse { postId: number; topicId: number; postsCount: number; createdAt: string; }
