<script setup lang="ts">
import axios from "axios";

import { ref, computed } from "vue";

const allMembers = ref<UserInfo[]>([]);
const loading = ref(true);
const search = ref("");

const selectedMembers = ref([]);
const headers = [
  { title: "프로필", key: "profileImage", sortable: false },
  { title: "닉네임", key: "name", sortable: true },
  { title: "아이디", key: "username", sortable: true },
  { title: "이메일", key: "email", sortable: true },
  { title: "역할", key: "role", sortable: true },
  { title: "최근 로그인", key: "lastLogin", sortable: true },
  { title: "프리미엄", key: "isPremium", sortable: true },
  { title: "관리", key: "actions", sortable: false },
];

const editDialog = ref(false);
const deleteDialog = ref(false);
const currentMember = ref<UserInfo | null>(null);

const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: "name", order: "asc" as "asc" | "desc" }],
});

//반환된 총 회원 숫자
const totalItems = ref(0);
onMounted(async () => {
  try {
    const response = await axios.get("/api/admin/members");
    allMembers.value = response.data.data;
    totalItems.value = response.data.total;
  } catch (error) {
    console.error("멤버 목록을 불러오는 중 오류가 발생했습니다:", error);
  } finally {
    loading.value = false;
  }
});
const router = useRouter();
const route = useRoute();

const currentPage = ref(Number(route.query.page) || 1);
// 페이지 변경 시 URL 쿼리 업데이트
const onPageChange = (page: any) => {
  router.push({ query: { ...route.query, page } });
};

// URL 쿼리가 변경되면 currentPage 업데이트
watch(
  () => route.query.page,
  (newPage) => {
    currentPage.value = Number(newPage) || 1;
    // 데이터 재요청 등 추가 로직
  }
);

// options 변경 시 서버에서 데이터 가져오기
const queryParams = computed(() => ({
  page: route.query.page,
  itemsPerPage: route.query.itemsPerPage, //이부분은 지워도됨 기본적으로 10개로 나오는거라
  search: search.value, // search도 반응형 상태여야 합니다.
  sortBy: options.value.sortBy[0]?.key,
  sortOrder: options.value.sortBy[0]?.order,
}));

import type { UserInfo } from "../../types/UserInfoTypes";
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { watch } from "vue";
import { useTimeoutFn } from "@vueuse/core";

// 타임아웃 함수 초기화
const { start: startFetch, stop: stopFetch } = useTimeoutFn(async () => {
  loading.value = true;
  try {
    const response = await axios.get("/api/admin/members", {
      params: {
        page: queryParams.value.page,
        itemsPerPage: queryParams.value.itemsPerPage,
        sortBy: queryParams.value.sortBy,
        sortOrder: queryParams.value.sortOrder,
        search: queryParams.value.search,
      },
    });
    allMembers.value = response.data.data;
    totalItems.value = response.data.total;
  } catch (error) {
    console.error("멤버 목록을 불러오는 중 오류가 발생했습니다:", error);
  } finally {
    loading.value = false;
  }
}, 500); // 500ms(0.5초) 대기

// queryParams 변경 감시
watch(
  queryParams,
  () => {
    stopFetch(); // 이전 타임아웃 취소
    startFetch(); // 새로운 타임아웃 시작
  },
  { deep: true, immediate: true }
);

// 검색어 변경 시에도 데이터 다시 불러오기
watch(
  search,
  () => {
    options.value.page = 1; // 검색 시 첫 페이지로 리셋
  },
  { deep: true }
);

const totalPages = computed(() => {
  const perPage = Number(route.query.itemsPerPage) || 10;
  return Math.ceil(Number(totalItems.value) / perPage);
});

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const editMember = (member: UserInfo) => {
  currentMember.value = { ...member };
  editDialog.value = true;
};

const confirmDelete = (member: UserInfo) => {
  currentMember.value = member;
  deleteDialog.value = true;
};

const deleteMember = async () => {
  alert("삭제는 할수없습니다");
};

const saveMember = async () => {
  try {
    const response = await axios.put(
      `/api/admin/members/userupdate`,
      currentMember.value
    );
    console.log("ㅇㅇ잘바뀌었음");
    console.log(response.data.message);
    const index = allMembers.value.findIndex(
      (m) => m.id === currentMember.value?.id
    );
    if (index !== -1) {
      allMembers.value[index] = response.data.user;
    }
    alert("회원정보가 수정되었습니다.");
    editDialog.value = false;
  } catch (error) {
    console.error("멤버 정보 수정 중 오류가 발생했습니다:", error);
  }
};

onMounted(() => {
  const script = document.createElement("script");
  script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  script.onload = () => console.log("카카오 주소 API 로드 완료");
  document.head.appendChild(script);
});
const openKakaoAddressSearch = () => {
  //@ts-ignore
  new window.daum.Postcode({
    oncomplete: (data: { roadAddress: string }) => {
      if (currentMember.value) {
        currentMember.value.mainAddress = data.roadAddress;
      }
    },
  }).open();
};
</script>

