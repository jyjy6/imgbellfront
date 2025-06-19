<template>
  <v-container class="pa-6">
    <!-- 헤더 섹션 -->
    <v-row justify="center" class="mb-8">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-8 rounded-xl">
          <v-card-text class="text-center pa-8">
            <v-avatar size="80" class="mb-4">
              <v-img
                src="https://i.namu.wiki/i/MIxHiAtXvXK1HWg-Nn8kHYtrKwtiudoAbbUNtgnui47JEmscNwc07ObtdPgCM6F_fQMoGZOgC-KKapfMA1QMgA.webp"
                alt="검은수염"
              />
            </v-avatar>
            <h1 class="text-h3 font-weight-bold mb-3 text-primary">
              🎸 검은수염의 이미지 분석소 🎸
            </h1>
            <p class="text-h6 text-grey-darken-1">
              검은수염과 함께하는 AI 이미지 분석!<br />
              이미지를 업로드하거나 URL을 입력하면 검은수염이 분석해드려요~
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 분석 입력 섹션 -->
    <v-row justify="center" class="mb-6">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-4 rounded-xl">
          <v-card-text class="pa-6">
            <!-- 탭 선택 -->
            <v-tabs v-model="activeTab" color="primary" class="mb-6">
              <v-tab value="file">
                <v-icon start>mdi-cloud-upload</v-icon>
                파일 업로드
              </v-tab>
              <v-tab value="url">
                <v-icon start>mdi-link</v-icon>
                URL 입력
              </v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab">
              <!-- 파일 업로드 탭 -->
              <v-tabs-window-item value="file">
                <v-file-input
                  v-model="selectedFile"
                  label="이미지 파일을 선택하세요"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  :loading="isAnalyzing"
                  :disabled="isAnalyzing"
                  class="mb-4"
                  @change="onFileSelected"
                >
                  <template v-slot:selection="{ fileNames }">
                    <v-chip
                      v-for="fileName in fileNames"
                      :key="fileName"
                      color="primary"
                      size="small"
                      label
                    >
                      {{ fileName }}
                    </v-chip>
                  </template>
                </v-file-input>

                <!-- 파일 미리보기 -->
                <v-img
                  v-if="filePreviewUrl"
                  :src="filePreviewUrl"
                  max-height="300"
                  class="rounded-lg mb-4"
                />

                <v-btn
                  @click="analyzeFile"
                  :loading="isAnalyzing"
                  :disabled="!selectedFile || isAnalyzing"
                  color="primary"
                  size="large"
                  block
                  class="rounded-xl"
                >
                  <v-icon start>mdi-magic-staff</v-icon>
                  검은수염이 분석해주기
                </v-btn>
              </v-tabs-window-item>

              <!-- URL 입력 탭 -->
              <v-tabs-window-item value="url">
                <v-text-field
                  v-model="imageUrl"
                  label="이미지 URL을 입력하세요"
                  placeholder="https://example.com/image.jpg"
                  variant="outlined"
                  prepend-inner-icon="mdi-link"
                  :loading="isAnalyzing"
                  :disabled="isAnalyzing"
                  class="mb-4"
                  @keyup.enter="analyzeUrl"
                />

                <!-- URL 미리보기 -->
                <v-img
                  v-if="imageUrl"
                  :src="imageUrl"
                  max-height="300"
                  class="rounded-lg mb-4"
                  @error="onImageError"
                />

                <v-btn
                  @click="analyzeUrl"
                  :loading="isAnalyzing"
                  :disabled="!imageUrl || isAnalyzing"
                  color="primary"
                  size="large"
                  block
                  class="rounded-xl"
                >
                  <v-icon start>mdi-magic-staff</v-icon>
                  검은수염이 분석해주기
                </v-btn>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 로딩 상태 -->
    <v-row v-if="isAnalyzing" justify="center" class="mb-6">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-4 rounded-xl">
          <v-card-text class="text-center pa-8">
            <v-progress-circular
              :size="80"
              :width="6"
              color="primary"
              indeterminate
              class="mb-4"
            />
            <h3 class="text-h5 mb-2">검은수염이 열심히 분석하고 있어요...</h3>
            <p class="text-grey-darken-1">잠시만 기다려주세요 🎸</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 분석 결과 -->
    <v-row v-if="analysisResult && !isAnalyzing" justify="center" class="mb-6">
      <v-col cols="12" md="10" lg="8">
        <v-card class="elevation-6 rounded-xl">
          <v-card-title class="bg-primary text-white pa-6">
            <v-icon start size="large">mdi-brain</v-icon>
            <span class="text-h4">검은수염의 분석 결과</span>
          </v-card-title>

          <v-card-text class="pa-6">
            <!-- 성공 시 결과 -->
            <div v-if="analysisResult.success">
              <!-- 캐릭터 분석 -->
              <v-alert
                type="info"
                variant="tonal"
                class="mb-6 rounded-lg"
                border="start"
                border-color="primary"
              >
                <template v-slot:prepend>
                  <v-avatar size="40">
                    <v-img
                      src="https://i.namu.wiki/i/MIxHiAtXvXK1HWg-Nn8kHYtrKwtiudoAbbUNtgnui47JEmscNwc07ObtdPgCM6F_fQMoGZOgC-KKapfMA1QMgA.webp"
                      alt="검은수염"
                    />
                  </v-avatar>
                </template>
                <v-alert-title class="text-h6 mb-2">
                  🎸 검은수염의 한마디
                </v-alert-title>
                <div
                  class="text-body-1 font-weight-regular"
                  style="line-height: 1.8"
                >
                  {{ analysisResult.imageAnalyze }}
                </div>
              </v-alert>

              <!-- 태그 목록 -->
              <v-card variant="tonal" color="primary" class="rounded-lg">
                <v-card-title class="pb-2">
                  <v-icon start>mdi-tag-multiple</v-icon>
                  추출된 태그들
                </v-card-title>
                <v-card-text>
                  <div class="d-flex flex-wrap gap-2">
                    <v-chip
                      v-for="(tag, index) in analysisResult.tags"
                      :key="index"
                      color="primary"
                      variant="outlined"
                      size="default"
                      class="ma-1"
                    >
                      <v-icon start size="small">mdi-tag</v-icon>
                      {{ tag }}
                    </v-chip>
                  </div>
                  <p
                    v-if="analysisResult.tags.length === 0"
                    class="text-grey-darken-1 mt-2"
                  >
                    태그를 찾지 못했어요... 😅
                  </p>
                </v-card-text>
              </v-card>
            </div>

            <!-- 실패 시 오류 메시지 -->
            <v-alert v-else type="error" variant="tonal" class="rounded-lg">
              <v-alert-title class="mb-2">분석 실패</v-alert-title>
              {{
                analysisResult.errorMessage || "알 수 없는 오류가 발생했습니다."
              }}
            </v-alert>
          </v-card-text>

          <!-- 다시 분석하기 버튼 -->
          <v-card-actions class="pa-6 pt-0">
            <v-btn
              @click="resetAnalysis"
              color="secondary"
              variant="outlined"
              size="large"
              class="rounded-xl"
            >
              <v-icon start>mdi-refresh</v-icon>
              다시 분석하기
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 에러 스낵바 -->
    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="showError = false">
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";

