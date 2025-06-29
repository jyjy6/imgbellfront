<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useElasticSearchStore } from "../../stores/elasticSearchStore";
import { useImageStore } from "../../stores/imageStore";
import ImageDetailComponent from "../../components/ImageDetailComponent.vue";

const elasticSearchStore = useElasticSearchStore();
const imageStore = useImageStore(); // 이미지 상세/삭제/공개상태 변경용

// 페이지네이션 상태
const page = ref(1); // Vue에서는 1부터 시작 (표시용)
const itemsPerPage = ref(elasticSearchStore.size);

// 페이지 변경 시 검색 재실행
watch(page, (val) => {
  // Vue Pagination은 1부터 시작하지만 Spring은 0부터 시작
  elasticSearchStore.changePage(val - 1);
  elasticSearchStore.loadImages();
});

watch(itemsPerPage, (val) => {
  elasticSearchStore.changeSize(val);
  page.value = 1; // 사이즈 바뀌면 1페이지로
  elasticSearchStore.loadImages();
});

// Spring의 page(0부터)를 Vue의 page(1부터)로 동기화
watch(
  () => elasticSearchStore.page,
  (springPage) => {
    page.value = springPage + 1;
  }
);

// 검색 키워드 변경 시 자동완성 실행
watch(
  () => elasticSearchStore.searchKeyword,
  (newKeyword) => {
    if (newKeyword && newKeyword.trim()) {
      // autocompleteQuery를 searchKeyword와 동기화
      elasticSearchStore.autocompleteQuery = newKeyword;
      elasticSearchStore.testAutocomplete();
    } else {
      // 키워드가 없으면 자동완성 결과 초기화
      elasticSearchStore.autocompleteSuggestions = [];
    }
  }
);

onMounted(() => {
  elasticSearchStore.getPopularImages(); // 초기 로드는 인기 이미지
});

// 이미지 삭제 (imageStore 사용)
const handleDelete = async (id: number) => {
  await imageStore.viewImageDetail(id);
  imageStore.dialog = false;
  await imageStore.deleteImage();
  // 삭제 후 현재 검색 결과 새로고침
  await elasticSearchStore.loadImages();
};

// 공개/비공개 토글 (imageStore 사용)
const handleTogglePublic = async (id: number) => {
  await imageStore.viewImageDetail(id);
  imageStore.dialog = false;
  await imageStore.togglePublic();
  // 토글 후 현재 검색 결과 새로고침
  await elasticSearchStore.loadImages();
};

