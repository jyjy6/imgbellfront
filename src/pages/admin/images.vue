<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useImageStore } from "../../stores/imageStore";
import ImageSearchComponent from "../../components/ImageSearchComponent.vue";
import ImageDetailComponent from "../../components/ImageDetailComponent.vue";

const imageStore = useImageStore();

// 페이지네이션 상태
const page = ref(1);
const itemsPerPage = ref(imageStore.size);

// 페이지 변경 시 store에 반영
watch(page, (val) => {
  imageStore.page = val;
  imageStore.loadImages();
});
watch(itemsPerPage, (val) => {
  imageStore.size = val;
  imageStore.page = 1; // 사이즈 바뀌면 1페이지로
  page.value = 1;
  imageStore.loadImages();
});

onMounted(() => {
  imageStore.loadImages();
});

// 이미지 삭제
const handleDelete = async (id: number) => {
  await imageStore.viewImageDetail(id);
  imageStore.dialog = false;
  await imageStore.deleteImage();
  await imageStore.loadImages();
};

// 공개/비공개 토글
const handleTogglePublic = async (id: number) => {
  await imageStore.viewImageDetail(id);
  imageStore.dialog = false;
  await imageStore.togglePublic();
  await imageStore.loadImages();
};
</script>

<template>
  <v-container>
    <ImageSearchComponent />
    <v-data-table
      :items="imageStore.images"
      :headers="[
        { title: 'ID', key: 'id' },
        { title: '썸네일', key: 'imageUrl' },
        { title: '이름', key: 'imageName' },
        { title: '업로더', key: 'uploaderName' },
        { title: '등급', key: 'imageGrade' },
        { title: '공개', key: 'isPublic' },
        { title: '관리', key: 'actions', sortable: false },
      ]"
      :loading="imageStore.loading"
      hide-default-footer
    >
      <template #item.imageUrl="{ item }">
        <v-img
          :src="item.imageUrl"
          max-width="80"
          style="cursor: pointer"
          @click="imageStore.viewImageDetail(item.id)"
        />
      </template>
      <template #item.isPublic="{ item }">
        <v-chip :color="item.isPublic ? 'green' : 'red'">
          {{ item.isPublic ? "공개" : "비공개" }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn size="small" color="error" @click="handleDelete(item.id)"
          >삭제</v-btn
        >
        <v-btn size="small" @click="handleTogglePublic(item.id)">
          {{ item.isPublic ? "비공개" : "공개" }}
        </v-btn>
      </template>
    </v-data-table>
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
  </v-container>
  <ImageDetailComponent />
</template>
