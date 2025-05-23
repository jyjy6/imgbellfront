import { ref } from "vue";
import axios from "axios";
import { useLoginStore } from "../stores/loginStore";
import type { ImageMetadata } from "../types/ImageTypes";

export function useImageS3Upload() {
  const loginStore = useLoginStore();
  const imageMetadataForms = ref<ImageMetadata[]>([]);
  const isUploading = ref(false);

  // 임시 URL과 실제 S3 URL 매핑을 위한 Map
  const urlMappings = ref<Map<string, string>>(new Map());

  // 에디터용 파일 선택 핸들러 (단일 파일)
  const handleFileSelect = async (file: File): Promise<string> => {
    if (!file) return "";

    // 임시 미리보기 URL 생성
    const tempUrl = URL.createObjectURL(file);

    // 메타데이터 생성
    const imageMetadata: ImageMetadata = {
      file,
      previewUrl: tempUrl,
      imageUrl: "", // 나중에 S3 URL로 업데이트
      imageName: file.name,
      uploaderName: loginStore.user?.username || "GUEST",
      tags: [],
      imageGrade: "GENERAL",
      isPublic: true,
      fileSize: file.size,
      fileType: file.type,
    };

    imageMetadataForms.value.push(imageMetadata);

    return tempUrl; // 에디터에서 즉시 사용할 임시 URL 반환
  };

  // 모든 이미지를 S3에 업로드하고 URL 매핑 생성
  const uploadImages = async (isRegister?: boolean): Promise<string | void> => {
    if (imageMetadataForms.value.length === 0) return;

    isUploading.value = true;

    try {
      const uploadPromises = imageMetadataForms.value.map(async (imageInfo) => {
        // Presigned URL 요청
        const urlResponse = await axios.get("/api/image/presigned-url", {
          params: {
            filename: imageInfo.file.name,
            filetype: imageInfo.file.type,
          },
        });

        // S3에 파일 업로드
        await fetch(urlResponse.data.presignedUrl, {
          method: "PUT",
          body: imageInfo.file,
          headers: {
            "Content-Type": imageInfo.file.type,
          },
        });

        // S3 URL 저장
        const s3Url = urlResponse.data.imageUrl;
        imageInfo.imageUrl = s3Url;

        if (isRegister) {
          imageMetadataForms.value[0].imageUrl = urlResponse.data.imageUrl;
        }

        // 임시 URL -> S3 URL 매핑 저장
        urlMappings.value.set(imageInfo.previewUrl, s3Url);

        return imageInfo;
      });

      await Promise.all(uploadPromises);

      if (isRegister) {
        return imageMetadataForms.value[0].imageUrl || "";
      }

      console.log("모든 이미지 업로드 완료");
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      throw error;
    } finally {
      isUploading.value = false;
    }
  };

  // 에디터 콘텐츠의 임시 URL을 S3 URL로 변환
  const replaceUrlsInContent = (htmlContent: string): string => {
    let updatedContent = htmlContent;

    urlMappings.value.forEach((s3Url, tempUrl) => {
      // 모든 임시 URL을 S3 URL로 교체
      updatedContent = updatedContent.replace(new RegExp(tempUrl, "g"), s3Url);
    });

    return updatedContent;
  };

  // 이미지 메타데이터를 백엔드에 저장
  const saveImageMetadata = async (): Promise<void> => {
    if (imageMetadataForms.value.length === 0) return;

    const imageUploadData = imageMetadataForms.value.map((info) => ({
      imageUrl: info.imageUrl,
      imageName: info.imageName,
      tags: info.tags,
      source: info.source,
      artist: info.artist,
      imageGrade: info.imageGrade,
      isPublic: info.isPublic,
      uploaderName: info.uploaderName,
      fileSize: info.fileSize,
      fileType: info.fileType,
    }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/image/upload`,
        imageUploadData
      );
      console.log(response.data);
      console.log("이미지 메타데이터 저장 완료");
    } catch (error) {
      console.error("에러남" + error);
      console.error("이미지 메타데이터 저장 중 오류:", error);
      throw error;
    }
  };

  // 리소스 정리
  const cleanup = (): void => {
    // 임시 URL들 해제
    imageMetadataForms.value.forEach((info) => {
      if (info.previewUrl) {
        URL.revokeObjectURL(info.previewUrl);
      }
    });

    // 상태 초기화
    imageMetadataForms.value = [];
    urlMappings.value.clear();
  };

  return {
    uploadImages,
    handleFileSelect,
    files: ref<File[]>([]), // 기존 코드 호환성을 위해 추가
    imageMetadataForms,
    isUploading,
    replaceUrlsInContent,
    saveImageMetadata,
    cleanup,
    urlMappings,
  };
}
