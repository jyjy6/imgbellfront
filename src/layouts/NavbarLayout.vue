<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useLoginStore } from "../stores/loginStore";
import { useImageStore } from "../stores/imageStore";
import type { TagType } from "../types/TagTypes";
import notificationSocket from "../utils/notifySocket";

const router = useRouter();
const loginStore = useLoginStore();
const imageStore = useImageStore();

// 상태 변수
const drawer = ref(false);
const showSearchOptions = ref(false);

// 알림 관련 상태
const showNotificationSnackbar = ref(false);
const notificationText = ref("");

const searchGrade = ref([""]); // imageStore의 등급 체계에 맞게 변경
const showSearchModal = ref(false);

const recentSearches = ref<{ query: string; options?: any }[]>(
  JSON.parse(localStorage.getItem("recentSearches") || "[]")
);

const popularTags = ref<TagType[]>();

// 검색 옵션
const searchCategories = [
  { title: "전체", value: "all" },
  { title: "태그", value: "tag" },
  { title: "제목", value: "imageName" },
  { title: "업로더", value: "uploaderName" },
];

// imageStore의 gradeOptions 활용
const getGradeOptions = () => {
  return imageStore.gradeOptions.map((option) => ({
    title: option.title,
    value: option.value,
  }));
};

// imageStore의 sortOptions 활용
const getSortOptions = () => {
  return imageStore.sortOptions.map((option) => ({
    title: option.title,
    value: option.value,
  }));
};

const getSearchPlaceholder = () => {
  switch (imageStore.searchCategory) {
    case "all":
      return "전체(태그, 제목, 업로더) 검색";
    case "tag":
      return "태그로 검색";
    case "imageName":
      return "제목으로 검색";
    case "uploaderName":
      return "업로더로 검색";
    default:
      return "검색어를 입력하세요";
  }
};

// 메소드
const handleSearch = () => {
  if (imageStore.searchQuery.trim()) {
    // 검색 이력에 추가
    saveSearchToHistory();
  }

  // 검색 카테고리가 태그면 imageStore의 searchByTag 활용
  if (imageStore.searchCategory === "tag") {
    imageStore.searchTag = imageStore.searchQuery;
  } else {
    // tag가 아닌 경우, searchTag는 비우고 검색 로직은 loadImages에서 처리
    imageStore.searchTag = "";
  }

  // 등급 필터 적용
  if (searchGrade.value.length > 0 && searchGrade.value[0] !== "") {
    imageStore.selectedGrade = searchGrade.value[0];
  } else {
    imageStore.selectedGrade = "";
  }

  // 정렬 옵션 적용
  imageStore.sortOption = searchSort.value;

  // 페이지를 1로 초기화하고 이미지 로드
  imageStore.page = 1;

  // 이미지 로드
  imageStore.loadImages();

  // 검색 모달 닫기
  showSearchModal.value = false;
  // 모바일에서 검색 후 드로어 닫기
  drawer.value = false;
  router.push("/");
};

// 정렬 옵션 (imageStore의 옵션에 맞게 변경)
const searchSort = ref("newest");

