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
          chips
          show-size
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
                  :value="loginStore.user?.username || 'GUEST'"
                  style="display: none"
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
                  item-title="name"
                  closable-chips
                  multiple
                  label="태그를 입력하고 ENTER!"
                  hint="이미지와 관련된 태그를 입력하고 ENTER!"
                  @update:modelValue="handleTagUpdate(imageInfo, $event)"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip
                      class="ma-1"
                      size="large"
                      color="primary"
                      variant="outlined"
                      @click="removeTag(imageInfo, item.raw as TagType)"
                    >
                      {{ (item.raw as TagType).name }}
                    </v-chip>
                  </template>
                </v-combobox>
              </v-col>
              <v-col cols="12">
                <div v-if="imageInfo.tags && imageInfo.tags.length > 0">
                  <h4>태그 상세 정보</h4>
                  <div
                    v-for="(tag, tagIndex) in imageInfo.tags"
                    :key="tagIndex"
                    class="mb-4 pa-3"
                    style="border: 1px solid #eee; border-radius: 4px"
                  >
                    <v-row dense>
                      <v-col cols="12">
                        <strong>태그: {{ tag.name }}</strong>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="tag.description"
                          label="설명"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="tag.category"
                          label="카테고리"
                          density="compact"
                          hide-details="auto"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </div>
                </div>
              </v-col>

              <!-- 기타 옵션 -->
              <v-col cols="12">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="imageInfo.imageGrade"
                      label="등급 선택"
                      :items="imageGrades"
                      item-title="label"
                      item-value="value"
                      color="warning"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="imageInfo.isPublic"
                      label="이미지 공개 여부"
                      color="primary"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <AIImageAnalysisComponent
          :imageUrl="imageInfo.previewUrl"
          :imageFile="imageInfo.file"
          @add-tag="(tagName) => addTagToImage(imageInfo, tagName)"
          @set-grade="(grade) => setImageGrade(imageInfo, grade)"
        />
      </v-col>

      <!-- 업로드 버튼 -->
      <v-col cols="12" v-if="imageMetadataForms.length > 0">
        <v-btn
          color="primary"
          block
          @click="uploadImage"
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

import { useLoginStore } from "../stores/loginStore";
import { onMounted } from "vue";
import { useImageS3Upload } from "../composables/useImageS3Upload";
import type { ImageMetadata } from "../types/ImageTypes";
import type { TagType } from "../types/TagTypes";
import { useRouter } from "vue-router";
import AIImageAnalysisComponent from "./AIImageAnalysisComponent.vue";

// 로그인 스토어 초기화
const loginStore = useLoginStore();

// 상태 관리 반응형 변수들
const {
  files,
  imageMetadataForms,
  isUploading,
  uploadImages,
  saveImageMetadata,
  handleFileSelect,
} = useImageS3Upload();
// 태그 제거 함수
// 태그 제거 함수 (splice 사용 방식으로 수정)
const removeTag = (imageInfo: ImageMetadata, tagToRemove: TagType) => {
  console.log("Removing tag:", tagToRemove.name);

  // tags 배열에서 제거할 태그의 인덱스를 찾습니다.
  const index = imageInfo.tags.findIndex(
    (tag) => tag.name === tagToRemove.name
  );

  // 인덱스를 찾았다면 (태그가 존재한다면)
  if (index !== -1) {
    // splice를 사용하여 해당 인덱스의 요소 1개를 제거합니다.
    // 이 방식이 배열 변이를 직접 일으켜 Vue 반응성을 더 확실하게 트리거합니다.
    imageInfo.tags.splice(index, 1);
    console.log("Tag removed successfully, new tags array:", imageInfo.tags);
  } else {
    console.log("Tag not found in the array:", tagToRemove.name);
  }
};

const handleTagUpdate = (
  imageInfo: ImageMetadata,
  updatedTags: (string | TagType)[]
) => {
  console.log(imageInfo);
  // updatedTags 배열을 순회하며 string 형태의 태그를 TagType 객체로 변환
  imageInfo.tags = updatedTags.map((tag) => {
    if (typeof tag === "string") {
      // 새로 입력된 문자열 태그는 기본 TagType 객체로 변환
      return { name: tag, description: "", category: "" } as TagType;
    }
    // 이미 TagType 객체인 경우는 그대로 사용 (예: suggestedTags에서 선택된 경우)
    // item-value="this" 설정으로 SuggestedTags의 TagType 객체가 그대로 넘어옴
    return tag as TagType;
  });
};

// 제안된 태그 목록
const suggestedTags = ref([
  { name: "풍경" },
  { name: "초상화" },
  { name: "인물", description: "사람이 나오는 이미지" },
  { name: "동물" },
]);
const imageGrades = ref([
  { label: "일반", value: "GENERAL" },
  { label: "성인", value: "ADULT" },
  { label: "EXTREME", value: "EXTREME" },
]);

onMounted(() => {
  imageMetadataForms.value = [];
});

const router = useRouter();
// AI 분석 결과로 태그 추가
const addTagToImage = (imageInfo: ImageMetadata, tagName: string) => {
  // 이미 존재하는 태그인지 확인
  const existingTag = imageInfo.tags.find((tag) => tag.name === tagName);

  if (!existingTag) {
    // 새 태그 추가
    const newTag: TagType = {
      name: tagName,
      description: `AI가 추천한 태그: ${tagName}`,
      category: "AI추천",
    };
    imageInfo.tags.push(newTag);
    console.log(`태그 "${tagName}" 추가됨`, imageInfo.tags);
  } else {
    console.log(`태그 "${tagName}"는 이미 존재함`);
  }
};

// AI 분석 결과로 등급 설정
const setImageGrade = (imageInfo: ImageMetadata, grade: string) => {
  // AI 등급을 시스템 등급으로 매핑
  const gradeMapping: Record<string, string> = {
    S: "GENERAL",
    A: "GENERAL",
    B: "GENERAL",
    C: "ADULT",
    D: "EXTREME",
  };

  imageInfo.imageGrade = gradeMapping[grade] || "GENERAL";
  console.log(`등급 "${grade}" → "${imageInfo.imageGrade}" 설정됨`);
};

// 이미지 업로드 함수
const uploadImage = async () => {
  isUploading.value = true;
  try {
    await uploadImages();
    await saveImageMetadata();
    alert("이미지 업로드 성공!");
    router.back();
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    alert("이미지 업로드 실패!");
  } finally {
    isUploading.value = false;
  }
};
</script>

<style scoped>
/* 필요한 경우 추가 스타일링 */
</style>
