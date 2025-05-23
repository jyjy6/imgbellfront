<!-- PostDetail.vue -->
<template>
  <v-container>
    <!-- 뒤로가기 버튼 -->
    <v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4"
      @click="goBack"
    >
      목록으로
    </v-btn>

    <!-- 게시글 내용 -->
    <v-card elevation="2">
      <!-- 게시글 헤더 -->
      <v-card-title class="pa-4 border-b">
        <div class="w-100">
          <h2 class="text-h5 mb-2">{{ post.title }}</h2>
          <div class="d-flex justify-space-between align-center">
            <div class="author-info">
              <v-avatar size="32" class="mr-2">
                <v-img :src="post.author.avatar"></v-img>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ post.author.nickname }}</div>
                <div class="text-caption text-grey">
                  {{ formatDate(post.createdAt) }}
                </div>
              </div>
            </div>
            <div class="post-stats">
              <v-chip size="small" color="grey">
                <v-icon start>mdi-eye</v-icon>
                {{ post.views }}
              </v-chip>
              <v-chip size="small" color="blue">
                <v-icon start>mdi-thumb-up</v-icon>
                {{ post.likes }}
              </v-chip>
              <v-chip size="small" color="orange">
                <v-icon start>mdi-comment</v-icon>
                {{ post.commentCount }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-title>

      <!-- 게시글 본문 -->
      <v-card-text class="pa-4">
        <div class="post-content" v-html="post.content"></div>

        <!-- 첨부 이미지 -->
        <div v-if="post.images.length > 0" class="mt-4">
          <v-row>
            <v-col
              v-for="(image, index) in post.images"
              :key="index"
              cols="12"
              md="6"
            >
              <v-img
                :src="image.url"
                :alt="image.alt"
                max-height="400"
                class="rounded"
                @click="openImageModal(image)"
              ></v-img>
            </v-col>
          </v-row>
        </div>
      </v-card-text>

      <!-- 추천/비추천 버튼 -->
      <v-card-actions class="justify-center pa-4 border-t">
        <v-btn
          color="blue"
          variant="outlined"
          size="large"
          prepend-icon="mdi-thumb-up"
          @click="likePost"
        >
          추천 {{ post.likes }}
        </v-btn>
        <v-btn
          color="red"
          variant="outlined"
          size="large"
          prepend-icon="mdi-thumb-down"
          class="ml-4"
          @click="dislikePost"
        >
          비추천 {{ post.dislikes }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 댓글 섹션 -->
    <v-card class="mt-4" elevation="2">
      <v-card-title class="pa-4 border-b">
        <v-icon class="mr-2">mdi-comment-multiple</v-icon>
        댓글 {{ comments.length }}개
      </v-card-title>

      <!-- 댓글 작성 -->
      <v-card-text class="pa-4 border-b">
        <v-textarea
          v-model="newComment"
          label="댓글을 입력하세요"
          variant="outlined"
          rows="3"
          auto-grow
        ></v-textarea>
        <div class="d-flex justify-end mt-2">
          <v-btn
            color="primary"
            @click="addComment"
            :disabled="!newComment.trim()"
          >
            댓글 등록
          </v-btn>
        </div>
      </v-card-text>

      <!-- 댓글 목록 -->
      <div class="pa-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item mb-4"
        >
          <div class="d-flex justify-space-between mb-2">
            <div class="author-info">
              <v-avatar size="28" class="mr-2">
                <v-img :src="comment.author.avatar"></v-img>
              </v-avatar>
              <div>
                <span class="font-weight-medium">{{
                  comment.author.nickname
                }}</span>
                <span class="text-caption text-grey ml-2">{{
                  formatDate(comment.createdAt)
                }}</span>
              </div>
            </div>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item @click="reportComment(comment.id)">
                  <v-list-item-title>신고</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <div class="comment-content ml-10">{{ comment.content }}</div>

          <div class="comment-actions ml-10 mt-2">
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-thumb-up"
              @click="likeComment(comment.id)"
            >
              {{ comment.likes }}
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-reply"
              @click="replyComment(comment.id)"
            >
              답글
            </v-btn>
          </div>

          <!-- 대댓글 -->
          <div v-if="comment.replies.length > 0" class="ml-10 mt-3">
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              class="reply-item pa-3 bg-grey-lighten-5 rounded mb-2"
            >
              <div class="d-flex justify-space-between mb-1">
                <div class="author-info">
                  <v-avatar size="24" class="mr-2">
                    <v-img :src="reply.author.avatar"></v-img>
                  </v-avatar>
                  <span class="font-weight-medium text-body-2">{{
                    reply.author.nickname
                  }}</span>
                  <span class="text-caption text-grey ml-2">{{
                    formatDate(reply.createdAt)
                  }}</span>
                </div>
              </div>
              <div class="reply-content ml-8 text-body-2">
                {{ reply.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- 관련 게시글 -->
    <v-card class="mt-4" elevation="2">
      <v-card-title class="pa-4">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        관련 게시글
      </v-card-title>
      <v-list>
        <v-list-item
          v-for="relatedPost in relatedPosts"
          :key="relatedPost.id"
          @click="viewRelatedPost(relatedPost.id)"
        >
          <v-list-item-title>{{ relatedPost.title }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ relatedPost.author.nickname }} ·
            {{ formatDate(relatedPost.createdAt) }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// Props로 받아온 postId 또는 라우트 파라미터에서 가져오기
const postId = ref(route.params.postId);

// 반응형 데이터
const newComment = ref("");

// 더미 게시글 데이터
const post = ref({
  id: 1,
  title: "오늘 점심 뭐 먹을까요? 추천 부탁드려요",
  content: `
    <p>안녕하세요! 점심시간이 다가오는데 뭘 먹을지 너무 고민되네요 😅</p>
    <p>요즘 날씨도 좋고 해서 밖에 나가서 먹고 싶은데, 혹시 맛있는 곳 아시는 분 계신가요?</p>
    <p><strong>조건:</strong></p>
    <ul>
      <li>강남역 근처</li>
      <li>1만원 이하</li>
      <li>혼밥 가능한 곳</li>
    </ul>
    <p>댓글로 추천 부탁드려요! 🙏</p>
  `,
  author: {
    nickname: "맛집탐방러",
    avatar: "https://cdn.vuetifyjs.com/images/lisa.jpg",
  },
  createdAt: new Date("2024-05-23T14:30:00"),
  views: 892,
  likes: 67,
  dislikes: 3,
  commentCount: 23,
  images: [
    {
      url: "https://picsum.photos/600/400?random=1",
      alt: "맛있어 보이는 음식 사진",
    },
  ],
});

// 더미 댓글 데이터
const comments = ref([
  {
    id: 1,
    content: "강남역 근처에 김밥천국 어떠세요? 저렴하고 혼밥하기 좋아요!",
    author: {
      nickname: "김밥러버",
      avatar: "https://cdn.vuetifyjs.com/images/john.jpg",
    },
    createdAt: new Date("2024-05-23T14:35:00"),
    likes: 5,
    replies: [
      {
        id: 11,
        content: "김밥천국 진짜 좋죠! 특히 참치김밥 추천해요",
        author: {
          nickname: "참치좋아",
          avatar: "https://cdn.vuetifyjs.com/images/lisa.jpg",
        },
        createdAt: new Date("2024-05-23T14:40:00"),
      },
    ],
  },
  {
    id: 2,
    content: "혼밥이면 쿠우쿠우 어때요? 뷔페라서 다양하게 먹을 수 있어요",
    author: {
      nickname: "뷔페매니아",
      avatar: "https://cdn.vuetifyjs.com/images/john.jpg",
    },
    createdAt: new Date("2024-05-23T14:45:00"),
    likes: 3,
    replies: [],
  },
  {
    id: 3,
    content: "날씨 좋을 때는 야외 테라스 있는 카페에서 브런치 어떠세요?",
    author: {
      nickname: "카페투어",
      avatar: "https://cdn.vuetifyjs.com/images/lisa.jpg",
    },
    createdAt: new Date("2024-05-23T15:00:00"),
    likes: 8,
    replies: [],
  },
]);

// 관련 게시글
const relatedPosts = ref([
  {
    id: 2,
    title: "강남 맛집 리스트 정리해봤어요",
    author: { nickname: "맛집지킴이" },
    createdAt: new Date("2024-05-22"),
  },
  {
    id: 3,
    title: "혼밥하기 좋은 곳 추천해주세요",
    author: { nickname: "혼밥왕" },
    createdAt: new Date("2024-05-21"),
  },
]);

// 메서드
const goBack = () => {
  router.push({ name: "BoardList" });
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime(); // 밀리초 차이 계산

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
};

const likePost = () => {
  post.value.likes++;
  console.log("게시글 추천");
};

const dislikePost = () => {
  post.value.dislikes++;
  console.log("게시글 비추천");
};

const addComment = () => {
  if (!newComment.value.trim()) return;

  const comment = {
    id: comments.value.length + 1,
    content: newComment.value,
    author: {
      nickname: "현재사용자",
      avatar: "https://cdn.vuetifyjs.com/images/john.jpg",
    },
    createdAt: new Date(),
    likes: 0,
    replies: [],
  };

  comments.value.push(comment);
  newComment.value = "";
  post.value.commentCount++;
  console.log("댓글 추가");
};

const likeComment = (commentId: number) => {
  const comment = comments.value.find((c) => c.id === commentId);
  if (comment) {
    comment.likes++;
  }
  console.log("댓글 추천:", commentId);
};

const replyComment = (commentId: number) => {
  console.log("댓글 답글:", commentId);
};

const reportComment = (commentId: number) => {
  console.log("댓글 신고:", commentId);
};

const openImageModal = (image: any) => {
  console.log("이미지 모달 열기:", image);
};

const viewRelatedPost = (postId: number) => {
  router.push({ name: "PostDetail", params: { postId } });
};

onMounted(() => {
  // 실제로는 postId로 게시글 데이터를 가져오는 API 호출
  console.log("게시글 ID:", postId.value);
  // 게시글 조회수 증가 등의 로직
  post.value.views++;
});
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e0e0e0;
}

.border-t {
  border-top: 1px solid #e0e0e0;
}

.post-content {
  line-height: 1.8;
  font-size: 14px;
}

.post-content p {
  margin-bottom: 12px;
}

.post-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.author-info {
  display: flex;
  align-items: center;
}

.post-stats {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-content {
  line-height: 1.6;
  margin: 8px 0;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.reply-item {
  background-color: #f8f9fa;
}
</style>
