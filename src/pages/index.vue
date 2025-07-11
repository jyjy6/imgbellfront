<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useImageStore } from "../stores/imageStore";
import { useDisplay } from "vuetify";
import ImageListComponent from "../components/ImageListComponent.vue";
import ImageSearchComponent from "../components/ImageSearchComponent.vue";
import RecentViewImagesComponent from "../components/RecentViewImagesComponent.vue";
import { useElasticSearchStore } from "@/stores/elasticSearchStore";

// 반응형 디스플레이 훅
const { mdAndUp, lgAndUp } = useDisplay();

// Pinia 스토어 사용
const imageStore = useImageStore();
const elasticSearchStore = useElasticSearchStore();

// 상태 관리
const loading = ref(true);
const heroVisible = ref(false);
const statsVisible = ref(false);
const searchQuery = ref("");

// 스크롤 이동을 위한 ref 추가
const contentSectionRef = ref<HTMLElement>();

// 통계 데이터 (실제로는 API에서 가져와야 함)
const stats = ref([
  {
    title: "총 이미지",
    value: "12,847",
    icon: "mdi-image-multiple",
    color: "primary",
  },
  {
    title: "활성 사용자",
    value: "3,254",
    icon: "mdi-account-group",
    color: "secondary",
  },
  { title: "오늘 업로드", value: "186", icon: "mdi-upload", color: "success" },
  { title: "총 조회수", value: "924K", icon: "mdi-eye", color: "info" },
]);

// 카테고리 데이터
const categories = ref([
  { name: "자연", icon: "mdi-tree", color: "success", count: 2847 },
  { name: "도시", icon: "mdi-city", color: "primary", count: 1932 },
  { name: "인물", icon: "mdi-account", color: "secondary", count: 3421 },
  { name: "예술", icon: "mdi-palette", color: "accent", count: 1567 },
  { name: "음식", icon: "mdi-food", color: "warning", count: 892 },
  { name: "동물", icon: "mdi-paw", color: "info", count: 1234 },
]);

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  // 페이지 로딩 애니메이션
  setTimeout(() => {
    heroVisible.value = true;
  }, 300);

  setTimeout(() => {
    statsVisible.value = true;
  }, 600);

  setTimeout(() => {
    loading.value = false;
  }, 1000);

  // 이미지 로드
  await imageStore.loadImages();
});

