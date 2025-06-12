<script setup lang="ts">
import { ref, computed } from "vue";
import { useLoginStore } from "../../stores/loginStore";
import type { UserInfo } from "../../types/UserInfoTypes";
import RegisterFormComponent from "../../components/RegisterFormComponent.vue";
import { onMounted } from "vue";
import { useImageStore } from "../../stores/imageStore";
import ImageListComponent from "../../components/ImageListComponent.vue";
import ImageSearchComponent from "../../components/ImageSearchComponent.vue";
import { onUnmounted } from "vue";

const loginStore = useLoginStore();

// 선택된 플랜 (monthly | yearly)
const selectedPlan = ref<"monthly" | "yearly" | null>("monthly");

const selectPlan = (plan: "monthly" | "yearly") => {
  selectedPlan.value = plan;
};

const tabs = ref([
  "프로필",
  "내 업로드 이미지",
  "내 좋아요 이미지",
  "구독 정보",
]);
const currentTab = ref("프로필");

const formattedDate = (dateString: string) => {
  if (!dateString) return "정보 없음";

  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const premiumStatus = computed(() => {
  if (!loginStore.getUser?.isPremium) return "일반 회원";

  if (loginStore.getUser?.premiumExpiryDate) {
    const expiryDate = new Date(loginStore.getUser!.premiumExpiryDate);
    const today = new Date();
    const daysLeft = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `프리미엄 회원 (만료: ${daysLeft}일 남음)`;
  }

  return "프리미엄 회원";
});

const avatarText = computed(() => {
  if (!loginStore.getUser?.name) return "?";
  return loginStore.getUser?.name.charAt(0).toUpperCase();
});

const userRole = computed(() => {
  const roles = loginStore.getUser?.roleSet || [];
  if (roles.includes("ROLE_SUPERADMIN")) return "최고 관리자";
  if (roles.includes("ROLE_ADMIN")) return "관리자";
  if (roles.includes("ROLE_USER")) return "일반 회원";
  return "일반 회원";
});

// 프로필 수정 모드
const editMode = ref(false);
const userForm = ref<Partial<UserInfo>>();

const startEdit = () => {
  userForm.value = { ...loginStore.getUser! };
  editMode.value = true;
};

const cancelEdit = () => {
  editMode.value = false;
};

const imageStore = useImageStore();
onMounted(() => {
  imageStore.myImageList = true;
  imageStore.loadImages();
});
onUnmounted(() => {
  imageStore.resetAll();
});

const loadLikeImage = async () => {
  imageStore.likeImageList = true;
  imageStore.myImageList = false;
  imageStore.loadImages();

  console.log(imageStore.images);
};
</script>

<template>
  <v-container class="my-8">
    <v-row>
      <v-col cols="12">
        <v-card class="mx-auto" max-width="1200">
          <v-card-title class="text-h4 d-flex align-center">
            <span>마이페이지</span>
            <v-spacer></v-spacer>
            <v-chip
              :color="loginStore.getUser?.isPremium ? 'purple' : 'grey'"
              :text="premiumStatus"
              class="ml-2"
            ></v-chip>
          </v-card-title>

          <v-divider></v-divider>

          <v-tabs v-model="currentTab" bg-color="primary" centered grow>
            <v-tab
              v-for="tab in tabs"
              :key="tab"
              :value="tab"
              class="text-subtitle-1"
              @click="
                tab === '내 좋아요 이미지'
                  ? loadLikeImage()
                  : ((imageStore.myImageList = true),
                    (imageStore.likeImageList = false));
                imageStore.loadImages();
              "
            >
              {{ tab }}
            </v-tab>
          </v-tabs>

          <v-window v-model="currentTab">
            <!-- 프로필 탭 -->
            <v-window-item value="프로필">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4" class="text-center">
                    <v-avatar color="primary" size="128" class="mb-4">
                      <v-img
                        v-if="loginStore.getUser?.profileImage"
                        :src="loginStore.getUser?.profileImage"
                        alt="프로필 이미지"
                      ></v-img>
                      <span v-else class="text-h3 text-white">{{
                        avatarText
                      }}</span>
                    </v-avatar>

                    <div class="text-h5 mb-2">
                      {{
                        loginStore.getUser?.displayName ||
                        loginStore.getUser?.name
                      }}
                    </div>
                    <div class="text-subtitle-1 text-medium-emphasis mb-4">
                      {{ loginStore.getUser?.email }}
                    </div>
                    <v-chip
                      :color="
                        loginStore.getUser?.isSuperAdmin ? 'error' : 'primary'
                      "
                      class="mb-2"
                    >
                      {{ userRole }}
                    </v-chip>

                    <div class="mt-6">
                      <v-btn
                        v-if="!editMode"
                        color="primary"
                        variant="outlined"
                        @click="startEdit"
                      >
                        프로필 수정
                      </v-btn>
                    </div>
                  </v-col>

                  <v-divider vertical></v-divider>

                  <v-col cols="12" md="7">
                    <v-card variant="flat" v-if="!editMode">
                      <v-list lines="two">
                        <v-list-item>
                          <v-list-item-title>사용자 ID</v-list-item-title>
                          <v-list-item-subtitle>{{
                            loginStore.getUser?.username
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>이름</v-list-item-title>
                          <v-list-item-subtitle>{{
                            loginStore.getUser?.name || "정보 없음"
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>전화번호</v-list-item-title>
                          <v-list-item-subtitle>{{
                            loginStore.getUser?.phone || "정보 없음"
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>성별</v-list-item-title>
                          <v-list-item-subtitle>{{
                            loginStore.getUser?.sex || "정보 없음"
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>나이</v-list-item-title>
                          <v-list-item-subtitle>{{
                            loginStore.getUser?.age || "정보 없음"
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>국가</v-list-item-title>
                          <v-list-item-subtitle>{{
                            loginStore.getUser?.country || "정보 없음"
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>주소</v-list-item-title>
                          <v-list-item-subtitle>
                            {{
                              loginStore.getUser?.mainAddress
                                ? `${loginStore.getUser?.mainAddress} ${
                                    loginStore.getUser?.subAddress || ""
                                  }`
                                : "정보 없음"
                            }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>가입일</v-list-item-title>
                          <v-list-item-subtitle>{{
                            formattedDate(loginStore.getUser!.createdAt)
                          }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title>마지막 로그인</v-list-item-title>
                          <v-list-item-subtitle>{{
                            formattedDate(loginStore.getUser?.lastLogin || "")
                          }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>

                    <!-- 프로필 수정폼 -->
                    <v-row v-show="editMode">
                      <RegisterFormComponent
                        :fields="{
                          ...loginStore.user,
                          password: '', // 필수 필드 추가
                        }"
                        :formData="{
                          username : loginStore.user!.username,
                          displayName: loginStore.user!.displayName,
                          name: loginStore.user!.name,
                          email: loginStore.user!.email,
                          phone: loginStore.user!.phone,
                          profileImage: loginStore.user!.profileImage,
                          country: loginStore.user!.country,
                          mainAddress: loginStore.user!.mainAddress,
                          subAddress: loginStore.user!.subAddress,
                          sex: loginStore.user!.sex,
                          age: loginStore.user!.age,
                          password: '',
                        }"
                        :isPut="true"
                        apiURL="/api/members/modify"
                      />
                      <v-btn
                        color="error"
                        variant="text"
                        class="mr-2"
                        @click="cancelEdit"
                      >
                        취소
                      </v-btn>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>

            <!-- 계정 설정 탭 -->
            <v-window-item value="내 업로드 이미지">
              <ImageSearchComponent />
              <ImageListComponent />
            </v-window-item>

            <!-- 내 좋아요 이미지 탭 -->
            <v-window-item value="내 좋아요 이미지">
              <ImageSearchComponent />
              <ImageListComponent />
            </v-window-item>

            <!-- 구독 정보 탭 -->
            <v-window-item value="구독 정보">
              <v-card-text>
                <v-row justify="center" class="my-4">
                  <v-col cols="12" md="8">
                    <v-card
                      :color="
                        loginStore.getUser?.isPremium
                          ? 'purple-lighten-5'
                          : 'grey-lighten-4'
                      "
                      class="mb-6"
                    >
                      <v-card-item>
                        <v-card-title class="text-h5">
                          <v-icon
                            :icon="
                              loginStore.getUser?.isPremium
                                ? 'mdi-crown'
                                : 'mdi-account'
                            "
                            class="mr-2"
                            :color="
                              loginStore.getUser?.isPremium ? 'purple' : 'grey'
                            "
                          ></v-icon>
                          {{
                            loginStore.getUser?.isPremium
                              ? "프리미엄 회원"
                              : "일반 회원"
                          }}
                        </v-card-title>

                        <v-card-subtitle
                          v-if="
                            loginStore.getUser?.isPremium &&
                            loginStore.getUser?.premiumExpiryDate
                          "
                        >
                          만료일:
                          {{
                            formattedDate(loginStore.getUser?.premiumExpiryDate)
                          }}
                        </v-card-subtitle>
                      </v-card-item>

                      <v-card-text>
                        <div v-if="loginStore.getUser?.isPremium">
                          <p class="text-body-1">
                            프리미엄 멤버십 혜택을 모두 이용할 수 있습니다.
                          </p>
                        </div>
                        <div v-else>
                          <p class="text-body-1">
                            프리미엄으로 업그레이드하여 더 많은 기능을
                            이용해보세요.
                          </p>
                        </div>
                      </v-card-text>

                      <v-card-actions>
                        <v-btn
                          v-if="!loginStore.getUser?.isPremium"
                          color="warning"
                          variant="flat"
                          block
                        >
                          프리미엄으로 업그레이드
                        </v-btn>
                        <v-btn v-else color="primary" variant="outlined" block>
                          멤버십 갱신하기
                        </v-btn>
                      </v-card-actions>
                    </v-card>

                    <v-card v-if="loginStore.getUser?.isPremium" class="mt-4">
                      <v-card-title class="text-h6">결제 내역</v-card-title>
                      <v-card-text>
                        <v-table>
                          <thead>
                            <tr>
                              <th>날짜</th>
                              <th>상품</th>
                              <th>금액</th>
                              <th>상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                {{ formattedDate(new Date().toISOString()) }}
                              </td>
                              <td>프리미엄 멤버십 (연간)</td>
                              <td>99,000원</td>
                              <td>
                                <v-chip color="success" size="small"
                                  >완료</v-chip
                                >
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-card-text>
                    </v-card>

                    <v-card v-else class="mt-4">
                      <v-card-title class="text-h6">멤버십 플랜</v-card-title>
                      <v-card-text>
                        <v-row>
                          <!-- 월간 플랜 -->
                          <v-col cols="12" md="6">
                            <v-card
                              variant="outlined"
                              :color="
                                selectedPlan === 'monthly'
                                  ? 'blue'
                                  : 'blue-lighten-5'
                              "
                              @click="selectPlan('monthly')"
                              class="cursor-pointer"
                            >
                              <v-card-title>월간 플랜</v-card-title>
                              <v-card-text>
                                <div class="text-h5 mb-2">9,900원/월</div>
                                <v-ul>
                                  <v-li>모든 프리미엄 기능 이용</v-li>
                                  <v-li>언제든지 취소 가능</v-li>
                                </v-ul>
                              </v-card-text>
                              <v-card-actions>
                                <v-btn color="primary" variant="flat" block>
                                  선택하기
                                </v-btn>
                              </v-card-actions>
                            </v-card>
                          </v-col>

                          <!-- 연간 플랜 -->
                          <v-col cols="12" md="6">
                            <v-card
                              variant="outlined"
                              :color="
                                selectedPlan === 'yearly'
                                  ? 'purple'
                                  : 'purple-lighten-5'
                              "
                              @click="selectPlan('yearly')"
                              class="cursor-pointer"
                            >
                              <v-card-title>
                                연간 플랜
                                <v-chip
                                  color="success"
                                  size="small"
                                  class="ml-2"
                                  >20% 할인</v-chip
                                >
                              </v-card-title>
                              <v-card-text>
                                <div class="text-h5 mb-2">95,000원/년</div>
                                <v-ul>
                                  <v-li>모든 프리미엄 기능 이용</v-li>
                                  <v-li>2개월 무료 혜택</v-li>
                                </v-ul>
                              </v-card-text>
                              <v-card-actions>
                                <v-btn color="purple" variant="flat" block>
                                  선택하기
                                </v-btn>
                              </v-card-actions>
                            </v-card>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-list-item-subtitle {
  white-space: normal;
  overflow: visible;
}
</style>
