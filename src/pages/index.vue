<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">이미지 갤러리</h1>

        <!-- 필터링 옵션 -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="imageStore.searchTag"
                  label="태그 검색"
                  prepend-inner-icon="mdi-tag"
                  @keyup.enter="imageStore.loadImages"
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="imageStore.selectedGrade"
                  :items="imageStore.gradeOptions"
                  label="등급 필터"
                  prepend-inner-icon="mdi-filter"
                  @update:model-value="imageStore.loadImages"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="imageStore.sortOption"
                  :items="imageStore.sortOptions"
                  label="정렬"
                  prepend-inner-icon="mdi-sort"
                  @update:model-value="imageStore.loadImages"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 로딩 상태 표시 -->
    <v-row v-if="imageStore.loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <!-- 이미지 그리드 -->
    <v-row v-else>
      <v-col
        v-for="image in imageStore.images"
        :key="image.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            v-bind="props"
            :elevation="isHovering ? 12 : 2"
            :class="{ 'on-hover': isHovering }"
            @click="imageStore.viewImageDetail(image.id)"
          >
            <v-img
              :src="image.imageUrl"
              :alt="image.imageName"
              height="200"
              cover
              class="align-end"
            >
              <v-overlay
                :model-value="!!isHovering"
                contained
                scrim="rgba(0, 0, 0, 0.3)"
                class="align-center justify-center"
              >
                <div class="d-flex flex-column align-center">
                  <v-btn
                    icon="mdi-magnify"
                    variant="text"
                    color="white"
                    size="small"
                  ></v-btn>
                </div>
              </v-overlay>

              <v-chip
                v-if="image.imageGrade"
                size="x-small"
                :color="imageStore.getGradeColor(image.imageGrade)"
                class="ma-2"
              >
                {{ image.imageGrade }}
              </v-chip>
            </v-img>

            <v-card-title class="text-subtitle-1 text-truncate">
              {{ image.imageName }}
            </v-card-title>

            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="small" class="me-1">mdi-account</v-icon>
                <span class="text-caption">{{ image.uploaderName }}</span>
                <v-spacer></v-spacer>
                <v-icon size="small" class="me-1">mdi-eye</v-icon>
                <span class="text-caption me-2">{{ image.viewCount }}</span>
                <v-icon size="small" class="me-1">mdi-heart</v-icon>
                <span class="text-caption">{{ image.likeCount }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>

    <!-- 데이터가 없는 경우 표시 -->
    <v-row v-if="!imageStore.loading && imageStore.images.length === 0">
      <v-col cols="12" class="text-center">
        <v-alert type="info"> 표시할 이미지가 없습니다. </v-alert>
      </v-col>
    </v-row>

    <!-- 페이지네이션 -->
    <v-row>
      <v-col cols="12" class="text-center">
        <v-pagination
          v-model="imageStore.page"
          :length="imageStore.totalPages"
          @update:model-value="imageStore.loadImages"
          rounded
          :disabled="imageStore.loading"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- 이미지 상세 다이얼로그 -->
    <v-dialog v-model="imageStore.dialog" width="800">
      <v-card v-if="imageStore.selectedImage">
        <v-img
          :src="imageStore.selectedImage.imageUrl"
          max-height="500"
        ></v-img>
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
                variant="text"
                prepend-icon="mdi-heart"
                class="mt-2"
                :color="imageStore.isLiked ? 'red' : ''"
                @click="imageStore.toggleLike"
              >
                {{ imageStore.isLiked ? "좋아요 취소" : "좋아요" }}
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
                <v-list-item-subtitle>{{
                  comment.content
                }}</v-list-item-subtitle>
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
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useImageStore } from "../stores/imageStore";

// Pinia 스토어 사용
const imageStore = useImageStore();

// 컴포넌트 마운트 시 이미지 로드
onMounted(() => {
  imageStore.loadImages();
});
</script>

<style scoped>
.on-hover {
  transition: all 0.3s ease-in-out;
}
</style>
