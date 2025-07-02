<script setup lang="ts">
import { onMounted } from "vue";
import { useImageStore } from "../stores/imageStore";
import ImageListComponent from "../components/ImageListComponent.vue";
import ImageSearchComponent from "../components/ImageSearchComponent.vue";
import RecentViewImagesComponent from "../components/RecentViewImagesComponent.vue";

// Pinia 스토어 사용
const imageStore = useImageStore();

// 컴포넌트 마운트 시 이미지 로드
onMounted(() => {
  imageStore.loadImages();

  alert("깃액션 동작 확인되었습니당123123123");
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="10">
        <h1 class="text-h4 mb-4">이미지 갤러리</h1>

        <!-- 필터링 옵션 -->
        <ImageSearchComponent />
        <!-- 이미지 그리드 -->
        <ImageListComponent />
      </v-col>
      <v-col cols="2">
        <RecentViewImagesComponent />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.on-hover {
  transition: all 0.3s ease-in-out;
}
</style>
