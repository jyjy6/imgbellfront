import { ref } from "vue";
import axios from "axios";
import { useLoginStore } from "../stores/loginStore";
import type { ImageMetadata } from "../types/ImageTypes";

export function useImageS3Upload() {
  const loginStore = useLoginStore();
  const files = ref<File[]>([]);
  const imageMetadataForms = ref<ImageMetadata[]>([]);
  const isUploading = ref(false);

  // 파일 선택 핸들러
  const handleFileSelect = () => {
    // 기존 메타데이터 폼 초기화
    imageMetadataForms.value = [];

    // 선택된 파일들에 대해 메타데이터 폼 생성
    files.value.forEach((file) => {
      // 파일 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);

      // 기본 메타데이터 폼 생성
      imageMetadataForms.value.push({
        file,
        previewUrl,
        imageUrl: "",
        imageName: file.name, // 기본값으로 파일 이름 사용
        uploaderName: loginStore.user?.username || "GUEST",
        tags: [],
        imageGrade: "GENERAL",
        isPublic: true,
        fileSize: file.size, // 파일 크기 (bytes 단위)
        fileType: file.type, // 파일 MIME 타입
      });
    });
  };

  const uploadImages = async (isRegister?: boolean): Promise<string | void> => {
    isUploading.value = true;

    try {
      // 각 이미지 업로드 및 URL 획득
      const uploadPromises = imageMetadataForms.value.map(async (imageInfo) => {
        // FormData를 사용한 파일 업로드
        const formData = new FormData();
        formData.append("file", imageInfo.file);

        // 임시 S3 URL 획득
        const urlResponse = await axios.get("/api/image/presigned-url", {
          params: {
            filename: imageInfo.file.name,
            filetype: imageInfo.file.type,
          },
        });

        // S3 업로드
        // await axios.put(urlResponse.data.presignedUrl, imageInfo.file, {
        //   headers: { "Content-Type": imageInfo.file.type },
        // });

        await fetch(urlResponse.data.presignedUrl, {
          method: "PUT",
          body: imageInfo.file,
        });

        // 이미지 URL 저장
        imageInfo.imageUrl = urlResponse.data.imageUrl;

        if (isRegister) {
          imageMetadataForms.value[0].imageUrl = urlResponse.data.imageUrl;
        }

        // 회원가입일시 Image테이블에 upload는 하지 않음
      });

      // 모든 파일 업로드 대기
      await Promise.all(uploadPromises);

      if (isRegister) {
        return imageMetadataForms.value[0].imageUrl || "";
      }

      // 메타데이터와 함께 백엔드에 이미지 정보 전송
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

      console.log("이미지 데이터들:");
      console.log(imageUploadData);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/image/upload`,
          imageUploadData
        );
        console.log(response.data);
      } catch (error) {
        console.error("에러남" + error);
      }

      // 성공 처리
      alert("모든 이미지가 성공적으로 업로드되었습니다.");

      // 폼 초기화
      files.value = [];
      imageMetadataForms.value = [];
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      isUploading.value = false;
    }
  };

  return {
    uploadImages,
    handleFileSelect,
    files,
    imageMetadataForms,
    isUploading,
  };
}