// 타입 정의
interface ImageCharAnalysisResult {
  tags: string[];
  success: boolean;
  imageAnalyze: string;
  errorMessage?: string;
}

// 반응형 상태
const activeTab = ref("file");
const selectedFile = ref<File[]>([]);
const imageUrl = ref("");
const isAnalyzing = ref(false);
const analysisResult = ref<ImageCharAnalysisResult | null>(null);
const showError = ref(false);
const errorMessage = ref("");

// 계산된 속성
const filePreviewUrl = computed(() => {
  if (selectedFile.value && selectedFile.value.length > 0) {
    return URL.createObjectURL(selectedFile.value[0]);
  }
  return null;
});

// // 메서드
// const isValidUrl = (url: string): boolean => {
//   try {
//     new URL(url);
//     return (
//       url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) !== null
//     );
//   } catch {
//     return false;
//   }
// };

const onFileSelected = () => {
  // 파일이 선택되면 URL 탭의 내용 초기화
  if (selectedFile.value && selectedFile.value.length > 0) {
    imageUrl.value = "";
    analysisResult.value = null;
  }
};

const onImageError = () => {
  showErrorMessage("이미지를 로드할 수 없습니다. URL을 확인해주세요.");
};

const showErrorMessage = (message: string) => {
  errorMessage.value = message;
  showError.value = true;
};

