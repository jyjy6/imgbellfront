<!-- BoardList.vue -->
<template>
  <v-container>
    <!-- 게시판 헤더 -->
    <v-card class="board-header mb-4" elevation="3">
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
      <v-col cols="12" md="4" class="d-flex justify-end">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-pencil"
          @click="writePost"
        >
          글쓰기
        </v-btn>
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
            v-for="post in posts"
            :key="post.id"
            :class="getPostRowClass(post)"
            class="post-row"
            @click="viewPost(post.id)"
          >
            <td>
              <span
                v-if="post.type === 'notice'"
                class="text-red font-weight-bold"
                >공지</span
              >
              <span
                v-else-if="post.type === 'hot'"
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
                <v-chip
                  v-if="post.commentCount > 0"
                  color="blue"
                  size="small"
                  class="ml-2"
                >
                  [{{ post.commentCount }}]
                </v-chip>
                <v-icon
                  v-if="post.hasImage"
                  size="small"
                  color="green"
                  class="ml-1"
                >
                  mdi-image
                </v-icon>
              </div>
            </td>
            <td>
              <div class="author-info">
                <v-avatar size="24">
                  <v-img :src="post.author.avatar"></v-img>
                </v-avatar>
                <span>{{ post.author.nickname }}</span>
              </div>
            </td>
            <td class="text-grey">{{ formatDate(post.createdAt) }}</td>
            <td class="text-center">{{ post.views }}</td>
            <td class="text-center text-blue">{{ post.likes }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

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

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 반응형 데이터
const searchKeyword = ref("");
const currentPage = ref(1);
const totalPages = ref(10);

// 더미 게시글 데이터
const posts = ref([
  {
    id: 1,
    type: "notice",
    title: "[공지] 게시판 이용 안내",
    author: {
      nickname: "관리자",
      avatar: "https://cdn.vuetifyjs.com/images/john.jpg",
    },
    createdAt: new Date("2024-05-20"),
    views: 1523,
    likes: 45,
    commentCount: 12,
    hasImage: false,
  },
  {
    id: 2,
    type: "hot",
    title: "오늘 점심 뭐 먹을까요? 추천 부탁드려요",
    author: {
      nickname: "맛집탐방러",
      avatar: "https://cdn.vuetifyjs.com/images/lisa.jpg",
    },
    createdAt: new Date("2024-05-23"),
    views: 892,
    likes: 67,
    commentCount: 23,
    hasImage: true,
  },
  {
    id: 3,
    type: "normal",
    title: "Vue3 + Vuetify 조합 어떤가요?",
    author: {
      nickname: "개발자123",
      avatar: "https://cdn.vuetifyjs.com/images/john.jpg",
    },
    createdAt: new Date("2024-05-23"),
    views: 234,
    likes: 12,
    commentCount: 8,
    hasImage: false,
  },
  {
    id: 4,
    type: "normal",
    title: "주말에 영화 보러 갈 사람?",
    author: {
      nickname: "영화매니아",
      avatar: "https://cdn.vuetifyjs.com/images/lisa.jpg",
    },
    createdAt: new Date("2024-05-22"),
    views: 445,
    likes: 28,
    commentCount: 15,
    hasImage: false,
  },
  {
    id: 5,
    type: "normal",
    title: "새로 나온 게임 해보신 분 있나요?",
    author: {
      nickname: "게이머",
      avatar: "https://cdn.vuetifyjs.com/images/john.jpg",
    },
    createdAt: new Date("2024-05-22"),
    views: 678,
    likes: 34,
    commentCount: 19,
    hasImage: true,
  },
]);

// 메서드
const getPostRowClass = (post: any) => {
  if (post.type === "notice") return "notice-post";
  if (post.type === "hot") return "hot-post";
  return "";
};

const formatDate = (date: Date) => {
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
  // 페이지 변경
  console.log("페이지 변경:", page);
};

onMounted(() => {
  // 컴포넌트 마운트 시 실행
});
</script>

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
