<script setup lang="ts">
import { ref } from "vue";
import ImageEditFormComponent from "../../components/ImageEditFormComponent.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const imageId = ref(Number(route.params.imageId));
</script>

<template>
  <ImageEditFormComponent :imageId="imageId" />
</template>

<style scoped></style>