// 검색 실행
const handleSearch = async () => {
  await imageStore.loadImages();

  // 이미지 로딩 후 콘텐츠 섹션으로 부드러운 스크롤 이동
  setTimeout(() => {
    if (contentSectionRef.value) {
      contentSectionRef.value.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 100); // 약간의 지연으로 더 자연스러운 UX
};

// 카테고리 클릭 핸들러
const selectCategory = (category: any) => {
  console.log("선택된 카테고리:", category.name);
  // 카테고리 필터링 로직 구현
  imageStore.searchCategory = category.name.toLowerCase();
  imageStore.loadImages();

  // 카테고리 선택 후에도 콘텐츠 섹션으로 스크롤 이동
  setTimeout(() => {
    if (contentSectionRef.value) {
      contentSectionRef.value.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 200);
};
</script>

<template>
  <div class="main-container">
    <!-- 🎨 Hero Section with Gradient Background -->
    <section class="hero-section">
      <v-container class="hero-container">
        <v-row align="center" justify="center" class="min-height-screen">
          <v-col cols="12" md="8" lg="6">
            <v-fade-transition>
              <div v-if="heroVisible" class="text-center">
                <!-- Hero Title with Animation -->
                <h1 class="hero-title text-h2 text-md-h1 font-weight-bold mb-6">
                  <span class="gradient-text">ImageBell</span>
                  <br />
                  <span class="text-h4 text-md-h3 font-weight-light">
                    당신의 창의성을 공유하세요
                  </span>
                </h1>

                <!-- Hero Description -->
                <p
                  class="hero-description text-h6 font-weight-light mb-8 text-medium-emphasis"
                >
                  AI 기반 이미지 분석과 함께하는 차세대 이미지 플랫폼
                </p>

                <!-- Hero Search Bar -->
                <v-card
                  class="hero-search-card mx-auto"
                  max-width="600"
                  elevation="8"
                >
                  <v-card-text class="pa-2">
                    <v-text-field
                      v-model="imageStore.searchQuery"
                      placeholder="원하는 이미지를 검색해보세요..."
                      prepend-inner-icon="mdi-magnify"
                      variant="plain"
                      hide-details
                      single-line
                      clearable
                      @keyup.enter="handleSearch"
                    >
                      <template #append-inner>
                        <v-btn
                          color="primary"
                          variant="flat"
                          size="small"
                          @click="handleSearch"
                        >
                          검색
                        </v-btn>
                      </template>
                    </v-text-field>
                    <v-chip-group
                      v-if="
                        elasticSearchStore.autocompleteSuggestions.length > 0
                      "
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
                  </v-card-text>
                </v-card>

                <!-- Hero Action Buttons -->
                <div class="hero-actions mt-8">
                  <v-btn
                    color="primary"
                    size="x-large"
                    variant="flat"
                    prepend-icon="mdi-upload"
                    class="mr-4 mb-2"
                    to="/image/upload"
                  >
                    이미지 업로드
                  </v-btn>
                  <v-btn
                    color="secondary"
                    size="x-large"
                    variant="outlined"
                    prepend-icon="mdi-compass"
                    class="mb-2"
                    to="/explore"
                  >
                    둘러보기
                  </v-btn>
                </div>
              </div>
            </v-fade-transition>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- 📊 Statistics Section -->
    <section class="stats-section py-16">
      <v-container>
        <v-slide-y-transition group>
          <v-row v-if="statsVisible" key="stats">
            <v-col
              v-for="(stat, index) in stats"
              :key="stat.title"
              cols="6"
              md="3"
            >
              <v-card
                class="stat-card text-center pa-6"
                :style="{ 'animation-delay': `${index * 100}ms` }"
                elevation="4"
                hover
              >
                <v-avatar :color="stat.color" size="56" class="mb-4">
                  <v-icon size="28">{{ stat.icon }}</v-icon>
                </v-avatar>
                <div class="stat-value text-h4 font-weight-bold mb-2">
                  {{ stat.value }}
                </div>
                <div class="stat-title text-body-1 text-medium-emphasis">
                  {{ stat.title }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-slide-y-transition>
      </v-container>
    </section>

    <!-- 🎯 Categories Section -->
    <section class="categories-section py-16 bg-surface-variant">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-4">인기 카테고리</h2>
          <p class="text-h6 font-weight-light text-medium-emphasis">
            다양한 주제의 이미지를 탐색해보세요
          </p>
        </div>

        <v-row>
          <v-col
            v-for="category in categories"
            :key="category.name"
            cols="6"
            sm="4"
            md="2"
          >
            <v-card
              class="category-card text-center pa-4"
              hover
              @click="selectCategory(category)"
            >
              <v-avatar :color="category.color" size="48" class="mb-3">
                <v-icon>{{ category.icon }}</v-icon>
              </v-avatar>
              <div class="category-name font-weight-medium mb-1">
                {{ category.name }}
              </div>
              <div class="category-count text-caption text-medium-emphasis">
                {{ category.count.toLocaleString() }}개
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- 🖼️ Main Content Section -->
    <section class="content-section py-16" ref="contentSectionRef">
      <v-container>
        <v-row>
          <!-- Main Content -->
          <v-col cols="12" :lg="lgAndUp ? 9 : 12">
            <!-- Section Title -->
            <div class="d-flex justify-space-between align-center mb-8">
              <div>
                <h2 class="text-h4 font-weight-bold mb-2">최신 이미지</h2>
                <p class="text-body-1 text-medium-emphasis">
                  커뮤니티에서 새롭게 공유된 이미지들
                </p>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-filter"
              >
                필터
              </v-btn>
            </div>

            <!-- Advanced Search Component -->
            <v-card class="mb-6" elevation="2">
              <v-card-text>
                <ImageSearchComponent />
              </v-card-text>
            </v-card>

            <!-- Loading State -->
            <div v-if="loading" class="loading-section">
              <v-row>
                <v-col v-for="i in 12" :key="i" cols="12" sm="6" md="4" lg="3">
                  <v-skeleton-loader
                    type="image, article"
                    class="mb-4"
                  ></v-skeleton-loader>
                </v-col>
              </v-row>
            </div>

            <!-- Image Grid -->
            <div v-else>
              <ImageListComponent />
            </div>
          </v-col>

          <!-- Sidebar (Desktop Only) -->
          <v-col v-if="lgAndUp" cols="3">
            <RecentViewImagesComponent />
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
.main-container {
  min-height: 100vh;
  scroll-behavior: smooth; /* 전체 스크롤을 부드럽게 */
}

/* 🎨 Hero Section Styles */
.hero-section {
  position: relative;
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  );
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 20% 80%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
  pointer-events: none;
}

.hero-container {
  position: relative;
  z-index: 2;
}

.hero-title {
  animation: slideInUp 0.8s ease-out;
}

.gradient-text {
  background: linear-gradient(45deg, #ffffff, #f1f5f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  animation: slideInUp 0.8s ease-out 0.2s both;
  color: rgba(255, 255, 255, 0.9);
}

.hero-search-card {
  animation: slideInUp 0.8s ease-out 0.4s both;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.hero-actions {
  animation: slideInUp 0.8s ease-out 0.6s both;
}

/* 📊 Statistics Section */
.stat-card {
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

.stat-card:hover {
  transform: translateY(-8px);
}

.stat-value {
  color: rgb(var(--v-theme-primary));
}

/* 🎯 Categories Section */
.category-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 📱 Responsive Styles */
.min-height-screen {
  min-height: 100vh;
}

.sticky-sidebar {
  position: sticky;
  top: 40px;
}

/* 🎬 Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 📱 Mobile Optimizations */
@media (max-width: 960px) {
  .hero-title {
    font-size: 2.5rem !important;
  }

  .hero-actions .v-btn {
    width: 100%;
    margin-bottom: 12px;
  }

  .stat-card {
    margin-bottom: 16px;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 60px 0;
  }

  .hero-title {
    font-size: 2rem !important;
  }

  .hero-search-card {
    margin: 0 16px;
  }
}

/* 📍 Content Section - 스크롤 대상 강조 */
.content-section {
  scroll-margin-top: 80px; /* 네비게이션 바 높이만큼 여백 */
  transition: all 0.3s ease;
}
</style>
