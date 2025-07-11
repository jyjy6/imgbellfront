<template>
  <v-card
    class="pa-3"
    style="
      position: sticky;
      top: 80px;
      z-index: 30;
      max-width: 250px;
      margin: auto;
    "
    elevation="2"
  >
    <v-card-title class="pa-0 mb-3">
      <h3 class="text-h6 text-center">최근 본 이미지</h3>
    </v-card-title>

    <v-divider class="mb-3" />

    <div v-if="recentViewItems.length === 0" class="text-center py-4">
      <v-icon
        icon="mdi-image-off"
        size="48"
        color="grey-lighten-1"
        class="mb-2"
      />
      <p class="text-caption text-grey">최근 본 이미지가 없습니다.</p>
    </div>

    <div v-else class="recent-images-grid">
      <v-card
        v-for="img in recentViewItems"
        :key="img.imageId"
        @click="goDetail(img.imageId)"
        class="recent-image-card mb-2"
        variant="outlined"
        hover
      >
        <v-img :src="img.imageUrl" height="80" cover class="rounded">
          <template v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular indeterminate color="grey-lighten-4" />
            </div>
          </template>
        </v-img>
      </v-card>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useImageStore } from "../stores/imageStore";
import { storeToRefs } from "pinia";

const imageStore = useImageStore();
const { recentViewItems } = storeToRefs(imageStore);

function goDetail(id: number) {
  imageStore.viewImageDetail(id);
}

onMounted(() => {
  imageStore.loadRecentViewImages();
});
</script>

<style scoped>
.recent-images-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-image-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border-radius: 8px;
  overflow: hidden;
}

.recent-image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recent-image-card .v-img {
  border-radius: 6px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .recent-images-grid {
    gap: 6px;
  }

  .recent-image-card {
    margin-bottom: 0.5rem;
  }
}
</style>
