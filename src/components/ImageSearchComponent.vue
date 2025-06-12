<script setup lang="ts">
import { useImageStore } from "../stores/imageStore";

const imageStore = useImageStore();
</script>

<template>
  <v-card class="mb-4">
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="imageStore.searchQuery"
            label="검색"
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
</template>

<style scoped></style>
