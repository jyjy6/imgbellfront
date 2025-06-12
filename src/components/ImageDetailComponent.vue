<script setup lang="ts">
import { useImageStore } from "../stores/imageStore";
import { useLoginStore } from "../stores/loginStore";
import { useRouter } from "vue-router";
const imageStore = useImageStore();
const loginStore = useLoginStore();
const router = useRouter();

const editImage = () => {
  router.push({
    name: "ImageEdit",
    params: { imageId: imageStore.selectedImage?.id },
  });
};
</script>

<template>
  <!-- 이미지 상세 다이얼로그 -->
  <v-dialog v-model="imageStore.dialog" width="800">
    <v-card v-if="imageStore.selectedImage">
      <v-img :src="imageStore.selectedImage.imageUrl" max-height="500"></v-img>
      <v-card-title>{{ imageStore.selectedImage.imageName }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <p>
              <strong>업로더:</strong>
              {{ imageStore.selectedImage.uploaderName }}
            </p>
            <p v-if="imageStore.selectedImage.artist">
              <strong>아티스트:</strong> {{ imageStore.selectedImage.artist }}
            </p>
            <p v-if="imageStore.selectedImage.source">
              <strong>출처:</strong> {{ imageStore.selectedImage.source }}
            </p>

            <div
              v-if="
                imageStore.selectedImage.tags &&
                imageStore.selectedImage.tags.length > 0
              "
            >
              <strong>태그:</strong>
              <v-chip-group>
                <v-chip
                  v-for="tag in imageStore.selectedImage.tags"
                  :key="tag.id"
                  size="small"
                  @click="imageStore.searchByTag(tag.name)"
                >
                  {{ tag.name }}
                </v-chip>
              </v-chip-group>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <v-list density="compact" lines="one">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-eye"></v-icon>
                </template>
                <v-list-item-title
                  >조회수:
                  {{ imageStore.selectedImage.viewCount }}</v-list-item-title
                >
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-heart"></v-icon>
                </template>
                <v-list-item-title
                  >좋아요:
                  {{ imageStore.selectedImage.likeCount }}</v-list-item-title
                >
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-download"></v-icon>
                </template>
                <v-list-item-title
                  >다운로드:
                  {{
                    imageStore.selectedImage.downloadCount
                  }}</v-list-item-title
                >
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-file"></v-icon>
                </template>
                <v-list-item-title
                  >{{ imageStore.selectedImage.fileType }} ({{
                    imageStore.formatFileSize(
                      imageStore.selectedImage.fileSize
                    )
                  }})</v-list-item-title
                >
              </v-list-item>
            </v-list>

            <v-btn
              block
              color="primary"
              prepend-icon="mdi-download"
              class="mt-4"
              @click="imageStore.downloadImage"
            >
              다운로드
            </v-btn>

            <v-btn
              block
              variant="outlined"
              prepend-icon="mdi-heart"
              class="mt-2"
              :color="imageStore.isLiked ? 'red' : ''"
              @click="imageStore.toggleLike"
            >
              {{ imageStore.isLiked ? "좋아요 취소" : "좋아요" }}
            </v-btn>
            <v-btn
              block
              variant="outlined"
              class="mt-2"
              color="warning"
              @click="imageStore.deleteImage"
              v-if="
                imageStore.selectedImage.uploaderName ===
                loginStore.user?.username
              "
            >
              삭제
            </v-btn>
            <v-btn
              block
              variant="outlined"
              class="mt-2"
              :color="imageStore.selectedImage.isPublic ? 'error' : 'primary'"
              @click="imageStore.togglePublic"
              v-if="
                imageStore.selectedImage.uploaderName ===
                loginStore.user?.username
              "
            >
              {{
                imageStore.selectedImage.isPublic
                  ? "비공개로 변경"
                  : "공개로 변경"
              }}
            </v-btn>
            <v-btn
              block
              variant="outlined"
              class="mt-2"
              color="primary"
              @click="editImage"
              v-if="
                imageStore.selectedImage.uploaderName ===
                loginStore.user?.username
              "
            >
              수정
            </v-btn>
          </v-col>
        </v-row>

        <!-- 댓글 섹션 -->
        <v-divider class="my-4"></v-divider>
        <h3 class="text-h6 mb-3">댓글</h3>

        <div
          v-if="
            imageStore.selectedImage.comments &&
            imageStore.selectedImage.comments.length > 0
          "
        >
          <v-list>
            <v-list-item
              v-for="comment in imageStore.selectedImage.comments"
              :key="comment.id"
            >
              <template v-slot:prepend>
                <v-avatar size="32" color="grey-lighten-1">
                  <v-icon icon="mdi-account"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ comment.writer }}</v-list-item-title>
              <v-list-item-subtitle>{{ comment.content }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
        <div v-else class="text-center pa-3">
          <p class="text-body-2">아직 댓글이 없습니다.</p>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="imageStore.closeDialog">
          닫기
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
