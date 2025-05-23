export interface Forum {
  id: number;
  title: string;
  content: string;
  authorDisplayName: string;
  type: PostType;
  viewCount: number;
  likeCount: number;
  hasImage: boolean;
  isDeleted: boolean;
  createdAt: string; // ISO 8601 문자열 (e.g. "2025-05-24T12:00:00")
  updatedAt: string;
  comments: ForumComment[];
}

export interface ForumFormDto {
  title: string;
  content: string;
  authorDisplayName: string;
  type: PostType;
}

export interface ForumComment {
  id: number;
  content: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  forumId: number;
}

export type PostType = "NOTICE" | "HOT" | "NORMAL";
