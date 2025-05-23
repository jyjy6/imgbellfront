<script setup lang="ts">
import { useImageStore } from "../stores/imageStore";
import ImageDetailComponent from "./ImageDetailComponent.vue";

const imageStore = useImageStore();
</script>

<template>
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
            <v-overlay
              v-if="!image.isPublic"
              contained
              class="d-flex align-center justify-center"
              opacity="0.7"
            >
              <div class="text-center">
                <v-icon color="white" size="large">mdi-lock</v-icon>
                <div class="text-white text-h6 mt-2">비공개</div>
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
            <v-overlay
              v-if="!image.isPublic"
              contained
              class="d-flex align-end"
              opacity="0.3"
            >
              <v-sheet
                class="w-100 pa-2"
                color="red-darken-2"
                variant="elevated"
              >
                <div class="d-flex align-center">
                  <v-icon color="white" size="small">mdi-lock</v-icon>
                  <span class="text-white text-caption ml-1"
                    >비공개 이미지</span
                  >
                </div>
              </v-sheet>
            </v-overlay>
          </v-img>
          <v-chip
            v-if="!image.isPublic"
            class="position-absolute"
            style="top: 8px; right: 8px; z-index: 2"
            color="red-darken-2"
            size="small"
            variant="elevated"
          >
            <v-icon start>mdi-lock</v-icon>
            비공개
          </v-chip>
          <v-overlay
            v-if="!image.isPublic"
            contained
            class="d-flex align-end"
            opacity="0.3"
          >
            <v-sheet class="w-100 pa-2" color="red-darken-2" variant="elevated">
              <div class="d-flex align-center">
                <v-icon color="white" size="small">mdi-lock</v-icon>
                <span class="text-white text-caption ml-1">비공개 이미지</span>
              </div>
            </v-sheet>
          </v-overlay>

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
  <ImageDetailComponent />
</template>

<style scoped></style>
