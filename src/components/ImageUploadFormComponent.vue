<template>
  <v-container>
    <v-row>
      <!-- 이미지 업로드 입력 -->
      <v-col cols="12">
        <v-file-input
          v-model="files"
          label="이미지 업로드"
          accept="image/*"
          multiple
          prepend-icon="mdi-camera"
          @change="handleFileSelect"
        ></v-file-input>
      </v-col>

      <!-- 이미지 메타데이터 입력 폼 -->
      <v-col
        v-for="(imageInfo, index) in imageMetadataForms"
        :key="index"
        cols="12"
        class="mb-4"
      >
        <v-card>
          <v-card-title>
            <v-img :src="imageInfo.previewUrl" height="200" contain></v-img>
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- 기본 이미지 정보 입력 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="imageInfo.imageName"
                  label="이미지 이름"
                  hint="선택적으로 이미지에 이름을 지정할 수 있습니다"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="imageInfo.uploaderName"
                  label="업로더 이름"
                  :value="loginStore.user?.username || '익명'"
                ></v-text-field>
              </v-col>

              <!-- 추가 메타데이터 입력 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="imageInfo.source"
                  label="출처 URL"
                  hint="이미지의 원본 출처를 입력하세요"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="imageInfo.artist"
                  label="아티스트/작가"
                  hint="이미지의 제작자를 입력하세요"
                ></v-text-field>
              </v-col>

              <!-- 태그 입력 -->
              <v-col cols="12">
                <v-combobox
                  v-model="imageInfo.tags"
                  :items="suggestedTags"
                  chips
                  multiple
                  label="태그"
                  hint="이미지와 관련된 태그를 입력하세요"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip
                      close
                      @click:close="removeTag(imageInfo, item.title)"
                    >
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-combobox>
              </v-col>

              <!-- 기타 옵션 -->
              <v-col cols="12">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="imageInfo.isAdult"
                      label="성인물"
                      color="warning"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="imageInfo.isPublic"
                      label="공개 여부"
                      color="primary"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 업로드 버튼 -->
      <v-col cols="12" v-if="imageMetadataForms.length > 0">
        <v-btn
          color="primary"
          block
          @click="uploadImages"
          :disabled="isUploading"
        >
          {{ isUploading ? "업로드 중..." : "이미지 업로드" }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";

import axios from "axios";
import { useLoginStore } from "../stores/loginStore";
import { onMounted } from "vue";
import { useImageS3Upload } from "../composables/useImageS3Upload";

// 이미지 메타데이터 인터페이스
interface ImageMetadata {
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

// 로그인 스토어 초기화
const loginStore = useLoginStore();

// 상태 관리 반응형 변수들
const { files, imageMetadataForms, isUploading, handleFileSelect } =
  useImageS3Upload();
// 태그 제거 함수
const removeTag = (imageInfo: ImageMetadata, tag: string) => {
  imageInfo.tags = imageInfo.tags.filter((t) => t !== tag);
};

// 제안된 태그 목록
const suggestedTags = ref([
  { title: "풍경" },
  { title: "초상화" },
  { title: "추상" },
  { title: "디지털아트" },
  { title: "자연" },
  { title: "도시" },
  { title: "인물" },
  { title: "동물" },
]);

onMounted(() => {
  imageMetadataForms.value = [];
});

// 이미지 업로드 함수
const uploadImages = async () => {
  isUploading.value = true;

  try {
    // 각 이미지 업로드 및 URL 획득
    const uploadPromises = imageMetadataForms.value.map(async (imageInfo) => {
      // FormData를 사용한 파일 업로드
      const formData = new FormData();
      formData.append("file", imageInfo.file);

      // 임시 S3 URL 획득
      const urlResponse = await axios.get("/api/image/presigned-url", {
        params: { filename: imageInfo.file.name },
      });

      // S3 업로드
      await axios.put(urlResponse.data.presignedUrl, imageInfo.file, {
        headers: { "Content-Type": imageInfo.file.type },
      });

      // 이미지 URL 저장
      imageInfo.imageUrl = urlResponse.data.imageUrl;
    });

    // 모든 파일 업로드 대기
    await Promise.all(uploadPromises);

    // 메타데이터와 함께 백엔드에 이미지 정보 전송
    const imageUploadData = imageMetadataForms.value.map((info) => ({
      imageUrl: info.imageUrl,
      imageName: info.imageName,
      uploaderName: info.uploaderName,
      tags: info.tags,
      source: info.source,
      artist: info.artist,
      isAdult: info.isAdult,
      isPublic: info.isPublic,
    }));

    try {
      const response = await axios.post("/api/image/upload", imageUploadData);
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
</script>

<style scoped>
/* 필요한 경우 추가 스타일링 */
</style>
