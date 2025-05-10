// composables/useS3Upload.ts - 대용량 파일 지원 컴포저블
import { ref } from "vue";
import axios from "axios";

export const useS3Upload = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const uploadError = ref<string | null>(null);
  const uploadedUrl = ref<string | null>(null);
  const fileDetails = ref<{
    key: string;
    fileType: string;
    fileSize: number;
  } | null>(null);

  // 최대 파일 크기 설정 (클라이언트 측 검증용)
  const MAX_FILE_SIZE = 100 * 1024 * 1024 * 1024;

  const uploadToS3 = async (
    file: File,
    temp: boolean
  ): Promise<string | null> => {
    isUploading.value = true;
    uploadProgress.value = 0;
    uploadError.value = null;

    try {
      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `파일 크기가 너무 큽니다. 최대 ${
            MAX_FILE_SIZE / (1024 * 1024 * 1024)
          }MB까지 가능합니다.`
        );
      }

      // 파일을 base64로 변환
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await axios.post(
        "/api/upload",
        {
          file: fileBase64,
          filename: file.name,
          contentType: file.type,
          temp: temp,
        },
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              uploadProgress.value = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
            }
          },
          // 대용량 파일 전송을 위한 타임아웃 연장
          timeout: 300000, // 5분
        }
      );

      if (response.data.success) {
        uploadedUrl.value = response.data.url;
        fileDetails.value = {
          key: response.data.key,
          fileType: response.data.fileType,
          fileSize: response.data.fileSize,
        };
        return response.data.url;
      } else {
        uploadError.value = "에러났음2" + response.data.error || "업로드 실패";
        return null;
      }
    } catch (error) {
      uploadError.value =
        error instanceof Error
          ? "에러났음3" + error.message
          : "알 수 없는 오류";
      return null;
    } finally {
      isUploading.value = false;
    }
  };

  // 업로드된 파일 삭제 (필요시 구현)
  const deleteFromS3 = async (key: string): Promise<boolean> => {
    try {
      const response = await axios.post("/api/delete-file", { key });
      if (response.data.success) {
        uploadedUrl.value = null;
        fileDetails.value = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadError,
    uploadedUrl,
    fileDetails,
    uploadToS3,
    deleteFromS3,
  };
};
