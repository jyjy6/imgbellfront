<!-- pages/forum.vue -->
<template>
  <v-container>
    <!-- 네비게이션 바 (선택사항) -->
    <!-- <v-app-bar v-if="showNavigation" color="primary" dark>
      <v-btn v-if="route.name !== 'Forum'" icon @click="goToList">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title>
        {{ pageTitle }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn v-if="route.name === 'Forum'" icon @click="goToWrite">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-app-bar> -->

    <!-- 자식 컴포넌트가 렌더링되는 부분 -->
    <router-view />
  </v-container>
</template>

<script setup lang="ts">
// import { computed } from "vue";
// import { useRoute, useRouter } from "vue-router";

// const route = useRoute();
// const router = useRouter();

// // 현재 라우트에 따른 페이지 제목
// const pageTitle = computed(() => {
//   switch (route.name) {
//     case "ForumList":
//       return "자유게시판";
//     case "PostDetail":
//       return "게시글 보기";
//     case "PostWrite":
//       return "글쓰기";
//     default:
//       return "게시판";
//   }
// });

// // 네비게이션 바 표시 여부 (선택사항)
// const showNavigation = computed(() => {
//   // 모바일에서만 표시하거나, 필요에 따라 조건 설정
//   return true;
// });

// // 네비게이션 메서드
// const goToList = () => {
//   router.push({ name: "BoardList" });
// };

// const goToWrite = () => {
//   router.push({ name: "PostWrite" });
// };
</script>

<style scoped>
/* 필요한 스타일 추가 */
</style>