const analyzeFile = async () => {
  if (!selectedFile.value || selectedFile.value.length === 0) {
    showErrorMessage("파일을 선택해주세요.");
    return;
  }

  const file = selectedFile.value[0];

  // 파일 크기 체크 (10MB 제한)
  if (file.size > 10 * 1024 * 1024) {
    showErrorMessage("파일 크기는 10MB 이하여야 합니다.");
    return;
  }

  // 이미지 파일 타입 체크
  if (!file.type.startsWith("image/")) {
    showErrorMessage("이미지 파일만 업로드 가능합니다.");
    return;
  }

  try {
    isAnalyzing.value = true;
    analysisResult.value = null;

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post<ImageCharAnalysisResult>(
      `/api/image/ai/char/analyze/file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60초 타임아웃
      }
    );

    analysisResult.value = response.data;

    if (!response.data.success) {
      showErrorMessage(response.data.errorMessage || "분석에 실패했습니다.");
    }
  } catch (error: any) {
    console.error("파일 분석 실패:", error);
    if (error.response?.status === 413) {
      showErrorMessage("파일이 너무 큽니다. 더 작은 파일을 사용해주세요.");
    } else if (error.code === "ECONNABORTED") {
      showErrorMessage("분석 시간이 초과되었습니다. 다시 시도해주세요.");
    } else {
      showErrorMessage("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  } finally {
    isAnalyzing.value = false;
  }
};

const analyzeUrl = async () => {
  if (!imageUrl.value.trim()) {
    showErrorMessage("이미지 URL을 입력해주세요.");
    return;
  }

  // if (!isValidUrl(imageUrl.value)) {
  //   showErrorMessage("올바른 이미지 URL을 입력해주세요.");
  //   return;
  // }

  console.log("이미지보내는주소");

  console.log(`${import.meta.env.VITE_API_BASE_URL}`);
  try {
    isAnalyzing.value = true;
    analysisResult.value = null;

    const response = await axios.post<ImageCharAnalysisResult>(
      `/api/image/ai/char/analyze/`,
      { imageUrl: imageUrl.value },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60초 타임아웃
      }
    );

    analysisResult.value = response.data;

    if (!response.data.success) {
      showErrorMessage(response.data.errorMessage || "분석에 실패했습니다.");
    }
  } catch (error: any) {
    console.error("URL 분석 실패:", error);
    if (error.code === "ECONNABORTED") {
      showErrorMessage("분석 시간이 초과되었습니다. 다시 시도해주세요.");
    } else {
      showErrorMessage("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  } finally {
    isAnalyzing.value = false;
  }
};

const resetAnalysis = () => {
  analysisResult.value = null;
  selectedFile.value = [];
  imageUrl.value = "";
  activeTab.value = "file";
};

// 컴포넌트 언마운트 시 Object URL 정리
import { onUnmounted } from "vue";
onUnmounted(() => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
  }
});
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

.v-btn {
  transition: all 0.2s ease;
}

.v-chip {
  transition: all 0.2s ease;
}

.v-chip:hover {
  transform: scale(1.05);
}

/* 스크롤바 스타일링 */
:deep(.v-card-text) {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

:deep(.v-card-text)::-webkit-scrollbar {
  width: 6px;
}

:deep(.v-card-text)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.v-card-text)::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

/* 애니메이션 효과 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.v-card {
  animation: fadeInUp 0.5s ease-out;
}
</style>
