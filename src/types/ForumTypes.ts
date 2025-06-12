export interface Forum {
  id: number;
  title: string;
  content?: string;
  authorDisplayName: string;
  authorUsername: string;
  type: PostType;
  viewCount: number;
  likeCount: number;
  isDeleted?: boolean;
  createdAt: string; // ISO 8601 문자열 (e.g. "2025-05-24T12:00:00")
  updatedAt?: string;
  commentsCount: ForumComment[] | number; // 댓글목록or댓글수 (게시판 목록에선 숫자, 디테일페이지에선 Comment 그 자체)
}

export interface ForumFormDto {
  title: string;
  content: string;
  type: PostType;
}

export interface ForumComment {
  id: number;
  content: string;
  authorDisplayName: string;
  likeCount: number;
  isDeleted?: boolean;
  parentId?: ForumComment;
  comments: ForumComment[];
  createdAt: string;
  updatedAt: string;
  forumId: number;
}

export interface ForumCommentDto {
  forum: number;
  content: string;
  parent?: number;
}

export type PostType = "NOTICE" | "HOT" | "NORMAL";
