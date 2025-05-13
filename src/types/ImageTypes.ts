import type { TagType } from "./TagTypes";

export interface ImageMetadata {
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
