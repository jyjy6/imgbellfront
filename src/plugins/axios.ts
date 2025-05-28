import axios from "axios";
import { useLoginStore } from "../stores/loginStore";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";
const withCredentials = true;

// 📌 인터셉터 등록 여부 체크

const accessToken = localStorage.getItem("accessToken");
const loginCheck = localStorage.getItem("user");

// 액세스토큰 갱신 함수
const refreshAccessToken = async () => {
  console.log("refreshAccessToken: Function invoked");
  try {
    // 서버에 요청하여 새로운 액세스 토큰 발급
    const response = await axios.get(`${baseURL}/api/refresh-token`, {
      withCredentials: true,
    });

    const { accessToken } = response.data;
    console.log("새로운 액세스 토큰:", accessToken);

    // 로컬스토리지에 액세스 토큰 저장
    localStorage.setItem("accessToken", accessToken);
    console.log("Access token saved to localStorage");

    return accessToken;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
// 토큰 갱신 상태 관리
let isRefreshing = false;
let failedRequests: Array<{ resolve: Function; reject: Function }> = [];

// 회원일경우에만 인터셉터 발동
if (loginCheck) {
  axios.interceptors.request.use(
    async (config) => {
      const ignoreInterceptor = ["/api/logout"];
      if (ignoreInterceptor.some((url) => config.url?.includes(url))) {
        return config;
      }

      if (!accessToken) {
        // 토큰이 없으면 요청을 중단하고 로그아웃 처리
        if (!isRefreshing) {
          isRefreshing = true;
          const loginStore = useLoginStore();
          loginStore.logout();
          alert("토큰이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
          return Promise.reject(new Error("로그인하셈"));
        }
      }

      console.log("Axios Request Interceptor - Start");
      const currentAccessToken = localStorage.getItem("accessToken");
      if (currentAccessToken) {
        config.headers["Authorization"] = `Bearer ${currentAccessToken}`;
      }
      console.log(
        "Authorization Header Added:",
        config.headers["Authorization"]
      );
      return config;
    },
    (error) => {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 로그인 요청은 무시
      if (originalRequest.url?.includes("/api/login/jwt")) {
        return Promise.reject(error);
      }

      // 토큰 갱신 요청에서 401 에러가 발생했다면 바로 로그아웃
      if (
        originalRequest.url?.includes("/api/refresh-token") &&
        error.response?.status === 401
      ) {
        console.log("Refresh token expired, logging out");
        if (!isRefreshing) {
          isRefreshing = true;
          const loginStore = useLoginStore();
          loginStore.logout();
          alert("토큰이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // 401 Unauthorized 응답 처리 (토큰 만료 시)
      if (error.response?.status === 401 && !originalRequest._retry) {
        // 이미 토큰 갱신 중이면 큐에 추가하고 대기
        if (isRefreshing) {
          console.log("Adding request to queue while refreshing");
          return new Promise((resolve, reject) => {
            failedRequests.push({
              resolve: (newToken: string) => {
                console.log("Retrying queued request with new token");
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                resolve(axios(originalRequest));
              },
              reject: (err: any) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        console.log("Starting token refresh for request:", originalRequest.url);

        try {
          const newAccessToken = await refreshAccessToken();
          console.log("Token refresh successful, processing queue");

          // 대기 중인 요청들을 새 토큰으로 재시도
          const retryPromises = failedRequests.map(({ resolve }) => {
            console.log("Processing queued request");
            resolve(newAccessToken);
          });

          failedRequests = [];
          isRefreshing = false;

          // 현재 요청도 새 토큰으로 재시도
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          console.log("Retrying original request with new token");
          return axios(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          isRefreshing = false;

          // 대기 중인 요청들 모두 실패 처리
          failedRequests.forEach(({ reject }) => {
            reject(refreshError);
          });
          failedRequests = [];

          // 로그아웃 처리
          const loginStore = useLoginStore();
          loginStore.logout();
          alert("토큰이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = withCredentials;

export default {
  install: (app: any) => {
    app.config.globalProperties.$axios = axios;
  },
};
