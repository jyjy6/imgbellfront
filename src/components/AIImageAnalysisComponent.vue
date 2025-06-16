<template>
  <div class="ai-analysis-component">
    <!-- AI 분석 버튼 -->
    <v-btn
      v-if="!isAnalyzing && !analysisResult"
      @click="analyzeImage"
      color="primary"
      variant="outlined"
      prepend-icon="mdi-robot"
      :disabled="!imageUrl && !imageFile"
      class="mb-3"
    >
      🤖 AI로 자동 분석하기
    </v-btn>

    <!-- 분석 중 표시 -->
    <div v-if="isAnalyzing" class="text-center mb-3">
      <v-progress-circular
        indeterminate
        color="primary"
        class="mr-2"
      ></v-progress-circular>
      <span>🤖 AI가 이미지를 분석하고 있습니다...</span>
    </div>

    <!-- 분석 결과 표시 -->
    <v-card
      v-if="analysisResult && analysisResult.success"
      class="mb-3"
      elevation="2"
    >
      <v-card-title class="text-h6 bg-primary text-white">
        🎯 AI 분석 결과
      </v-card-title>

      <v-card-text>
        <!-- 추천 태그 -->
        <div class="mb-4">
          <h4 class="mb-2">🏷️ 추천 태그</h4>
          <div v-if="analysisResult.tags && analysisResult.tags.length > 0">
            <v-chip
              v-for="tag in analysisResult.tags"
              :key="tag"
              @click="addTag(tag)"
              color="success"
              variant="outlined"
              class="ma-1"
              clickable
            >
              {{ tag }}
              <v-icon right small>mdi-plus</v-icon>
            </v-chip>
            <p class="text-caption mt-2 text-grey-600">
              💡 클릭하면 태그가 추가됩니다
            </p>
          </div>
          <p v-else class="text-grey-600">추천할 태그가 없습니다.</p>
        </div>

        <!-- 품질 등급 -->
        <div class="mb-4">
          <h4 class="mb-2">⭐ 품질 등급</h4>
          <v-chip
            :color="getGradeColor(analysisResult.grade)"
            size="large"
            @click="applyGrade"
            clickable
          >
            {{ analysisResult.grade }}등급
            <v-icon right small>mdi-arrow-right</v-icon>
          </v-chip>
          <p class="text-caption mt-1 text-grey-600">
            📊 품질 점수: {{ (analysisResult.qualityScore * 100).toFixed(1) }}%
          </p>
        </div>

        <!-- 안전성 검사 -->
        <div class="mb-4">
          <h4 class="mb-2">🛡️ 안전성 검사</h4>
          <v-chip
            :color="analysisResult.isAppropriate ? 'success' : 'error'"
            :icon="
              analysisResult.isAppropriate
                ? 'mdi-check-circle'
                : 'mdi-alert-circle'
            "
          >
            {{ analysisResult.isAppropriate ? "안전함" : "부적절함" }}
          </v-chip>
        </div>

        <!-- AI 신뢰도 -->
        <div class="mb-3">
          <h4 class="mb-2">🎯 AI 신뢰도</h4>
          <v-progress-linear
            :model-value="analysisResult.confidence * 100"
            color="primary"
            height="20"
            rounded
          >
            <template v-slot:default="{ value }">
              <strong>{{ Math.ceil(value) }}%</strong>
            </template>
          </v-progress-linear>
        </div>

        <!-- 적용 버튼들 -->
        <div class="d-flex gap-2">
          <v-btn @click="applyAllSuggestions" color="success" variant="flat">
            ✨ 모든 제안 적용
          </v-btn>
          <v-btn @click="resetAnalysis" color="grey" variant="outlined">
            🔄 다시 분석
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 분석 실패 표시 -->
    <v-alert
      v-if="analysisResult && !analysisResult.success"
      type="error"
      class="mb-3"
    >
      {{ analysisResult.errorMessage || "AI 분석에 실패했습니다." }}
      <v-btn @click="resetAnalysis" variant="text" class="ml-2"
        >다시 시도</v-btn
      >
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

// Props
interface Props {
  imageUrl?: string;
  imageFile?: File;
  modelValue?: {
    tags: any[];
    imageGrade: string;
  };
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: any];
  "add-tag": [tag: string];
  "set-grade": [grade: string];
}>();

// 상태 관리
const isAnalyzing = ref(false);
const analysisResult = ref<any>(null);

// 이미지 AI 분석 함수
const analyzeImage = async () => {
  // 파일이 있으면 파일 업로드 방식으로, 없으면 URL 방식으로
  if (props.imageFile) {
    await analyzeImageByFile();
  } else if (props.imageUrl) {
    await analyzeImageByUrl();
  } else {
    alert("분석할 이미지가 없습니다.");
  }
};

// 파일 업로드 방식으로 이미지 분석
const analyzeImageByFile = async () => {
  if (!props.imageFile) {
    alert("분석할 이미지 파일이 없습니다.");
    return;
  }

  isAnalyzing.value = true;

  try {
    const formData = new FormData();
    formData.append("file", props.imageFile);

    const response = await axios.post("/api/image/ai/analyze/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    analysisResult.value = response.data;
    console.log("AI 분석 결과 (파일):", analysisResult.value);
  } catch (error: any) {
    console.error("AI 분석 오류 (파일):", error);
    analysisResult.value = {
      success: false,
      errorMessage:
        error.response?.data?.error || "AI 분석 중 오류가 발생했습니다.",
    };
  } finally {
    isAnalyzing.value = false;
  }
};

// URL 방식으로 이미지 분석 (기존 방식)
const analyzeImageByUrl = async () => {
  if (!props.imageUrl) {
    alert("분석할 이미지 URL이 없습니다.");
    return;
  }

  isAnalyzing.value = true;

  try {
    const response = await axios.post("/api/image/ai/analyze", {
      imageUrl: props.imageUrl,
    });

    analysisResult.value = response.data;
    console.log("AI 분석 결과 (URL):", analysisResult.value);
  } catch (error: any) {
    console.error("AI 분석 오류 (URL):", error);
    analysisResult.value = {
      success: false,
      errorMessage:
        error.response?.data?.error || "AI 분석 중 오류가 발생했습니다.",
    };
  } finally {
    isAnalyzing.value = false;
  }
};

// 태그 추가
const addTag = (tagName: string) => {
  emit("add-tag", tagName);
};

// 등급 적용
const applyGrade = () => {
  if (analysisResult.value?.grade) {
    emit("set-grade", analysisResult.value.grade);
  }
};

// 모든 제안 적용
const applyAllSuggestions = () => {
  if (!analysisResult.value) return;

  // 태그들 추가
  if (analysisResult.value.tags) {
    analysisResult.value.tags.forEach((tag: string) => {
      addTag(tag);
    });
  }

  // 등급 적용
  if (analysisResult.value.grade) {
    applyGrade();
  }
};

// 분석 초기화
const resetAnalysis = () => {
  analysisResult.value = null;
  isAnalyzing.value = false;
};

// 등급에 따른 색상
const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    S: "purple",
    A: "success",
    B: "primary",
    C: "warning",
    D: "error",
  };
  return colors[grade] || "grey";
};
</script>

<style scoped>
.ai-analysis-component {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.gap-2 {
  gap: 8px;
}
</style>
<script lang="ts">
export default { name: "AIImageAnalysisComponent" };
</script>
