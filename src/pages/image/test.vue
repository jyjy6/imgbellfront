<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4 text-center bg-primary text-white">
            🔍 ElasticSearch 이미지 검색 테스트
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- 동기화 상태 및 관리 -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">📊 동기화 상태</v-card-title>
          <v-card-text>
            <v-row v-if="syncStatus">
              <v-col cols="6">
                <v-chip color="blue" variant="elevated">
                  DB: {{ syncStatus.databaseCount }}개
                </v-chip>
              </v-col>
              <v-col cols="6">
                <v-chip color="green" variant="elevated">
                  ES: {{ syncStatus.elasticsearchCount }}개
                </v-chip>
              </v-col>
              <v-col cols="12">
                <v-chip
                  :color="syncStatus.inSync ? 'success' : 'error'"
                  variant="elevated"
                >
                  {{ syncStatus.inSync ? "✅ 동기화됨" : "❌ 동기화 필요" }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              @click="checkSyncStatus"
              :loading="statusLoading"
            >
              상태 확인
            </v-btn>
            <v-btn
              color="warning"
              @click="syncAllImages"
              :loading="syncLoading"
            >
              전체 동기화
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">🔍 검색 테스트</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="searchKeyword"
              label="검색 키워드"
              placeholder="이미지명, 작가명, 태그명..."
              append-inner-icon="mdi-magnify"
              @click:append-inner="smartSearch"
              @keyup.enter="smartSearch"
              clearable
            />
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="selectedGrade"
                  :items="gradeOptions"
                  label="등급 필터"
                  clearable
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="publicOnly"
                  label="공개 이미지만"
                  color="primary"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 검색 결과 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6"
              >📋 검색 결과 ({{ searchResults.length }}개)</span
            >
            <v-btn
              color="primary"
              @click="smartSearch"
              :loading="searchLoading"
              size="small"
            >
              검색
            </v-btn>
          </v-card-title>

          <v-card-text v-if="searchResults.length === 0 && !searchLoading">
            <v-alert type="info" variant="outlined">
              검색 결과가 없습니다. 키워드를 입력하고 검색해보세요.
            </v-alert>
          </v-card-text>

          <v-progress-linear
            v-if="searchLoading"
            indeterminate
            color="primary"
          />

          <v-row v-if="searchResults.length > 0" class="pa-4">
            <v-col
              v-for="image in searchResults"
              :key="image.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card class="elevation-2 h-100">
                <v-img
                  :src="image.imageUrl"
                  height="200"
                  cover
                  class="cursor-pointer"
                  @click="viewImageDetail(image)"
                >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular
                        indeterminate
                        color="grey lighten-5"
                      />
                    </v-row>
                  </template>
                </v-img>

                <v-card-title class="text-subtitle-1">
                  {{ image.imageName || "제목 없음" }}
                </v-card-title>

                <v-card-subtitle>
                  <div>👤 {{ image.uploaderName || "익명" }}</div>
                  <div v-if="image.artist">🎨 {{ image.artist }}</div>
                </v-card-subtitle>

                <v-card-text>
                  <v-chip-group>
                    <v-chip
                      v-for="tag in image.tagNames?.slice(0, 3)"
                      :key="tag"
                      size="small"
                      color="primary"
                      variant="outlined"
                    >
                      {{ tag }}
                    </v-chip>
                    <v-chip
                      v-if="image.tagNames?.length > 3"
                      size="small"
                      variant="outlined"
                    >
                      +{{ image.tagNames.length - 3 }}
                    </v-chip>
                  </v-chip-group>

                  <div class="text-caption mt-2">
                    👁️ {{ image.viewCount || 0 }} | ❤️
                    {{ image.likeCount || 0 }} | ⭐
                    {{ image.popularityScore?.toFixed(1) || "0.0" }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 기타 검색 기능 -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="text-h6">🔥 인기 이미지</v-card-title>
          <v-card-actions>
            <v-btn
              color="orange"
              @click="getPopularImages"
              :loading="popularLoading"
              block
            >
              인기 이미지 조회
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="text-h6">🆕 최신 이미지</v-card-title>
          <v-card-actions>
            <v-btn
              color="green"
              @click="getRecentImages"
              :loading="recentLoading"
              block
            >
              최신 이미지 조회
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="text-h6">🔍 자동완성 테스트</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="autocompleteQuery"
              label="자동완성 테스트"
              @input="testAutocomplete"
              clearable
            />
            <v-chip-group v-if="autocompleteSuggestions.length > 0">
              <v-chip
                v-for="suggestion in autocompleteSuggestions"
                :key="suggestion"
                size="small"
                @click="
                  searchKeyword = suggestion;
                  smartSearch();
                "
              >
                {{ suggestion }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> 닫기 </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";

// 반응형 데이터
const syncStatus = ref<any>(null);
const searchKeyword = ref("");
const selectedGrade = ref("");
const publicOnly = ref(true);
const searchResults = ref<any[]>([]);
const autocompleteQuery = ref("");
const autocompleteSuggestions = ref<string[]>([]);

// 로딩 상태
const statusLoading = ref(false);
const syncLoading = ref(false);
const searchLoading = ref(false);
const popularLoading = ref(false);
const recentLoading = ref(false);

// 옵션 데이터
const gradeOptions = [
  { title: "일반", value: "GENERAL" },
  { title: "성인", value: "ADULT" },
  { title: "극한", value: "EXTREME" },
];

// 스낵바
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

// 메소드
const showSnackbar = (message: string, color: string = "success") => {
  snackbar.value = { show: true, message, color };
};

const checkSyncStatus = async () => {
  statusLoading.value = true;
  try {
    const response = await axios.get("/api/image/sync/status");
    syncStatus.value = response.data;
    showSnackbar("동기화 상태를 확인했습니다.");
  } catch (error) {
    console.error("동기화 상태 확인 실패:", error);
    showSnackbar("동기화 상태 확인에 실패했습니다.", "error");
  } finally {
    statusLoading.value = false;
  }
};

const syncAllImages = async () => {
  syncLoading.value = true;
  try {
    await axios.post("/api/image/sync/all");
    showSnackbar("전체 이미지 동기화가 완료되었습니다.");
    checkSyncStatus(); // 상태 업데이트
  } catch (error) {
    console.error("전체 동기화 실패:", error);
    showSnackbar("전체 동기화에 실패했습니다.", "error");
  } finally {
    syncLoading.value = false;
  }
};

const smartSearch = async () => {
  if (!searchKeyword.value.trim()) {
    showSnackbar("검색 키워드를 입력해주세요.", "warning");
    return;
  }

  searchLoading.value = true;
  try {
    const params: any = {
      keyword: searchKeyword.value,
      size: 20,
    };

    if (selectedGrade.value) {
      params.imageGrade = selectedGrade.value;
    }

    if (publicOnly.value) {
      params.isPublic = true;
    }

    const response = await axios.get("/api/image/search/smart", { params });
    searchResults.value = response.data;
    showSnackbar(`${response.data.length}개의 결과를 찾았습니다.`);
  } catch (error) {
    console.error("검색 실패:", error);
    showSnackbar("검색에 실패했습니다.", "error");
  } finally {
    searchLoading.value = false;
  }
};

const getPopularImages = async () => {
  popularLoading.value = true;
  try {
    const response = await axios.get("/api/image/search/popular", {
      params: { size: 12 },
    });
    searchResults.value = response.data;
    showSnackbar(`인기 이미지 ${response.data.length}개를 불러왔습니다.`);
  } catch (error) {
    console.error("인기 이미지 조회 실패:", error);
    showSnackbar("인기 이미지 조회에 실패했습니다.", "error");
  } finally {
    popularLoading.value = false;
  }
};

const getRecentImages = async () => {
  recentLoading.value = true;
  try {
    const response = await axios.get("/api/image/search/recent", {
      params: { size: 12 },
    });
    searchResults.value = response.data;
    showSnackbar(`최신 이미지 ${response.data.length}개를 불러왔습니다.`);
  } catch (error) {
    console.error("최신 이미지 조회 실패:", error);
    showSnackbar("최신 이미지 조회에 실패했습니다.", "error");
  } finally {
    recentLoading.value = false;
  }
};

const testAutocomplete = async () => {
  if (!autocompleteQuery.value.trim()) {
    autocompleteSuggestions.value = [];
    return;
  }

  try {
    const response = await axios.get("/api/image/search/autocomplete", {
      params: {
        prefix: autocompleteQuery.value,
        size: 5,
      },
    });
    autocompleteSuggestions.value = response.data;
  } catch (error) {
    console.error("자동완성 실패:", error);
  }
};

const viewImageDetail = (image: any) => {
  // 이미지 상세 페이지로 이동하거나 모달 표시
  showSnackbar(`이미지 상세: ${image.imageName}`);
  console.log("이미지 상세:", image);
};

// 컴포넌트 마운트 시 동기화 상태 확인
onMounted(() => {
  checkSyncStatus();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.h-100 {
  height: 100% !important;
}
</style>
