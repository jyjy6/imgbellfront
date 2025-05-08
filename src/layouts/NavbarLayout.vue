<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 상태 변수
const drawer = ref(false);
const searchQuery = ref("");
const showSearchOptions = ref(false);
const searchCategory = ref("all");
const searchRating = ref(["safe"]);
const searchSort = ref("date_desc");
const showSearchModal = ref(false);

const recentSearches = ref<{ query: string; options?: any }[]>(
  JSON.parse(localStorage.getItem("recentSearches") || "[]")
);

const popularTags = ref([]);

// 사용자 상태 (실제 구현에서는 스토어나 인증 서비스에서 가져옴)
const isLoggedIn = ref(false);
const userAvatar = ref("/path/to/default/avatar.jpg");

// 검색 옵션
const searchCategories = [
  { title: "전체", value: "all" },
  { title: "태그", value: "tags" },
  { title: "제목", value: "title" },
  { title: "업로더", value: "uploader" },
];

const ratingOptions = [
  { title: "전체 연령", value: "safe" },
  { title: "준성인", value: "questionable" },
  { title: "성인", value: "explicit" },
];

const sortOptions = [
  { title: "최신순", value: "date_desc" },
  { title: "오래된순", value: "date_asc" },
  { title: "인기순", value: "popularity" },
  { title: "평점순", value: "rating" },
];

// 메소드
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // 검색 이력에 추가
    saveSearchToHistory();

    router.push({
      path: "/search",
      query: {
        q: searchQuery.value,
        category: searchCategory.value,
        rating: searchRating.value.join(","),
        sort: searchSort.value,
      },
    });

    // 검색 모달 닫기
    showSearchModal.value = false;
    // 모바일에서 검색 후 드로어 닫기
    drawer.value = false;
  }
};

const saveSearchToHistory = () => {
  // 이미 같은 검색어가 있는지 확인
  const index = recentSearches.value.findIndex(
    (item) => item.query === searchQuery.value.trim()
  );

  // 있으면 제거
  if (index !== -1) {
    recentSearches.value.splice(index, 1);
  }

  // 새 검색어를 앞에 추가
  recentSearches.value.unshift({
    query: searchQuery.value.trim(),
    options: {
      category: searchCategory.value,
      rating: [...searchRating.value],
      sort: searchSort.value,
    },
  });

  // 최대 10개만 유지
  if (recentSearches.value.length > 10) {
    recentSearches.value.pop();
  }

  // 로컬 스토리지에 저장
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches.value));
};

const applyRecentSearch = (search: { query: string; options?: any }) => {
  searchQuery.value = search.query;

  // 검색 옵션이 있으면 적용
  if (search.options) {
    searchCategory.value = search.options.category || "all";
    searchRating.value = search.options.rating || ["safe"];
    searchSort.value = search.options.sort || "date_desc";
  }

  // 즉시 검색 실행
  handleSearch();
};

const removeRecentSearch = (index: number) => {
  recentSearches.value.splice(index, 1);
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches.value));
};

const clearRecentSearches = () => {
  recentSearches.value = [];
  localStorage.removeItem("recentSearches");
};

const searchByTag = (tag: string) => {
  searchQuery.value = tag;
  searchCategory.value = "tags";
  handleSearch();
};

const applySearchOptions = () => {
  showSearchOptions.value = false;
  // 검색 결과에 적용하는 로직 (필요시)
};

const navigateToUpload = () => {
  if (isLoggedIn.value) {
    router.push("/upload");
  } else {
    // 비로그인 상태면 로그인 페이지로 리다이렉트하거나 모달 표시
    router.push("/login?redirect=upload");
  }
};

