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
  imageGrade: string;
  isPublic: boolean;
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
