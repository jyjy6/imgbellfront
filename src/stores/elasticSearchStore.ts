import type { ElasticImageDto } from "@/types/ImageTypes";
import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";

// 페이지네이션을 포함한 응답 타입 정의
interface PagedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const useElasticSearchStore = defineStore("elasticSearch", () => {
  // 상태 정의

  // 반응형 데이터
  const syncStatus = ref<any>(null);
  const searchKeyword = ref("");
  const selectedGrade = ref("");
  const publicOnly = ref(true);
  const searchResults = ref<ElasticImageDto[]>([]);
  const autocompleteQuery = ref("");
  const autocompleteSuggestions = ref<string[]>([]);

  // 페이지네이션 상태
  const page = ref(0); // Spring에서는 0부터 시작
  const size = ref(20);
  const totalPages = ref(0);
  const totalElements = ref(0);

  // 로딩 상태
  const statusLoading = ref(false);
  const syncLoading = ref(false);
  const searchLoading = ref(false);
  const popularLoading = ref(false);
  const recentLoading = ref(false);

  // 옵션 데이터
  const gradeOptions = [
    { title: "일반", value: "GENERAL" },
    { title: "성인", value: "ADULT" },
    { title: "극한", value: "EXTREME" },
  ];

  // 스낵바
  const snackbar = ref({
    show: false,
    message: "",
    color: "success",
  });

  // 메소드
  const showSnackbar = (message: string, color: string = "success") => {
    snackbar.value = { show: true, message, color };
  };

  // 페이지네이션 응답 처리 함수
  const handlePagedResponse = (response: PagedResponse<ElasticImageDto>) => {
    searchResults.value = response.content;
    page.value = response.number;
    size.value = response.size;
    totalPages.value = response.totalPages;
    totalElements.value = response.totalElements;
  };

  // 페이지 변경
  const changePage = (newPage: number) => {
    page.value = newPage;
  };

  // 페이지 크기 변경
  const changeSize = (newSize: number) => {
    size.value = newSize;
    page.value = 0; // 페이지 크기가 변경되면 첫 페이지로
  };

  const checkSyncStatus = async () => {
    statusLoading.value = true;
    try {
      const response = await axios.get("/api/image/sync/status");
      syncStatus.value = response.data;
      showSnackbar("동기화 상태를 확인했습니다.");
    } catch (error) {
      console.error("동기화 상태 확인 실패:", error);
      showSnackbar("동기화 상태 확인에 실패했습니다.", "error");
    } finally {
      statusLoading.value = false;
    }
  };

  const syncAllImages = async () => {
    syncLoading.value = true;
    try {
      await axios.post("/api/image/sync/all");
      showSnackbar("전체 이미지 동기화가 완료되었습니다.");
      checkSyncStatus(); // 상태 업데이트
    } catch (error) {
      console.error("전체 동기화 실패:", error);
      showSnackbar("전체 동기화에 실패했습니다.", "error");
    } finally {
      syncLoading.value = false;
    }
  };

  const smartSearch = async () => {
    if (!searchKeyword.value.trim()) {
      showSnackbar("검색 키워드를 입력해주세요.", "warning");
      getPopularImages();
      return;
    }

    searchLoading.value = true;
    try {
      const params: any = {
        keyword: searchKeyword.value,
        page: page.value,
        size: size.value,
      };

      if (selectedGrade.value) {
        params.imageGrade = selectedGrade.value;
      }

      if (publicOnly.value) {
        params.isPublic = true;
      }

      const response = await axios.get("/api/image/search/smart", { params });
      handlePagedResponse(response.data);
      showSnackbar(
        `${response.data.totalElements}개 중 ${response.data.content.length}개의 결과를 찾았습니다.`
      );
    } catch (error) {
      console.error("검색 실패:", error);
      showSnackbar("검색에 실패했습니다.", "error");
    } finally {
      searchLoading.value = false;
    }
  };

  const getPopularImages = async () => {
    popularLoading.value = true;
    try {
      const response = await axios.get("/api/image/search/popular", {
        params: {
          page: page.value,
          size: size.value,
        },
      });
      handlePagedResponse(response.data);
      showSnackbar(
        `인기 이미지 ${response.data.content.length}개를 불러왔습니다.`
      );
    } catch (error) {
      console.error("인기 이미지 조회 실패:", error);
      showSnackbar("인기 이미지 조회에 실패했습니다.", "error");
    } finally {
      popularLoading.value = false;
    }
  };

  const getRecentImages = async () => {
    recentLoading.value = true;
    try {
      const response = await axios.get("/api/image/search/recent", {
        params: {
          page: page.value,
          size: size.value,
        },
      });
      handlePagedResponse(response.data);
      showSnackbar(
        `최신 이미지 ${response.data.content.length}개를 불러왔습니다.`
      );
    } catch (error) {
      console.error("최신 이미지 조회 실패:", error);
      showSnackbar("최신 이미지 조회에 실패했습니다.", "error");
    } finally {
      recentLoading.value = false;
    }
  };

  const searchByTags = async (tagNames: string[]) => {
    searchLoading.value = true;
    try {
      const response = await axios.post("/api/image/search/tags", tagNames, {
        params: {
          page: page.value,
          size: size.value,
        },
      });
      handlePagedResponse(response.data);
      showSnackbar(
        `태그 검색 결과 ${response.data.content.length}개를 찾았습니다.`
      );
    } catch (error) {
      console.error("태그 검색 실패:", error);
      showSnackbar("태그 검색에 실패했습니다.", "error");
    } finally {
      searchLoading.value = false;
    }
  };

  const searchByUploader = async (uploaderId: number) => {
    searchLoading.value = true;
    try {
      const response = await axios.get(
        `/api/image/search/uploader/${uploaderId}`,
        {
          params: {
            page: page.value,
            size: size.value,
          },
        }
      );
      handlePagedResponse(response.data);
      showSnackbar(
        `업로더별 검색 결과 ${response.data.content.length}개를 찾았습니다.`
      );
    } catch (error) {
      console.error("업로더별 검색 실패:", error);
      showSnackbar("업로더별 검색에 실패했습니다.", "error");
    } finally {
      searchLoading.value = false;
    }
  };

  const testAutocomplete = async () => {
    if (!autocompleteQuery.value.trim()) {
      autocompleteSuggestions.value = [];
      return;
    }

    try {
      const response = await axios.get("/api/image/search/autocomplete", {
        params: {
          prefix: autocompleteQuery.value,
          size: 5,
        },
      });
      autocompleteSuggestions.value = response.data;
    } catch (error) {
      console.error("자동완성 실패:", error);
    }
  };

  const viewImageDetail = (image: any) => {
    // 이미지 상세 페이지로 이동하거나 모달 표시
    showSnackbar(`이미지 상세: ${image.imageName}`);
    console.log("이미지 상세:", image);
  };

  // 페이지네이션이 포함된 검색 실행 (현재 활성화된 검색 재실행)
  const loadImages = async () => {
    // 마지막 검색 타입에 따라 적절한 메서드 호출
    if (searchKeyword.value) {
      await smartSearch();
    } else {
      await getPopularImages(); // 기본값으로 인기 이미지 로드
    }
  };

  return {
    // 상태
    syncStatus,
    searchKeyword,
    selectedGrade,
    publicOnly,
    searchResults,
    autocompleteQuery,
    autocompleteSuggestions,

    // 페이지네이션 상태
    page,
    size,
    totalPages,
    totalElements,

    // 로딩 상태
    statusLoading,
    syncLoading,
    searchLoading,
    popularLoading,
    recentLoading,

    // 옵션
    gradeOptions,

    // 스낵바
    snackbar,

    // 메서드
    showSnackbar,
    handlePagedResponse,
    changePage,
    changeSize,
    checkSyncStatus,
    syncAllImages,
    smartSearch,
    getPopularImages,
    getRecentImages,
    searchByTags,
    searchByUploader,
    testAutocomplete,
    viewImageDetail,
    loadImages,
  };
});