<template>
  <v-container>
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon size="large" color="primary" class="me-3"
          >mdi-account-group</v-icon
        >
        <span class="text-h4 font-weight-bold">멤버 목록 & 관리</span>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="검색"
          hide-details
          density="compact"
          variant="outlined"
          class="max-width-300"
          bg-color="grey-lighten-4"
        ></v-text-field>
      </v-card-title>

      <v-divider></v-divider>

      <v-data-table
        v-model="selectedMembers"
        :headers="headers"
        :items="allMembers"
        :loading="loading"
        :items-per-page="options.itemsPerPage"
        :page="options.page"
        :sort-by="options.sortBy"
        item-value="_id"
        class="elevation-0"
        @update:options="options = $event"
        show-select
      >
        <template #[`item.profileImage`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar
              size="40"
              color="primary"
              class="mr-3"
              v-if="!item.profileImage"
            >
              <span class="text-white text-h6">{{ item.name.charAt(0) }}</span>
            </v-avatar>
            <v-avatar size="40" class="mr-3" v-else>
              <v-img :src="item.profileImage" :alt="item.name"></v-img>
            </v-avatar>
          </div>
        </template>

        <template #[`item.lastLogin`]="{ item }">
          <div>{{ formatDate(item.lastLogin || "") }}</div>
        </template>

        <template #[`item.isPremium`]="{ item }">
          <v-chip
            :color="item.isPremium ? 'success' : 'grey'"
            :text="item.isPremium ? '프리미엄' : '일반'"
            size="small"
            variant="elevated"
          ></v-chip>
          <div v-if="item.isPremium" class="text-caption mt-1">
            {{ formatDate(item.premiumExpiryDate || "") }}
          </div>
        </template>

        <template #[`item.role`]="{ item }">
          <v-chip
            :color="
              item.roleSet.includes('ROLE_ADMIN')
                ? 'error'
                : item.roleSet.includes('ROLE_PREMIUM')
                ? 'warning'
                : 'info'
            "
            size="small"
            variant="elevated"
          >
            {{ item.roleSet.join(", ") }}
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex">
            <v-tooltip location="top" text="수정">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                  density="comfortable"
                  color="primary"
                  @click="editMember(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip location="top" text="삭제">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                  density="comfortable"
                  color="error"
                  @click="confirmDelete(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #bottom>
          <div class="d-flex flex-column">
            <div class="d-flex align-center pa-4">
              <v-btn
                color="error"
                variant="outlined"
                :disabled="selectedMembers.length === 0"
                class="me-4"
              >
                선택 삭제 ({{ selectedMembers.length }})
              </v-btn>

              <v-btn color="success" variant="elevated" prepend-icon="mdi-plus">
                새 멤버 추가
              </v-btn>

              <v-spacer></v-spacer>

              <div class="text-caption text-grey">
                총 {{ allMembers.length }}명의 멤버
              </div>
            </div>

            <!-- 페이지네이션 컨트롤 추가 -->
            <div class="d-flex justify-center py-2">
              <v-pagination
                v-if="totalPages > 0"
                v-model="currentPage"
                :length="totalPages"
                :total-visible="totalPages"
                @update:modelValue="onPageChange"
              ></v-pagination>
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 멤버 수정 다이얼로그 -->
    <v-dialog v-model="editDialog" max-width="700px">
      <v-card>
        <v-card-title class="bg-primary text-white pa-4">
          <v-icon class="mr-2">mdi-account-edit</v-icon>
          멤버 정보 수정
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form v-if="currentMember">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="currentMember.name"
                  label="닉네임"
                  variant="outlined"
                  density="comfortable"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="currentMember.username"
                  label="아이디"
                  variant="outlined"
                  density="comfortable"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="currentMember.email"
                  label="이메일"
                  variant="outlined"
                  density="comfortable"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="currentMember.roleSet"
                  label="역할"
                  :items="['ROLE_USER', 'ROLE_PREMIUM', 'ROLE_ADMIN']"
                  variant="outlined"
                  density="comfortable"
                  multiple
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="currentMember.phone"
                  label="전화번호"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="currentMember.premiumExpiryDate"
                  label="프리미엄 만료일"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-avatar size="150" style="margin: 15px">
                  <img
                    :src="currentMember.profileImage"
                    alt="프로필 이미지"
                    style="object-fit: contain; width: 100%; height: 100%"
                  />
                </v-avatar>
                <v-text-field
                  v-model="currentMember.profileImage"
                  label="프로필 이미지 URL"
                  variant="outlined"
                  density="comfortable"
                  readonly
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel title="주소 정보">
                    <template #text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="currentMember.country"
                            label="국가"
                            :items="[
                              '대한민국',
                              '미국',
                              '일본',
                              '중국',
                              '기타',
                            ]"
                            variant="outlined"
                            density="comfortable"
                          ></v-select>
                        </v-col>

                        <v-col cols="12">
                          <v-text-field
                            v-model="currentMember.mainAddress"
                            label="기본 주소"
                            variant="outlined"
                            density="comfortable"
                            readonly
                            @click="openKakaoAddressSearch"
                          ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                          <v-text-field
                            v-model="currentMember.subAddress"
                            label="상세 주소"
                            variant="outlined"
                            density="comfortable"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </template>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="editDialog = false"
            >취소</v-btn
          >
          <v-btn color="primary" variant="elevated" @click="saveMember"
            >저장</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 멤버 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>
          멤버 삭제
        </v-card-title>

        <v-card-text class="pa-4 mt-4">
          <p class="text-body-1">
            <strong>{{ currentMember?.name }}</strong> ({{ currentMember?.id }})
            멤버를 정말로 삭제하시겠습니까?
          </p>
          <p class="text-caption text-grey mt-2">
            이 작업은 되돌릴 수 없으며 모든 관련 데이터가 삭제됩니다.
          </p>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false"
            >취소</v-btn
          >
          <v-btn color="error" variant="elevated" @click="deleteMember"
            >삭제</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
</style>
