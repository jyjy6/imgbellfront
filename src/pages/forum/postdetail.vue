<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useForumStore } from "../../stores/forumStore";
import type { ForumComment } from "../../types/ForumTypes";
import { useLoginStore } from "../../stores/loginStore";
import { onUnmounted } from "vue";
import { handleApiError, logError } from "../../utils/errorHandler";
const route = useRoute();
const router = useRouter();

const loginStore = useLoginStore();
const forumStore = useForumStore();
// Props로 받아온 postId 또는 라우트 파라미터에서 가져오기
const postId = ref(route.params.postId);
const replyTo = ref<number | null>(null);

// 반응형 데이터
const newComment = ref("");

onMounted(() => {
  forumStore.initViewHistory();

  forumStore.fetchSinglePost(Number(postId.value));
  forumStore.forumViewCount(Number(postId.value));
  forumStore.fetchComments(Number(postId.value));
  forumStore.fetchUserLikes();
  console.log(forumStore.isLiked);
});

onUnmounted(() => {
  forumStore.isLiked = false;
  forumStore.userLikeList = [];
  forumStore.singlePost = null;
});

// 메서드
const goBack = () => {
  router.push({ name: "BoardList" });
};

const editPost = () => {
  router.push({ name: "ForumEdit", params: { postId: postId.value } });
};

const formatDate = (dateString: string | undefined) => {
  if (dateString === undefined) return "";
  const date = new Date(dateString);
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

const addComment = async () => {
  if (!newComment.value.trim()) return;

  try {
    await forumStore.addComment(
      Number(postId.value),
      newComment.value,
      replyTo.value ?? undefined
    );
    newComment.value = "";
    replyTo.value = null;
  } catch (error: any) {
    // 🆕 유틸리티 함수 사용 (import 필요: import { handleApiError, logError } from '@/utils/errorHandler')
    logError("댓글 작성", error);
    const errorMessage = handleApiError(error);
    alert(errorMessage);
  }
};
const replyComment = (commentId: number) => {
  replyTo.value = commentId;
  newComment.value = "";
};

const likeComment = (commentId: number) => {
  console.log("댓글 추천:", commentId);
};

const reportComment = (commentId: number) => {
  console.log("댓글 신고:", commentId);
};

// const openImageModal = (image: any) => {
//   console.log("이미지 모달 열기:", image);
// };
</script>
<template>
  <v-container>
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

    <!-- 게시글 내용 -->
    <v-card elevation="2">
      <!-- 게시글 헤더 -->
      <v-card-title class="pa-4 border-b">
        <div class="w-100">
          <h2 class="text-h5 mb-2">{{ forumStore.singlePost?.title }}</h2>
          <div class="d-flex justify-space-between align-center">
            <div class="author-info">
              <div>
                <div class="font-weight-medium">
                  {{ forumStore.singlePost?.authorDisplayName }}
                </div>
                <div class="text-caption text-grey">
                  {{ formatDate(forumStore.singlePost?.createdAt) }}
                </div>
              </div>
            </div>
            <div class="post-stats">
              <v-chip size="small" color="grey">
                <v-icon start>mdi-eye</v-icon>
                {{ forumStore.singlePost?.viewCount }}
              </v-chip>
              <v-chip size="small" color="blue">
                <v-icon start>mdi-thumb-up</v-icon>
                {{ forumStore.singlePost?.likeCount }}
              </v-chip>
              <v-chip size="small" color="orange">
                <v-icon start>mdi-comment</v-icon>
                {{
                  (forumStore.singlePost?.commentsCount as ForumComment[]) || 0
                }}
              </v-chip>
              <div
                v-if="
                  forumStore.singlePost?.authorDisplayName ===
                  loginStore.user?.displayName
                "
              >
                <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-pencil"
                  @click="editPost"
                >
                  수정
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-delete"
                  @click="forumStore.deletePost(Number(postId))"
                  >삭제</v-btn
                >
              </div>
            </div>
          </div>
        </div>
      </v-card-title>

      <!-- 게시글 본문 -->
      <v-card-text class="pa-10">
        <div class="post-content" v-html="forumStore.singlePost?.content"></div>
      </v-card-text>

      <!-- 추천/비추천 버튼 -->
      <v-card-actions class="justify-center pa-4 border-t">
        <v-btn
          variant="outlined"
          size="large"
          prepend-icon="mdi-thumb-up"
          :color="forumStore.isLiked ? 'red' : 'blue'"
          @click="forumStore.toggleLike"
        >
          추천 {{ forumStore.singlePost?.likeCount }}
        </v-btn>
      </v-card-actions>
      <div class="d-flex justify-end pa-4">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">
          글 목록
        </v-btn>
      </div>
    </v-card>
    <!-- 댓글 섹션 -->
    <v-card class="mt-4" elevation="2">
      <v-card-title class="pa-4 border-b">
        <v-icon class="mr-2">mdi-comment-multiple</v-icon>
        댓글
        {{ (forumStore.singlePost?.commentsCount as ForumComment[]) || 0 }}개
      </v-card-title>

      <!-- 댓글 작성 -->
      <v-card-text class="pa-4 border-b">
        <div v-if="replyTo" class="mb-2">
          <v-chip
            color="primary"
            variant="outlined"
            closable
            @click:close="replyTo = null"
          >
            답글 작성 중
          </v-chip>
        </div>
        <v-textarea
          v-model="newComment"
          :label="replyTo ? '답글을 입력하세요' : '댓글을 입력하세요'"
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
            {{ replyTo ? "답글 등록" : "댓글 등록" }}
          </v-btn>
        </div>
      </v-card-text>

      <!-- 댓글 목록 -->
      <div class="pa-4">
        <div
          v-for="comment in forumStore.comments.filter((c) => !c.parentId)"
          :key="comment.id"
          class="comment-item mb-4"
        >
          <div class="d-flex justify-space-between mb-2">
            <div class="author-info">
              <div>
                <span class="font-weight-medium">{{
                  comment.authorDisplayName
                }}</span>
                <span class="text-caption text-grey ml-2">{{
                  formatDate(new Date(comment?.createdAt).toISOString())
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
              {{ comment.likeCount }}
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
          <div v-if="comment.comments.length > 0" class="ml-10 mt-3">
            <div
              v-for="subComment in comment.comments"
              :key="subComment.id"
              class="reply-item pa-3 bg-grey-lighten-5 rounded mb-2"
            >
              <div class="d-flex justify-space-between mb-1">
                <div class="author-info">
                  <span class="font-weight-medium text-body-2">{{
                    subComment.authorDisplayName
                  }}</span>
                  <span class="text-caption text-grey ml-2">{{
                    formatDate(new Date(subComment?.createdAt).toISOString())
                  }}</span>
                </div>
              </div>
              <div class="reply-content ml-8 text-body-2">
                {{ subComment.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.board-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

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