// 이미지 상세 보기 (imageStore 사용)
const viewImageDetail = async (id: number) => {
  await imageStore.viewImageDetail(id);
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2>관리자 이미지 관리</h2>
        <p>ElasticSearch 기반 이미지 검색 및 관리</p>
      </v-col>
    </v-row>

    <!-- 검색 컴포넌트 -->
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title class="text-h6">🔍 스마트 검색</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="elasticSearchStore.searchKeyword"
            label="검색 키워드 입력"
            placeholder="이미지명, 작가명, 태그명으로 검색"
            prepend-inner-icon="mdi-magnify"
            append-inner-icon="mdi-send"
            @click:append-inner="elasticSearchStore.smartSearch"
            @keyup.enter="elasticSearchStore.smartSearch"
            :loading="elasticSearchStore.searchLoading"
            clearable
          />

          <!-- 자동완성 제안 -->
          <v-chip-group
            v-if="elasticSearchStore.autocompleteSuggestions.length > 0"
            class="mt-2"
          >
            <v-chip
              v-for="suggestion in elasticSearchStore.autocompleteSuggestions"
              :key="suggestion"
              size="small"
              color="primary"
              variant="outlined"
              @click="
                elasticSearchStore.searchKeyword = suggestion;
                elasticSearchStore.smartSearch();
              "
            >
              {{ suggestion }}
            </v-chip>
          </v-chip-group>

          <!-- 검색 옵션 -->
          <v-row class="mt-3">
            <v-col cols="12" sm="6">
              <v-select
                v-model="elasticSearchStore.selectedGrade"
                :items="elasticSearchStore.gradeOptions"
                label="이미지 등급"
                clearable
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="elasticSearchStore.publicOnly"
                label="공개 이미지만"
                color="primary"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 검색 결과 요약 -->
    <v-row v-if="elasticSearchStore.searchResults.length > 0">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          총 {{ elasticSearchStore.totalElements }}개 중
          {{ elasticSearchStore.searchResults.length }}개 표시 ({{
            elasticSearchStore.page + 1
          }}/{{ elasticSearchStore.totalPages }} 페이지)
        </v-alert>
      </v-col>
    </v-row>

    <!-- 빠른 액션 버튼 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-btn
          color="primary"
          @click="elasticSearchStore.getPopularImages()"
          :loading="elasticSearchStore.popularLoading"
          class="me-2"
        >
          인기 이미지
        </v-btn>
        <v-btn
          color="secondary"
          @click="elasticSearchStore.getRecentImages()"
          :loading="elasticSearchStore.recentLoading"
          class="me-2"
        >
          최신 이미지
        </v-btn>
        <v-btn
          color="info"
          @click="elasticSearchStore.checkSyncStatus()"
          :loading="elasticSearchStore.statusLoading"
          class="me-2"
        >
          동기화 상태
        </v-btn>
        <v-btn
          color="warning"
          @click="elasticSearchStore.syncAllImages()"
          :loading="elasticSearchStore.syncLoading"
        >
          전체 동기화
        </v-btn>
      </v-col>
    </v-row>

    <!-- 이미지 테이블 -->
    <v-data-table
      :items="elasticSearchStore.searchResults"
      :headers="[
        { title: 'ID', key: 'id' },
        { title: '썸네일', key: 'imageUrl' },
        { title: '이름', key: 'imageName' },
        { title: '업로더', key: 'uploaderName' },
        { title: '등급', key: 'imageGrade' },
        { title: '공개', key: 'isPublic' },
        { title: '조회수', key: 'viewCount' },
        { title: '좋아요', key: 'likeCount' },
        { title: '인기점수', key: 'popularityScore' },
        { title: '관리', key: 'actions', sortable: false },
      ]"
      :loading="
        elasticSearchStore.searchLoading ||
        elasticSearchStore.popularLoading ||
        elasticSearchStore.recentLoading
      "
      hide-default-footer
    >
      <template #item.imageUrl="{ item }">
        <v-img
          :src="item.imageUrl"
          max-width="80"
          max-height="80"
          style="cursor: pointer"
          @click="viewImageDetail(Number(item.id))"
        />
      </template>

      <template #item.imageName="{ item }">
        <div style="max-width: 200px">
          <div class="text-subtitle-2">{{ item.imageName }}</div>
          <div class="text-caption text-grey">{{ item.artist }}</div>
        </div>
      </template>

      <template #item.isPublic="{ item }">
        <v-chip :color="item.isPublic ? 'green' : 'red'" size="small">
          {{ item.isPublic ? "공개" : "비공개" }}
        </v-chip>
      </template>

      <template #item.imageGrade="{ item }">
        <v-chip
          :color="
            item.imageGrade === 'GENERAL'
              ? 'blue'
              : item.imageGrade === 'ADULT'
              ? 'orange'
              : 'red'
          "
          size="small"
        >
          {{ item.imageGrade }}
        </v-chip>
      </template>

      <template #item.viewCount="{ item }">
        <v-chip color="blue" variant="text" size="small">
          {{ item.viewCount || 0 }}
        </v-chip>
      </template>

      <template #item.likeCount="{ item }">
        <v-chip color="pink" variant="text" size="small">
          {{ item.likeCount || 0 }}
        </v-chip>
      </template>

      <template #item.popularityScore="{ item }">
        <v-chip color="purple" variant="text" size="small">
          {{ item.popularityScore?.toFixed(1) || "0.0" }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          size="small"
          color="primary"
          variant="outlined"
          @click="viewImageDetail(Number(item.id))"
          class="me-1"
        >
          상세
        </v-btn>
        <v-btn
          size="small"
          color="warning"
          variant="outlined"
          @click="handleTogglePublic(Number(item.id))"
          class="me-1"
        >
          {{ item.isPublic ? "비공개" : "공개" }}
        </v-btn>
        <v-btn
          size="small"
          color="error"
          variant="outlined"
          @click="handleDelete(Number(item.id))"
        >
          삭제
        </v-btn>
      </template>
    </v-data-table>

    <!-- 페이지네이션 -->
    <v-row v-if="elasticSearchStore.totalPages > 1">
      <v-col cols="12" class="text-center">
        <v-pagination
          v-model="page"
          :length="elasticSearchStore.totalPages"
          rounded
          :disabled="
            elasticSearchStore.searchLoading ||
            elasticSearchStore.popularLoading ||
            elasticSearchStore.recentLoading
          "
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- 페이지 크기 선택 -->
    <v-row>
      <v-col cols="12" class="text-center">
        <v-select
          v-model="itemsPerPage"
          :items="[10, 20, 50, 100]"
          label="페이지 크기"
          style="max-width: 200px; margin: 0 auto"
          variant="outlined"
          density="compact"
        ></v-select>
      </v-col>
    </v-row>
  </v-container>

  <!-- 이미지 상세 모달 -->
  <ImageDetailComponent />

  <!-- 스낵바 -->
  <v-snackbar
    v-model="elasticSearchStore.snackbar.show"
    :color="elasticSearchStore.snackbar.color"
    location="top"
  >
    {{ elasticSearchStore.snackbar.message }}
    <template #actions>
      <v-btn variant="text" @click="elasticSearchStore.snackbar.show = false">
        닫기
      </v-btn>
    </template>
  </v-snackbar>
</template>
