import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import type { UserInfo } from "../types/UserInfoTypes";

export const useLoginStore = defineStore("login", () => {
  const isLogin = ref(false);
  const user = ref<UserInfo | null>();
  const router = useRouter();
  const storedToken = localStorage.getItem("accessToken");

  // ✅ 앱이 실행될 때 로컬 스토리지에서 유저 정보 불러오기
  const loadUserFromLocalStorage = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedToken) {
      try {
        // 토큰 만료 체크도 여기에 가능
        // const decodedToken: any = jwtDecode(storedToken);
        user.value = JSON.parse(storedUser);
        isLogin.value = true;
      } catch (e) {
        console.error("토큰 디코딩 실패", e);
        logout();
      }
    }
  };
  loadUserFromLocalStorage();

  const login = async (
    username: string,
    password: string
  ): Promise<boolean | undefined> => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/login/jwt`,
        { username, password }
      );
      const accessToken = response.data.accessToken;

      localStorage.setItem("accessToken", accessToken);

      // ✅ 별도 API로 유저 정보 가져오기 login
      const userResponse = await axios.get("/api/members/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      user.value = userResponse.data;

      localStorage.setItem("user", JSON.stringify(user.value));
      isLogin.value = true;

      alert("로그인 성공!");
      router.go(-1);

      return;
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("로그인 중 오류가 발생했습니다.");
      }
    }
  };

  const logout = async () => {
    try {
      // 1. 쿠키 삭제 (HTTP Only 쿠키는 서버 도움 필요->refreshToken은 서버에서 처리하나, 여기선 학습용으로 명시적으로써놓음)
      document.cookie =
        "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // 2. 로컬 스토리지 정리
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      // 3. 상태 업데이트
      user.value = null;
      isLogin.value = false;

      // 4. 서버에 로그아웃 알림 (HTTP Only 쿠키(refreshToken) 삭제를 위해)
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/logout`, {});

      // 5. 로그인 페이지로 리다이렉트
      router.push("/login");

      return true;
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
      return false;
    }
  };

  // ✅ 컴포넌트에서 `user?.username` 이런 방식으로 쉽게 접근 가능하도록 Getter 제공
  const isAuthenticated = computed(() => isLogin.value);
  const getUser = computed(() => user.value);

  return {
    isLogin,
    user,
    isAuthenticated,
    getUser,
    login,
    logout,
    loadUserFromLocalStorage,
  };
});