const saveSearchToHistory = () => {
  // 이미 같은 검색어가 있는지 확인
  const index = recentSearches.value.findIndex(
    (item) => item.query === imageStore.searchQuery.trim()
  );

  // 있으면 제거
  if (index !== -1) {
    recentSearches.value.splice(index, 1);
  }

  // 새 검색어를 앞에 추가
  recentSearches.value.unshift({
    query: imageStore.searchQuery.trim(),
    options: {
      category: imageStore.searchCategory,
      grade: [...searchGrade.value],
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
  imageStore.searchQuery = search.query;

  // 검색 옵션이 있으면 적용
  if (search.options) {
    imageStore.searchCategory = search.options.category || "all";
    searchGrade.value = search.options.grade || [""];
    searchSort.value = search.options.sort || "newest";
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

const searchByTag = (tag: TagType) => {
  imageStore.searchQuery = tag.name;
  imageStore.searchCategory = "tag";
  // imageStore의 searchByTag 메서드 활용
  imageStore.searchByTag(tag.name);
  // 검색 이력에 추가
  saveSearchToHistory();
  // 모달 닫기
  showSearchModal.value = false;
};

const applySearchOptions = () => {
  showSearchOptions.value = false;
  // 검색 결과에 바로 적용
  if (imageStore.searchQuery.trim()) {
    handleSearch();
  }
};

const navigateToUpload = () => {
  if (loginStore.isLogin) {
    router.push("/image/upload");
  } else {
    // 비로그인 상태면 로그인 페이지로 리다이렉트하거나 모달 표시
    router.push("/login?redirect=upload");
  }
};

// 인기 태그 로드 (실제 구현 예시)
const loadPopularTags = async () => {
  try {
    // 실제로는 API 호출을 통해 인기 태그를 로드
    // const response = await axios.get('/api/tags/popular');
    // popularTags.value = response.data;

    // 임시 데이터
    popularTags.value = [
      {
        name: "자연",
        description: "자연 풍경과 관련된 이미지",
        category: "풍경",
      },
      {
        name: "동물",
        description: "동물과 관련된 이미지",
        category: "생물",
      },
      {
        name: "풍경",
        description: "풍경 사진",
        category: "풍경",
      },
    ];
  } catch (error) {
    console.error("인기 태그 로드 실패:", error);
  }
};

// 알림 스낵바 핸들러
const showNotification = (notification: any) => {
  // notification이 문자열인 경우 (기존 호환성)
  if (typeof notification === "string") {
    notificationText.value = notification;
    currentNotification.value = null;
  } else {
    // notification이 객체인 경우 (새로운 방식)
    notificationText.value = notification.message || notification;
    currentNotification.value = notification;
  }

  showNotificationSnackbar.value = true;
  setTimeout(() => {
    showNotificationSnackbar.value = false;
  }, 8000); // 링크가 있을 때는 8초로 연장
};

// 현재 알림 정보를 저장하는 ref 추가
const currentNotification = ref<any>(null);

// 알림 클릭 시 게시글로 이동하는 함수
const handleNotificationClick = () => {
  if (currentNotification.value && currentNotification.value.postId) {
    const postId = currentNotification.value.postId;
    console.log("🔗 게시글로 이동:", postId);

    // 알림 스낵바 닫기
    showNotificationSnackbar.value = false;

    // 게시글 페이지로 이동
    router.push(`/forum/${postId}`);
  }
};

// 로그인 상태 변화 감지하여 웹소켓 연결/해제
watch(
  () => loginStore.user,
  (newUser, oldUser) => {
    if (newUser && newUser.id) {
      // 로그인 시 웹소켓 연결
      notificationSocket.connectWithUser(newUser.id, newUser.username);
      notificationSocket.setNotificationCallback(showNotification);
      console.log(
        "🔌 웹소켓 연결됨 - 사용자 ID:",
        newUser.id,
        "Username:",
        newUser.username
      );
    } else if (oldUser && !newUser) {
      // 로그아웃 시 웹소켓 연결 해제
      notificationSocket.disconnect();
      console.log("🔌 웹소켓 연결 해제됨");
    }
  },
  { immediate: true }
);

// 컴포넌트 마운트 시 실행
onMounted(() => {
  loadPopularTags();

  // 이미 로그인되어 있다면 웹소켓 연결
  if (loginStore.user && loginStore.user.id) {
    notificationSocket.connectWithUser(
      loginStore.user.id,
      loginStore.user.username
    );
    notificationSocket.setNotificationCallback(showNotification);
  }
});

// 컴포넌트 언마운트 시 웹소켓 연결 해제
onUnmounted(() => {
  notificationSocket.disconnect();
});
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact" :elevation="2" app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-app-bar-title class="font-weight-bold">
        <router-link
          to="/"
          @click="imageStore.resetAll()"
          class="text-decoration-none text-white"
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
                  v-model="imageStore.searchCategory"
                  :items="searchCategories"
                  label="카테고리"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="searchGrade"
                  :items="getGradeOptions()"
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
                  :items="getSortOptions()"
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
                v-model="imageStore.searchQuery"
                :label="getSearchPlaceholder()"
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
                  {{ tag.name }}
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
      <v-btn
        prepend-icon="mdi-forum"
        class="ml-2"
        @click="router.push('/forum')"
      >
        포럼
      </v-btn>
      <v-btn
        v-if="
          loginStore.user &&
          loginStore.user.roleSet &&
          loginStore.user.roleSet.includes('ROLE_ADMIN')
        "
        prepend-icon="mdi-cog"
        class="ml-2"
        @click="router.push('/admin')"
      >
        운영자페이지
      </v-btn>

      <!-- User Menu -->
      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon class="ml-2">
            <v-avatar color="surface-variant" size="36">
              <v-icon v-if="!loginStore.isLogin">mdi-account</v-icon>
              <v-img
                v-else
                :src="loginStore.user?.profileImage"
                alt="사용자 아바타"
              ></v-img>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <template v-if="loginStore.isLogin">
            <v-list-item to="/mypage">
              <v-list-item-title>마이페이지</v-list-item-title>
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
            <v-list-item @click="loginStore.logout()">
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

        <!-- <v-list-group value="gallery">
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
        </v-list-group> -->

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
          title="랭킹"
          to="/ranking"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-help-circle"
          title="도움말"
          to="/help"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

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

    <!-- 알림 스낵바 -->
    <v-snackbar
      v-model="showNotificationSnackbar"
      :timeout="8000"
      color="primary"
      location="top"
      multi-line
      :class="currentNotification?.postId ? 'notification-clickable' : ''"
      @click="handleNotificationClick"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-bell-ring</v-icon>
        <div class="flex-grow-1">
          <span>{{ notificationText }}</span>
          <div
            v-if="currentNotification?.postId"
            class="text-caption mt-1 text-blue-lighten-2"
          >
            👆 클릭하여 게시글 보기
          </div>
        </div>
      </div>
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click.stop="showNotificationSnackbar = false"
        >
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style scoped>
.v-app-bar-title a {
  color: inherit;
}

/* 클릭 가능한 알림 스낵바 스타일 */
.notification-clickable {
  cursor: pointer;
}

.notification-clickable:hover {
  opacity: 0.9;
}
</style>
