<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import EditorComponent from "../../components/EditorComponent.vue";

const route = useRoute();
const postId = ref(route.params.postId);

const contentFields = [
  {
    name: "type",
    label: "탭을 골라주세요",
    type: "select",
    rules: [(v: string) => !!v || "필수 입력입니다."],
    items: ["NOTICE", "HOT", "NORMAL"],
  },
];

// GET 요청으로 기존 데이터를 가져올 URL
const getURL = `/api/forum/edit/${postId.value}`;

// PUT 요청으로 수정할 URL
const updateURL = `/api/forum/edit/${postId.value}`;

// 수정 완료 후 리다이렉트할 URL
const redirectURL = `/forum/${postId.value}`;
</script>

<template>
  <h3>포럼 글 수정</h3>
  <EditorComponent
    :URL="updateURL"
    :getURL="getURL"
    :fields="contentFields"
    :redirectURL="redirectURL"
    :isPut="true"
  />
</template>

<style scoped></style>
