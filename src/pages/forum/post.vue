<script setup lang="ts">
import EditorComponent from "../../components/EditorComponent.vue";

const contentFields = [
  {
    name: "type",
    label: "탭을 골라주세요",
    type: "select",
    rules: [(v: string) => !!v || "필수 입력입니다."],
    items: ["NOTICE", "HOT", "NORMAL"],
  },
];
</script>

<template>
  <h3>포럼 글 작성</h3>
  <EditorComponent
    URL="/api/forum/post"
    :fields="contentFields"
    :redirectURL="'/forum'"
  />
</template>

<style scoped></style>
