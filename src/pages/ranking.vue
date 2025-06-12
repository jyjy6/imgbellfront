<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import { useImageStore } from "../stores/imageStore";
import type { ImageDto } from "../types/ImageTypes";
import ImageDetailComponent from "../components/ImageDetailComponent.vue";

const imageStore = useImageStore();

// 반응형 데이터
const loading = ref(false);
const selectedPeriod = ref("daily");
const selectedLimit = ref(10);
const rankingImageIds = ref<number[]>([]);
const rankingImages = ref<ImageDto[]>([]);

// 옵션 데이터
const periodOptions = [
  { title: "일간", value: "daily" },
  { title: "주간", value: "weekly" },
];

// 랭킹 데이터 로드
const loadRanking = async () => {
  loading.value = true;

  try {
    // 1. 랭킹 이미지 ID 가져오기
    const response = await axios.get<number[]>("/api/image/ranking", {
      params: {
        period: selectedPeriod.value,
        limit: selectedLimit.value,
      },
    });

    rankingImageIds.value = response.data;

    console.log(rankingImageIds.value);

    // 2. 각 이미지 ID로 상세 정보 가져오기
    if (rankingImageIds.value.length > 0) {
      const imagePromises = rankingImageIds.value.map((id) =>
        axios
          .get<ImageDto>(`/api/image/${id}`, {
            params: { increaseView: false },
          })
          .then((res) => res.data)
          .catch(() => null)
      );

      const images = await Promise.all(imagePromises);
      rankingImages.value = images.filter((img): img is ImageDto => !!img);
    } else {
      rankingImages.value = [];
    }
  } catch (error) {
    console.error("랭킹 로드 실패:", error);
    rankingImages.value = [];
  } finally {
    loading.value = false;
  }
};

// 이미지 상세보기
const goDetail = (id: number) => {
  imageStore.viewImageDetail(id);
};

// 기간 제목 가져오기
const getPeriodTitle = () => {
  return selectedPeriod.value === "daily" ? "일간 랭킹" : "주간 랭킹";
};

// 랭킹 색상 가져오기
const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "amber";
    case 2:
      return "grey-lighten-1";
    case 3:
      return "orange";
    default:
      return "primary";
  }
};

// 랭킹 아이콘 가져오기
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return "mdi-trophy";
    case 2:
      return "mdi-medal-outline";
    case 3:
      return "mdi-medal-outline";
    default:
      return "";
  }
};

// 컴포넌트 마운트 시 랭킹 로드
onMounted(() => {
  loadRanking();
});
</script>

<template>
  <v-container class="ranking-page" max-width="800">
    <h2 class="text-h4 mb-4">🏆 이미지 랭킹</h2>

    <!-- 랭킹 설정 카드 -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="9">
            <v-select
              v-model="selectedPeriod"
              :items="periodOptions"
              label="기간 선택"
              outlined
              dense
              @update:model-value="loadRanking"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              @click="loadRanking"
              block
              :loading="loading"
            >
              새로고침
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 랭킹 리스트 -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-trophy</v-icon>
        {{ getPeriodTitle() }} TOP {{ selectedLimit }}
      </v-card-title>
      <v-divider />

      <div v-if="loading" class="text-center pa-4">
        <v-progress-circular indeterminate color="primary" />
        <div class="mt-2">랭킹 로딩 중...</div>
      </div>

      <div v-else-if="rankingImages.length === 0" class="text-center pa-4">
        <v-icon size="48" color="grey">mdi-image-off</v-icon>
        <div class="text-body-1 grey--text mt-2">랭킹 데이터가 없습니다.</div>
      </div>

      <v-list v-else>
        <v-list-item
          v-for="(image, index) in rankingImages"
          :key="image.id"
          @click="goDetail(image.id)"
          class="ranking-item"
          style="cursor: pointer"
        >
          <template #prepend>
            <div class="ranking-number">
              <v-chip
                :color="getRankColor(index + 1)"
                size="small"
                class="mr-3"
              >
                <v-icon v-if="index < 3" size="16" class="mr-1">
                  {{ getRankIcon(index + 1) }}
                </v-icon>
                {{ index + 1 }}
              </v-chip>
            </div>
          </template>

          <template #default>
            <v-img
              :src="image.imageUrl"
              height="80"
              width="120"
              class="mr-4 rounded"
              cover
            />
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-bold mb-1">
                {{ image.imageName }}
              </div>
              <div class="text-body-2 grey--text mb-1">
                <v-icon size="16" class="mr-1">mdi-account</v-icon>
                {{ image.uploaderName }}
              </div>
              <div class="d-flex align-center">
                <v-chip size="x-small" class="mr-2" color="blue">
                  <v-icon size="12" class="mr-1">mdi-eye</v-icon>
                  {{ image.viewCount }}
                </v-chip>
                <v-chip size="x-small" color="red">
                  <v-icon size="12" class="mr-1">mdi-heart</v-icon>
                  {{ image.likeCount }}
                </v-chip>
              </div>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
  <ImageDetailComponent />
</template>

<style scoped>
.ranking-page {
  min-height: 100vh;
}

.ranking-item {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.ranking-item:hover {
  background-color: #f5f5f5;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-number {
  min-width: 60px;
  display: flex;
  justify-content: center;
}
</style>
