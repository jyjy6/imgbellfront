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
            <v-row v-if="elasticSearchStore.syncStatus">
              <v-col cols="6">
                <v-chip color="blue" variant="elevated">
                  DB: {{ elasticSearchStore.syncStatus.databaseCount }}개
                </v-chip>
              </v-col>
              <v-col cols="6">
                <v-chip color="green" variant="elevated">
                  ES: {{ elasticSearchStore.syncStatus.elasticsearchCount }}개
                </v-chip>
              </v-col>
              <v-col cols="12">
                <v-chip
                  :color="
                    elasticSearchStore.syncStatus.inSync ? 'success' : 'error'
                  "
                  variant="elevated"
                >
                  {{
                    elasticSearchStore.syncStatus.inSync
                      ? "✅ 동기화됨"
                      : "❌ 동기화 필요"
                  }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              @click="elasticSearchStore.checkSyncStatus"
              :loading="elasticSearchStore.statusLoading"
            >
              상태 확인
            </v-btn>
            <v-btn
              color="warning"
              @click="elasticSearchStore.syncAllImages"
              :loading="elasticSearchStore.syncLoading"
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
              v-model="elasticSearchStore.searchKeyword"
              label="검색 키워드"
              placeholder="이미지명, 작가명, 태그명..."
              append-inner-icon="mdi-magnify"
              @click:append-inner="elasticSearchStore.smartSearch"
              @keyup.enter="elasticSearchStore.smartSearch"
              clearable
            />
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="elasticSearchStore.selectedGrade"
                  :items="elasticSearchStore.gradeOptions"
                  label="등급 필터"
                  clearable
                />
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="elasticSearchStore.publicOnly"
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
              >📋 검색 결과 ({{
                elasticSearchStore.searchResults.length
              }}개)</span
            >
            <v-btn
              color="primary"
              @click="elasticSearchStore.smartSearch"
              :loading="elasticSearchStore.searchLoading"
              size="small"
            >
              검색
            </v-btn>
          </v-card-title>

          <v-card-text
            v-if="
              elasticSearchStore.searchResults.length === 0 &&
              !elasticSearchStore.searchLoading
            "
          >
            <v-alert type="info" variant="outlined">
              검색 결과가 없습니다. 키워드를 입력하고 검색해보세요.
            </v-alert>
          </v-card-text>

          <v-progress-linear
            v-if="elasticSearchStore.searchLoading"
            indeterminate
            color="primary"
          />

          <ImageDetailComponent />
          <v-row
            v-if="elasticSearchStore.searchResults.length > 0"
            class="pa-4"
          >
            <v-col
              v-for="image in elasticSearchStore.searchResults"
              :key="image.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <p>{{ image.id }}</p>
              <v-card class="elevation-2 h-100">
                <v-img
                  :src="image.imageUrl"
                  height="200"
                  cover
                  class="cursor-pointer"
                  @click="goDetail(Number(image.id))"
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
              @click="elasticSearchStore.getPopularImages"
              :loading="elasticSearchStore.popularLoading"
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
              @click="elasticSearchStore.getRecentImages"
              :loading="elasticSearchStore.recentLoading"
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
              v-model="elasticSearchStore.autocompleteQuery"
              label="자동완성 테스트"
              @input="elasticSearchStore.testAutocomplete"
              clearable
            />
            <v-chip-group
              v-if="elasticSearchStore.autocompleteSuggestions.length > 0"
            >
              <v-chip
                v-for="suggestion in elasticSearchStore.autocompleteSuggestions"
                :key="suggestion"
                size="small"
                @click="
                  elasticSearchStore.searchKeyword = suggestion;
                  elasticSearchStore.smartSearch();
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
    <v-snackbar
      v-model="elasticSearchStore.snackbar.show"
      :color="elasticSearchStore.snackbar.color"
      :timeout="3000"
    >
      {{ elasticSearchStore.snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="elasticSearchStore.snackbar.show = false">
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useElasticSearchStore } from "@/stores/elasticSearchStore";
import { useImageStore } from "@/stores/imageStore";
import ImageDetailComponent from "@/components/ImageDetailComponent.vue";

const elasticSearchStore = useElasticSearchStore();
const imageStore = useImageStore();

const goDetail = (id: number) => {
  imageStore.viewImageDetail(id);
};

// 컴포넌트 마운트 시 동기화 상태 확인
onMounted(() => {
  elasticSearchStore.checkSyncStatus();
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
