<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";

const users = ref([]);
const search = ref("");

const fetchUsers = async () => {
  const res = await axios.get("/api/admin/users", {
    params: { search: search.value },
  });
  users.value = res.data;
};

onMounted(fetchUsers);
</script>

<template>
  <v-container>
    <v-text-field
      v-model="search"
      label="회원 검색"
      @keyup.enter="fetchUsers"
    />
    <v-data-table
      :items="users"
      :headers="[
        { title: 'ID', key: 'id' },
        { title: '닉네임', key: 'displayName' },
        { title: '이메일', key: 'email' },
        { title: '권한', key: 'roles' },
        { title: '가입일', key: 'createdAt' },
        { title: '관리', key: 'actions', sortable: false },
      ]"
      hide-default-footer
    >
      <template
        #item.actions="{
          /* item */
        }"
      >
        <v-btn size="small" @click="">상세</v-btn>
        <v-btn size="small" color="error" @click="">삭제</v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>