const logout = () => {
  // 로그아웃 로직 구현
  isLoggedIn.value = false;
  router.push("/");
};
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact" :elevation="2" app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-app-bar-title class="font-weight-bold">
        <router-link to="/" class="text-decoration-none text-white"
          >ImageBell</router-link
        >
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- 검색 아이콘 버튼 -->
      <v-btn icon @click="showSearchModal = true" class="mx-2">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <!-- Search Options Dialog -->
      <v-dialog v-model="showSearchOptions" max-width="500">
        <v-card>
          <v-card-title>검색 옵션</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="searchCategory"
                  :items="searchCategories"
                  label="카테고리"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="searchRating"
                  :items="ratingOptions"
                  label="등급"
                  variant="outlined"
                  density="compact"
                  multiple
                  chips
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="searchSort"
                  :items="sortOptions"
                  label="정렬"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="applySearchOptions">적용</v-btn>
            <v-btn color="grey" @click="showSearchOptions = false">취소</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Search Modal -->
      <v-overlay
        v-model="showSearchModal"
        transition="slide-y-reverse-transition"
        scrollable
        width="100%"
        class="mt-10"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-magnify</v-icon>
            <span>검색</span>
            <v-spacer></v-spacer>
            <v-btn icon @click="showSearchModal = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="handleSearch">
              <v-text-field
                v-model="searchQuery"
                label="태그, 제목, 업로더 등으로 검색"
                variant="outlined"
                density="compact"
                autofocus
                clearable
                prepend-inner-icon="mdi-magnify"
                append-inner-icon="mdi-tune"
                @click:append-inner="showSearchOptions = true"
              ></v-text-field>
            </v-form>

            <!-- 최근 검색 이력 -->
            <div v-if="recentSearches.length > 0" class="mt-4">
              <div class="d-flex align-center mb-2">
                <h3 class="text-subtitle-1 font-weight-bold">최근 검색</h3>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  size="small"
                  color="grey"
                  @click="clearRecentSearches"
                >
                  전체 삭제
                </v-btn>
              </div>

              <v-chip-group>
                <v-chip
                  v-for="(search, index) in recentSearches"
                  :key="index"
                  variant="outlined"
                  @click="applyRecentSearch(search)"
                  closable
                  @click:close="removeRecentSearch(index)"
                >
                  {{ search.query }}
                </v-chip>
              </v-chip-group>
            </div>

            <!-- 인기 태그 -->
            <div class="mt-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">인기 태그</h3>
              <v-chip-group>
                <v-chip
                  v-for="(tag, index) in popularTags"
                  :key="index"
                  variant="outlined"
                  color="primary"
                  @click="searchByTag(tag)"
                >
                  {{ tag }}
                </v-chip>
              </v-chip-group>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="elevated"
              block
              @click="handleSearch"
              :disabled="!searchQuery.trim()"
            >
              검색
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-overlay>

      <!-- Upload Button -->
      <v-btn
        variant="tonal"
        color="accent"
        prepend-icon="mdi-cloud-upload"
        class="ml-2"
        @click="navigateToUpload"
      >
        업로드
      </v-btn>

      <!-- User Menu -->
      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon class="ml-2">
            <v-avatar color="surface-variant" size="36">
              <v-icon v-if="!isLoggedIn">mdi-account</v-icon>
              <v-img v-else :src="userAvatar" alt="사용자 아바타"></v-img>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <template v-if="isLoggedIn">
            <v-list-item to="/profile">
              <v-list-item-title>프로필</v-list-item-title>
            </v-list-item>
            <v-list-item to="/favorites">
              <v-list-item-title>즐겨찾기</v-list-item-title>
            </v-list-item>
            <v-list-item to="/uploads">
              <v-list-item-title>내 업로드</v-list-item-title>
            </v-list-item>
            <v-list-item to="/settings">
              <v-list-item-title>설정</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="logout">
              <v-list-item-title>로그아웃</v-list-item-title>
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item to="/login">
              <v-list-item-title>로그인</v-list-item-title>
            </v-list-item>
            <v-list-item to="/register">
              <v-list-item-title>회원가입</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item prepend-icon="mdi-home" title="홈" to="/"></v-list-item>

        <v-list-group value="gallery">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-image-multiple"
              title="갤러리"
            ></v-list-item>
          </template>

          <v-list-item title="최신 이미지" to="/gallery/recent"></v-list-item>
          <v-list-item title="인기 이미지" to="/gallery/popular"></v-list-item>
          <v-list-item title="랜덤 이미지" to="/gallery/random"></v-list-item>
        </v-list-group>

        <v-list-item
          prepend-icon="mdi-tag-multiple"
          title="태그"
          to="/tags"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-forum"
          title="포럼"
          to="/forum"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-information"
          title="정보"
          to="/about"
        ></v-list-item>

        <v-divider></v-divider>

        <v-list-item
          prepend-icon="mdi-cog"
          title="설정"
          to="/settings"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-help-circle"
          title="도움말"
          to="/help"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Search Options Dialog -->
    <v-dialog v-model="showSearchOptions" max-width="500">
      <v-card>
        <v-card-title>검색 옵션</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="searchCategory"
                :items="searchCategories"
                label="카테고리"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="searchRating"
                :items="ratingOptions"
                label="등급"
                variant="outlined"
                density="compact"
                multiple
                chips
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="searchSort"
                :items="sortOptions"
                label="정렬"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="applySearchOptions">적용</v-btn>
          <v-btn color="grey" @click="showSearchOptions = false">취소</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Main Content Area -->
    <v-main>
      <v-container fluid>
        <slot></slot>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app class="text-center d-flex flex-column">
      <div>
        &copy; {{ new Date().getFullYear() }} ImageBell - 모든 권리 보유
      </div>
      <div class="mt-1">
        <router-link to="/terms" class="text-decoration-none mr-3"
          >이용약관</router-link
        >
        <router-link to="/privacy" class="text-decoration-none mr-3"
          >개인정보처리방침</router-link
        >
        <router-link to="/dmca" class="text-decoration-none">DMCA</router-link>
      </div>
    </v-footer>
  </v-app>
</template>

<style scoped>
.v-app-bar-title a {
  color: inherit;
}
</style>
