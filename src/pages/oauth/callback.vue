<template>
  <div class="callback-container">
    <div v-if="isLoading" class="loading">
      <span>인증 처리 중...</span>
    </div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useLoginStore } from "../../stores/loginStore";
import axios from "axios";

const router = useRouter();
const isLoading = ref(true);
const error = ref(null);
const loginStore = useLoginStore();

onMounted(async () => {
  try {
    isLoading.value = true;

    // URL에서 액세스 토큰 파라미터 추출
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("accessToken");

    // 액세스 토큰이 있으면 로컬 스토리지에 저장
    if (accessToken) {
      const userResponse = await axios.get("/api/members/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      loginStore.user = userResponse.data;

      localStorage.setItem("user", JSON.stringify(loginStore.user));
      localStorage.setItem("accessToken", accessToken);
      console.log("액세스 토큰이 저장되었습니다.");
      loginStore.isLogin = true;

      // URL에서 토큰 파라미터 제거 (보안을 위해)
      const cleanUrl = window.location.pathname;
      history.replaceState(null, "", cleanUrl);
      alert("로그인완료");
      router.push("/");
    }
  } catch (error) {
    console.error("로그인 처리 오류:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loading,
.error {
  padding: 20px;
  text-align: center;
}

.error {
  color: red;
}
</style>
