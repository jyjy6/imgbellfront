<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useForumStore } from "../../stores/forumStore";

const router = useRouter();
const forumStore = useForumStore();

// 반응형 데이터

const currentPage = ref(1);
const totalPages = computed(() => forumStore.totalPages);

// 더미 게시글 데이터

// 메서드

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 24) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const viewPost = (postId: number) => {
  // 게시글 상세 페이지로 이동
  router.push({ name: "PostDetail", params: { postId } });
};

const writePost = () => {
  // 글쓰기 페이지로 이동
  router.push({ name: "ForumPost" });
};

const changePage = (page: number) => {
  forumStore.fetchPosts(page);
};

onMounted(() => {
  forumStore.fetchPosts(1);
  forumStore.fetchNoticeList();
  forumStore.loadAllRankings(); // 랭킹 데이터 로드
});

// 검색 관련 상태ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
const searchKeyword = ref("");
const isSearching = ref(false);

// 검색 실행
const searchPosts = () => {
  if (searchKeyword.value.trim()) {
    isSearching.value = true;
    forumStore.searchPosts(searchKeyword.value);
  }
};

// 게시글 목록 표시 로직 수정
const displayPosts = computed(() => {
  return isSearching.value ? forumStore.searchResults : forumStore.posts;
});

// 제목 길이 제한 함수
const truncateTitle = (title: string, maxLength: number = 25) => {
  return title.length > maxLength
    ? title.substring(0, maxLength) + "..."
    : title;
};
</script>

