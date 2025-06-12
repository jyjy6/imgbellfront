<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";

const users = ref([
  {
    id: 1,
    username: "admin",
    displayName: "관리자",
    email: "admin@imgbell.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01",
    avatar: null,
  },
  {
    id: 2,
    username: "user1",
    displayName: "사용자1",
    email: "user1@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-01-15",
    avatar: null,
  },
]);
const searchQuery = ref("");
const roleFilter = ref("");
const statusFilter = ref("");
const loading = ref(false);

const roleOptions = ["전체", "admin", "user", "moderator"];
const statusOptions = ["전체", "active", "inactive"];

const headers = [
  { title: "아바타", key: "avatar", sortable: false },
  { title: "사용자명", key: "username" },
  { title: "이름", key: "displayName" },
  { title: "이메일", key: "email" },
  { title: "역할", key: "role" },
  { title: "상태", key: "status" },
  { title: "가입일", key: "createdAt" },
  { title: "작업", key: "actions", sortable: false },
];

const fetchUsers = async () => {
  const res = await axios.get("/api/admin/users", {
    params: { search: searchQuery.value },
  });
  users.value = res.data;
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "red";
    case "moderator":
      return "orange";
    case "user":
      return "blue";
    default:
      return "grey";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ko-KR");
};

const editUser = (user: any) => {
  console.log("Edit user:", user);
  // 사용자 편집 로직
};

const deleteUser = (user: any) => {
  console.log("Delete user:", user);
  // 사용자 삭제 로직
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">사용자 관리</span>
            <v-btn color="primary" prepend-icon="mdi-account-plus">
              새 사용자 추가
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchQuery"
                  label="사용자 검색"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="roleFilter"
                  :items="roleOptions"
                  label="역할 필터"
                  variant="outlined"
                  hide-details
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  label="상태 필터"
                  variant="outlined"
                  hide-details
                ></v-select>
              </v-col>
            </v-row>

            <v-data-table
              :headers="headers"
              :items="users"
              :search="searchQuery"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.avatar="{ item }">
                <v-avatar size="40" color="primary">
                  <v-img v-if="item.avatar" :src="item.avatar"></v-img>
                  <span v-else class="text-white">{{
                    item.username.charAt(0).toUpperCase()
                  }}</span>
                </v-avatar>
              </template>

              <template v-slot:item.role="{ item }">
                <v-chip
                  :color="getRoleColor(item.role)"
                  size="small"
                  variant="flat"
                >
                  {{ item.role }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'active' ? 'success' : 'error'"
                  size="small"
                  variant="flat"
                >
                  {{ item.status === "active" ? "활성" : "비활성" }}
                </v-chip>
              </template>

              <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="editUser(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteUser(item)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
