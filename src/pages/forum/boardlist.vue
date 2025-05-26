<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useForumStore } from "../../stores/forumStore";

const router = useRouter();
const forumStore = useForumStore();

// 반응형 데이터
const searchKeyword = ref("");
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

const searchPosts = () => {
  // 검색 기능
  console.log("검색:", searchKeyword.value);
};

const changePage = (page: number) => {
  forumStore.fetchPosts(page);
};

onMounted(() => {
  forumStore.fetchPosts(1);
  forumStore.fetchNoticeList();
});
</script>

<template>
  <v-container>
    <!-- 게시판 헤더 -->
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

    <!-- 검색 및 글쓰기 -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-text-field
          v-model="searchKeyword"
          label="검색어를 입력하세요"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          @keyup.enter="searchPosts"
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- 게시글 목록 -->
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
            v-for="post in forumStore.posts"
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

    <!-- 페이지네이션 -->
    <div class="text-center mt-4">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
        @update:model-value="changePage"
      ></v-pagination>
    </div>
  </v-container>
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
</style>
