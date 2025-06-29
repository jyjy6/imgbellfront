import type { TagType } from "./TagTypes";
import type { UserInfo } from "./UserInfoTypes";

//폼 전송 전용
export interface ImageMetadata {
  id?: number;
  file: File;
  previewUrl: string;
  imageUrl: string;
  imageName: string;
  tags: TagType[];
  source?: string;
  artist?: string;
  imageGrade: string;
  isPublic: boolean;
  uploaderName: string;
  fileSize?: number;
  fileType?: string;
}

export interface ImageDto {
  id: number;
  imageUrl: string;
  imageName: string;
  uploaderName: string;
  likeCount: number;
  viewCount: number;
  downloadCount?: number;
  imageGrade: string;
  isPublic: boolean;
}

// ElasticSearch 문서 타입
export interface ElasticImageDto {
  id: string;

  // 기본 이미지 정보
  imageName: string;
  imageUrl: string;
  fileType: string;

  // 업로더 정보
  uploaderId: number;
  uploaderName: string;

  // 출처 정보
  source?: string;
  artist?: string;

  // 통계 정보
  viewCount: number;
  likeCount: number;

  // 등급 및 공개 설정
  imageGrade: string;
  isPublic: boolean;

  // 타임스탬프
  createdAt: string; // ISO 8601 형식
  updatedAt: string; // ISO 8601 형식

  // 태그 정보
  tags: TagDocument[];
  tagNames: string[];

  // 검색 최적화 필드
  searchText: string;
  popularityScore: number;
}

// ElasticSearch 태그 문서 타입
export interface TagDocument {
  id: number;
  name: string;
  category: string;
}

export interface ImageDetailDto {
  id: number;
  imageUrl: string;
  imageName: string;
  uploaderName: string;
  uploader?: UserInfo;
  fileType: string;
  fileSize: number;
  tags: TagType[];
  source: string;
  artist: string;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  imageGrade: string;
  isPublic: boolean;
  isApproved: boolean;
  comments: any[];
}

export interface RecentViewItem {
  imageId: number;
  imageUrl: string;
}
