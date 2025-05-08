<script setup lang="ts">
const clickHandler = () => {
  console.log("Button clicked!");
};
</script>

<template>
  <v-container>
    <v-btn color="primary" :to="'/counter'">ㅇㄻㅇㄴㄹ</v-btn>
    <v-btn color="red" @click="clickHandler">Click Me</v-btn>
  </v-container>
</template>

<style scoped></style>
