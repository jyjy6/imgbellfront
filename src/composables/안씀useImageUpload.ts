// useImageUpload.ts 파일 수정
import axios from "axios";
import { useLoginStore } from "../stores/loginStore";
import { isRef, ref, type Ref } from "vue"; // Vue 3 사용 시, React를 사용하는 경우 useState로 대체

// 파일 정보를 담을 인터페이스 정의
interface FileInfo {
  url: string; // 임시 S3 URL
  type: string; // 파일 MIME 타입
  file: File; // 원본 파일 객체
}

export function useImageUpload() {
  // 업로드된 파일들을 저장할 상태
  const uploadedFiles = ref<FileInfo[]>([]);
  // 파일 업로드 처리 함수
  const handleFileUpload = async (
    event: Event,
    form?: string[] | Ref<string[]>
  ) => {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      for (const file of files) {
        const fileName = file.name;
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/api/image/presigned-url?filename=${fileName}`
          );
          // 백엔드에서 쿼리파라미터가 있는 S3스토리지 업로드용 PresignedURL과 실제 사용이미지 URL을 응답받음
          const presignedUrl = response.data.presignedUrl;
          const imageUrl: string = response.data.imageUrl;

          // 발급받은 presigned URL을 S3스토리지에 업로드하는 과정
          const uploadResult = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
          });

          // 성공했으면 이미지 URL과 파일 타입을 객체로 저장하고, form이 있으면 URL만 form에 추가
          if (uploadResult.status === 200) {
            const fileInfo: FileInfo = {
              url: imageUrl,
              type: file.type,
              file: file, // 원본 파일 객체 저장
            };

            uploadedFiles.value.push(fileInfo);

            // 기존 form 지원 (필요한 경우)
            if (form) {
              if (isRef(form)) {
                console.log("ref에서올라감");
                form.value.push(imageUrl);
              } else {
                console.log("그냥올라감");
                form.push(imageUrl);
              }
            }
          } else {
            console.error("File upload failed:", uploadResult.statusText);
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            console.error(
              "Upload error:",
              error.response.status,
              error.response.statusText
            );
            console.error("Error data:", error.response.data);
          } else {
            console.error("Upload error:", error);
          }
        }
      }
    }
  };

  // 파일 업로드 확정 함수
  const confirmFileUpload = async (form?: string[] | Ref<string[]>) => {
    const loginStore = useLoginStore();
    const username = loginStore.user?.username || "anonymous";
    const permanentUrls: string[] = [];

    // form이 있다면 기존 임시 URL 초기화
    if (form) {
      if (isRef(form)) {
        form.value = [];
      } else {
        form.length = 0;
      }
    }

    for (const fileInfo of uploadedFiles.value) {
      try {
        // 파일 타입에 따른 폴더 결정
        const folderType = determineFileType(fileInfo.type);

        // 새로운 presigned URL 요청 (폴더 타입 포함)
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/image/permanent-url?filename=${encodeURIComponent(
            fileInfo.file.name
          )}&type=${folderType}`
        );

        const permanentPresignedUrl = response.data.presignedUrl;
        const permanentImageUrl = response.data.imageUrl;

        // 영구 위치에 파일 업로드
        const uploadResult = await fetch(permanentPresignedUrl, {
          method: "PUT",
          body: fileInfo.file,
        });

        if (uploadResult.status === 200) {
          permanentUrls.push(permanentImageUrl);
          if (form) {
            if (isRef(form)) {
              form.value.push(permanentImageUrl);

            } else {
              
              
              form.push(permanentImageUrl);
            }
          }
        } else {
          console.error(
            "Permanent file upload failed:",
            uploadResult.statusText
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          console.error(
            "Permanent upload error:",
            error.response.status,
            error.response.statusText
          );
          console.error("Error data:", error.response.data);
        } else {
          console.error("Permanent upload error:", error);
        }
      }
    }

    // 업로드된 파일 정보와 사용자명을 DB에 저장 요청
    if (permanentUrls.length > 0) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/image/push`,
          {
            urls: permanentUrls,
            username: username,
          }
        );

        // 성공적으로 완료되면 임시 파일 목록 초기화
        uploadedFiles.value = [];

        return permanentUrls;
      } catch (error) {
        console.error("File registration error:", error);
        return null;
      }
    }

    return null;
  };

  // 파일 타입에 따른 폴더 결정
  const determineFileType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType.startsWith("audio/")) {
      return "audio";
    } else if (mimeType.startsWith("video/")) {
      return "video";
    } else {
      return "other";
    }
  };

  return {
    uploadedFiles,
    handleFileUpload,
    confirmFileUpload,
  };
}
