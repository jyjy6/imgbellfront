export interface ImageMetadata {
  file: File;
  previewUrl: string;
  imageUrl?: string;
  imageName: string;
  uploaderName: string;
  tags: string[];
  source?: string;
  artist?: string;
  isAdult: boolean;
  isPublic: boolean;
}
