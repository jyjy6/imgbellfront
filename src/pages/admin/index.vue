<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import type { ImageDetailDto } from "../../types/ImageTypes";
import type { UserInfo } from "../../types/UserInfoTypes";
import type { Forum } from "../../types/ForumTypes";
import { useImageStore } from "../../stores/imageStore";
import ImageDetailComponent from "../../components/ImageDetailComponent.vue";
import { useRoute } from "vue-router";

const stats = ref({
  userCount: 0,
  imageCount: 0,
  todayVisit: 0,
  reportCount: 0,
});

const recentUsers = ref<Partial<UserInfo>[]>([]);
const recentImages = ref<Partial<ImageDetailDto>[]>([]);
const recentPosts = ref<Partial<Forum>[]>([]);

const route = useRoute();

const adminMenuItems = ref([
  { title: "대시보드", icon: "mdi-view-dashboard", path: "/admin" },
  {
    title: "사용자 관리",
    icon: "mdi-account-group",
    path: "/admin/memberlist",
  },
  // { title: "사용자 관리", icon: "mdi-account-group", path: "/admin/users" },
  { title: "이미지 관리", icon: "mdi-image-multiple", path: "/admin/images" },
  { title: "테스트", icon: "mdi-test-tube", path: "/admin/test" },
  { title: "레디스", icon: "mdi-database", path: "/redis" },
  { title: "이미지 검색", icon: "mdi-image-search", path: "/image/test" },
]);

onMounted(async () => {
  // 실제 API로 교체
  const res = await axios.get("/api/admin/dashboard");
  stats.value = res.data.stats;
  recentUsers.value = res.data.recentUsers;
  recentImages.value = res.data.recentImages;
  recentPosts.value = res.data.recentPosts;
});

const imageStore = useImageStore();
</script>

<template>
  <v-container fluid>
    <!-- 관리자 네비게이션 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="pa-2">
          <v-card-title class="text-h5 pb-2">관리자 패널</v-card-title>
          <v-btn-toggle
            variant="outlined"
            color="primary"
            multiple
            class="d-flex flex-wrap ga-2"
          >
            <v-btn
              v-for="item in adminMenuItems"
              :key="item.path"
              :to="item.path"
              :color="route.path === item.path ? 'primary' : 'default'"
              :variant="route.path === item.path ? 'flat' : 'outlined'"
              :prepend-icon="item.icon"
              class="mb-2"
            >
              {{ item.title }}
            </v-btn>
          </v-btn-toggle>
        </v-card>
      </v-col>
    </v-row>

    <!-- 대시보드 컨텐츠 (메인 /admin 경로에서만 표시) -->
    <div v-if="route.path === '/admin'">
      <v-row>
        <v-col cols="12" md="3">
          <v-card color="primary" class="pa-4" dark>
            <div>전체 회원</div>
            <div class="text-h4">{{ stats.userCount }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="success" class="pa-4" dark>
            <div>전체 이미지</div>
            <div class="text-h4">{{ stats.imageCount }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="info" class="pa-4" dark>
            <div>오늘 방문자</div>
            <div class="text-h4">{{ stats.todayVisit }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="error" class="pa-4" dark>
            <div>신고/문의</div>
            <div class="text-h4">{{ stats.reportCount }}</div>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>최근 가입 회원</v-card-title>
            <v-list>
              <v-list-item v-for="user in recentUsers" :key="user.id">
                <v-list-item-title>{{ user.username }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  user.displayName
                }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>최근 업로드 이미지</v-card-title>
            <v-list>
              <v-list-item
                v-for="img in recentImages"
                :key="img.id"
                @click="imageStore.viewImageDetail(Number(img.id))"
              >
                <v-list-item-title>{{ img.imageName }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  img.uploaderName
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
          <ImageDetailComponent />
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>최근 포럼 글</v-card-title>
            <v-list>
              <RouterLink
                v-for="post in recentPosts"
                :key="post.id"
                :to="`/forum/${post.id}`"
              >
                <v-list-item>
                  <v-list-item-title>{{ post.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{
                    post.authorDisplayName
                  }}</v-list-item-subtitle>
                </v-list-item>
              </RouterLink>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 하위 라우트 컨텐츠 -->
    <router-view />
  </v-container>
</template>
