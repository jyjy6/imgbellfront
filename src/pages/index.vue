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
                  @keyup.enter="imageStore.searchByTag(imageStore.searchTag)"
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

    <!-- 이미지 그리드 -->
    <ImageListComponent />
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useImageStore } from "../stores/imageStore";
import ImageListComponent from "../components/ImageListComponent.vue";

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