<template>
  <v-container>
    <!-- 메인 컨텐츠와 사이드바를 위한 레이아웃 -->
    <v-row>
      <!-- 메인 컨텐츠 영역 -->
      <v-col cols="12" md="8">
        <!-- 기존의 게시판 헤더, 검색, 게시글 목록 등을 여기로 이동 -->
        <v-card
          class="board-header mb-4 pa-5"
          elevation="3"
          @click="router.push('/forum')"
        >
          <v-card-title class="text-h4 text-white">
            <v-icon class="mr-3" size="large">mdi-forum</v-icon>
            자유게시판
          </v-card-title>
          <v-card-subtitle class="text-white">
            자유롭게 소통하는 공간입니다
          </v-card-subtitle>
        </v-card>

        <!-- 기존 검색 및 글쓰기 영역... -->
        <v-row class="mb-4">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="searchKeyword"
              label="검색어를 입력하세요"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              @keyup.enter="searchPosts"
            >
              <template v-slot:append-inner>
                <v-btn
                  v-if="isSearching"
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  @click="
                    isSearching = false;
                    forumStore.clearSearch();
                  "
                ></v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- 기존 게시글 목록... -->
        <v-card elevation="2">
          <v-table>
            <thead>
              <tr>
                <th width="80">번호</th>
                <th>제목</th>
                <th width="120">글쓴이</th>
                <th width="100">날짜</th>
                <th width="60">조회</th>
                <th width="60">추천</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="post in forumStore.noticeList"
                :key="post.id"
                class="post-row notice-post"
                @click="viewPost(post.id)"
              >
                <td>
                  <span class="text-red font-weight-bold">공지</span>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <span class="post-title font-weight-medium">{{
                      post.title
                    }}</span>
                    <v-chip color="blue" variant="text" size="small">
                      [{{ post.commentsCount || 0 }}]
                    </v-chip>
                  </div>
                </td>
                <td>
                  <div class="author-info">
                    <span>{{ post.authorDisplayName }}</span>
                  </div>
                </td>
                <td class="text-grey">{{ formatDate(post.createdAt) }}</td>
                <td class="text-center">{{ post.viewCount }}</td>
                <td class="text-center text-blue">{{ post.likeCount }}</td>
              </tr>
              <tr
                v-for="post in displayPosts"
                :key="post.id"
                class="post-row"
                @click="viewPost(post.id)"
              >
                <td>
                  <span
                    v-if="post.type === 'NOTICE'"
                    class="text-red font-weight-bold"
                    >공지</span
                  >
                  <span
                    v-else-if="post.type === 'HOT'"
                    class="text-orange font-weight-bold"
                    >HOT</span
                  >
                  <span v-else>{{ post.id }}</span>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <span class="post-title font-weight-medium">{{
                      post.title
                    }}</span>
                    <v-chip color="blue" variant="text" size="small">
                      [{{ post.commentsCount || 0 }}]
                    </v-chip>
                  </div>
                </td>
                <td>
                  <div class="author-info">
                    <span>{{ post.authorDisplayName }}</span>
                  </div>
                </td>
                <td class="text-grey">{{ formatDate(post.createdAt) }}</td>
                <td class="text-center">{{ post.viewCount }}</td>
                <td class="text-center text-blue">{{ post.likeCount }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
        <v-col class="d-flex justify-end">
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-pencil"
            @click="writePost"
          >
            글쓰기
          </v-btn>
        </v-col>

        <!-- 기존 페이지네이션... -->
        <div class="text-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="changePage"
          ></v-pagination>
        </div>
      </v-col>

      <!-- 사이드바 영역 -->
      <v-col cols="12" md="4">
        <!-- 광고 영역 -->
        <v-card class="mb-4" elevation="2">
          <v-card-text class="text-center pa-4">
            <div class="ad-placeholder">
              <v-icon size="large" color="grey">mdi-advertisement</v-icon>
              <div class="text-subtitle-1 mt-2">광고 영역</div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 일간 인기 게시물 -->
        <v-card class="mb-4" elevation="2">
          <v-card-title
            class="bg-primary text-white d-flex justify-space-between align-center"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-fire</v-icon>
              일간 인기 게시물
            </div>
            <v-btn
              icon
              size="small"
              variant="text"
              @click="forumStore.loadDailyRanking"
              :loading="forumStore.rankingLoading"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          <v-list>
            <template v-if="forumStore.rankingLoading">
              <v-list-item>
                <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
              </v-list-item>
            </template>
            <template v-else-if="forumStore.dailyRankingForums.length > 0">
              <v-list-item
                v-for="(forum, index) in forumStore.dailyRankingForums"
                :key="forum.id"
                class="popular-post"
                @click="viewPost(forum.id)"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="
                      index === 0
                        ? 'amber'
                        : index === 1
                        ? 'grey-lighten-1'
                        : index === 2
                        ? 'orange'
                        : 'primary'
                    "
                    size="24"
                  >
                    <span class="text-caption">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ truncateTitle(forum.title) }}
                </v-list-item-title>
                <template v-slot:append>
                  <div class="text-caption text-grey d-flex align-center">
                    <v-icon size="12" class="mr-1">mdi-eye</v-icon>
                    {{ forum.viewCount }}
                    <v-icon size="12" class="ml-2 mr-1">mdi-heart</v-icon>
                    {{ forum.likeCount }}
                  </div>
                </template>
              </v-list-item>
            </template>
            <template v-else>
              <v-list-item>
                <v-list-item-title class="text-body-2 text-grey">
                  아직 랭킹 데이터가 없습니다.
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-list>
        </v-card>

        <!-- 주간 인기 게시물 -->
        <v-card class="mb-4" elevation="2">
          <v-card-title
            class="bg-primary text-white d-flex justify-space-between align-center"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-clock-outline</v-icon>
              주간 인기 게시물
            </div>
            <v-btn
              icon
              size="small"
              variant="text"
              @click="forumStore.loadWeeklyRanking"
              :loading="forumStore.rankingLoading"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          <v-list>
            <template v-if="forumStore.rankingLoading">
              <v-list-item>
                <v-skeleton-loader type="list-item-avatar"></v-skeleton-loader>
              </v-list-item>
            </template>
            <template v-else-if="forumStore.weeklyRankingForums.length > 0">
              <v-list-item
                v-for="(forum, index) in forumStore.weeklyRankingForums"
                :key="forum.id"
                class="weekly-post"
                @click="viewPost(forum.id)"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="
                      index === 0
                        ? 'amber'
                        : index === 1
                        ? 'grey-lighten-1'
                        : index === 2
                        ? 'orange'
                        : 'primary'
                    "
                    size="24"
                  >
                    <span class="text-caption">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ truncateTitle(forum.title) }}
                </v-list-item-title>
                <template v-slot:append>
                  <div class="text-caption text-grey d-flex align-center">
                    <v-icon size="12" class="mr-1">mdi-eye</v-icon>
                    {{ forum.viewCount }}
                    <v-icon size="12" class="ml-2 mr-1">mdi-heart</v-icon>
                    {{ forum.likeCount }}
                  </div>
                </template>
              </v-list-item>
            </template>
            <template v-else>
              <v-list-item>
                <v-list-item-title class="text-body-2 text-grey">
                  아직 랭킹 데이터가 없습니다.
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-list>
        </v-card>

        <!-- 통계 -->
        <v-card elevation="2">
          <v-card-title class="bg-primary text-white">
            <v-icon class="mr-2">mdi-chart-bar</v-icon>
            게시판 통계
          </v-card-title>
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-post</v-icon>
              </template>
              <v-list-item-title>전체 게시물</v-list-item-title>
              <template v-slot:append>
                <span class="text-primary">1,234</span>
              </template>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-account-group</v-icon>
              </template>
              <v-list-item-title>오늘 방문자</v-list-item-title>
              <template v-slot:append>
                <span class="text-primary">567</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <!-- 로딩상태 -->
  <v-overlay
    :model-value="forumStore.searchLoading"
    class="align-center justify-center"
  >
    <v-progress-circular indeterminate size="64"></v-progress-circular>
  </v-overlay>
</template>

<style scoped>
.board-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.post-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-row:hover {
  background-color: #f5f5f5;
}

.hot-post {
  background-color: #fff3cd !important;
}

.notice-post {
  background-color: #d1ecf1 !important;
}

.post-title {
  color: #333;
}

.post-title:hover {
  color: #1976d2;
  text-decoration: underline;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 새로운 스타일 추가 */
.ad-placeholder {
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 2rem;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.popular-post:hover,
.weekly-post:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}

.v-list-item {
  min-height: 40px;
  padding: 8px 16px;
}

.v-card-title {
  font-size: 1rem;
  padding: 12px 16px;
}

/* 검색 관련 스타일 추가 */
.v-text-field {
  position: relative;
}

.v-btn.v-btn--icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>
