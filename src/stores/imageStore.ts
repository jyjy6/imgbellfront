import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "axios";
import type {
  ImageDetailDto,
  ImageDto,
  RecentViewItem,
} from "../types/ImageTypes";
import { useLoginStore } from "./loginStore";

interface PageResponse {
  content: ImageDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const useImageStore = defineStore("image", () => {
  // 상태 정의
  const images = ref<ImageDto[]>([]);
  const loading = ref(true);
  const page = ref(1);
  const size = ref(12);
  const totalPages = ref(0);
  const searchTag = ref("");
  const selectedGrade = ref("");
  const sortOption = ref("newest");
  const selectedImage = ref<ImageDetailDto | null>(null);
  const searchCategory = ref("all");
  const searchQuery = ref("");
  const dialog = ref(false);
  const userLikeList = ref<ImageDto[] | null>([]);
  const myImageList = ref(false);
  const likeImageList = ref(false);

  const recentViewItems = ref<RecentViewItem[]>([]);

  const loginStore = useLoginStore();

  // 등급 옵션
  const gradeOptions = [
    { title: "전체", value: "" },
    { title: "일반 전용", value: "GENERAL" },
    { title: "성인 전용", value: "ADULT" },
    { title: "EXTREME", value: "EXTREME" },
  ];

  // 정렬 옵션
  const sortOptions = [
    { title: "최신순", value: "newest" },
    { title: "인기순", value: "popular" },
    { title: "좋아요순", value: "mostLiked" },
  ];

  const resetAll = () => {
    searchTag.value = "";
    sortOption.value = "newest";
    searchCategory.value = "all";
    searchQuery.value = "";
    page.value = 1;
    myImageList.value = false;
    likeImageList.value = false;
    loadImages();
  };
  // 등급별 색상 매핑
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case "GENERAL":
        return "green";
      case "ADULT":
        return "red";
      default:
        return "grey";
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadImages = async () => {
    loading.value = true;
    console.log("현재서치쿼리:" + searchQuery.value);
    console.log("현재서치카테고리:" + searchCategory.value);
    try {
      let endpoint = "/api/image/list";
      let params: any = {
        page: page.value - 1, // Spring은 0부터 페이지 시작
        size: size.value,
      };

      // 정렬 옵션 처리
      if (sortOption.value === "popular") {
        params.sort = "viewCount,desc";
      } else if (sortOption.value === "newest") {
        params.sort = "id,desc";
      } else if (sortOption.value === "mostLiked") {
        params.sort = "likeCount,desc";
      }

      // 검색 카테고리 및 검색어 처리
      if (searchCategory.value === "all" && searchQuery.value) {
        params.keyword = searchQuery.value;
        params.searchType = "all";
      } else if (searchCategory.value === "tag" && searchTag.value) {
        params.tag = searchTag.value;
        params.searchType = "tag";
      } else if (searchCategory.value === "imageName" && searchQuery.value) {
        params.imageName = searchQuery.value;
        params.searchType = "imageName";
      } else if (searchCategory.value === "uploaderName" && searchQuery.value) {
        params.uploaderName = searchQuery.value;
        params.searchType = "uploaderName";
      }
      if (myImageList.value) {
        params.myImageList = true;
        params.searchType = "all";
      } else {
        params.myImageList = false;
      }
      console.log("서치태그");
      console.log(searchQuery.value);
      console.log(params);

      // 등급 필터링
      if (selectedGrade.value) {
        params.grade = selectedGrade.value;
      }
      if (likeImageList.value) {
        params.likeImageList = true;
      } else {
        params.likeImageList = false;
      }

      const response = await axios.get<PageResponse>(endpoint, { params });
      images.value = response.data.content;
      totalPages.value = response.data.totalPages;
      console.log("현재 이미지 리스트");
      console.log(images.value);
    } catch (error) {
      console.error("이미지 로드 실패:", error);
    } finally {
      loading.value = false;
    }
  };

  // 이미지 상세 정보 로드
  const viewImageDetail = async (id: number) => {
    try {
      // 로컬스토리지 기반으로 조회 기록 초기화
      initImageViewHistory();
      console.log("모달켜짐");

      // 조회수 증가 여부를 파라미터로 전달
      const params: any = {};
      if (!viewdImage.value.has(id)) {
        params.increaseView = true;
      } else {
        params.increaseView = false;
      }

      const response = await axios.get<ImageDetailDto>(`/api/image/${id}`, {
        params,
      });
      selectedImage.value = response.data;
      await fetchUserLikes();

      // 조회수가 증가된 경우에만 세션과 로컬스토리지에 기록
      if (!viewdImage.value.has(id)) {
        // 조회 성공시 세션에 기록
        viewdImage.value.add(id);

        // 로컬스토리지에도 저장 (시간 기반 만료)
        const viewHistory = JSON.parse(
          localStorage.getItem("image_views") || "{}"
        );
        viewHistory[id] = Date.now();
        localStorage.setItem("image_views", JSON.stringify(viewHistory));
      }

      // 최근 본 이미지 추가
      addRecentViewImage(id);

      dialog.value = true;
    } catch (error) {
      console.error("이미지 상세 정보 로드 실패:", error);
    }
  };

  // 태그로 검색
  const searchByTag = (tag: string) => {
    searchQuery.value = tag;
    searchTag.value = tag;
    dialog.value = false; // 다이얼로그 닫기
    page.value = 1; // 페이지 초기화
    loadImages(); // 검색 실행
  };

  // 좋아요 토글 기능 ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

  const isLiked = computed(() => {
    if (
      !selectedImage.value ||
      !userLikeList.value ||
      userLikeList.value.length === 0
    )
      return false;
    return userLikeList.value.some(
      (image) => image.id === selectedImage.value?.id
    );
  });

  const fetchUserLikes = async () => {
    if (!selectedImage.value) return;
    if (!loginStore.getUser) {
      return;
    }

    try {
      const response = await axios.get(
        `/api/imagelike/member/${loginStore.getUser!.id}`
      );
      userLikeList.value = response.data;
    } catch (err) {}
  };

  const toggleLike = async () => {
    if (!selectedImage.value) return;
    if (!loginStore.getUser)
      return alert("좋아요 기능을 사용하려면 로그인하세요");

    try {
      await axios.post(`/api/imagelike`, {
        memberId: loginStore.getUser?.id, // 로그인 유저 ID
        imageId: selectedImage.value.id, // 현재 상품 ID
      });
      await fetchUserLikes();
    } catch (err) {
      console.error(err);
      alert("에러 발생");
    }
  };

  //좋아요 기능 끝 ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

  //조회수 증가 ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  const viewdImage = ref<Set<number>>(new Set()); // 현재 세션에서 조회한 게시글들
  const initImageViewHistory = () => {
    const viewHistory = JSON.parse(localStorage.getItem("image_views") || "{}");
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000; // 24시간

    console.log("조회 기록 초기화 시작:", viewHistory);

    // 기존 Set 초기화
    viewdImage.value.clear();

    Object.entries(viewHistory).forEach(([imageId, timestamp]) => {
      const timeDiff = now - (timestamp as number);
      const isValid = timeDiff < dayInMs;

      if (isValid) {
        viewdImage.value.add(Number(imageId));
        console.log(
          `이미지 ${imageId}: 24시간 내 조회 기록 있음 (${Math.round(
            timeDiff / (60 * 60 * 1000)
          )}시간 전)`
        );
      } else {
        console.log(
          `이미지 ${imageId}: 24시간 초과로 기록 만료 (${Math.round(
            timeDiff / (60 * 60 * 1000)
          )}시간 전)`
        );
      }
    });

    // 만료된 기록 정리
    const validHistory = Object.fromEntries(
      Object.entries(viewHistory).filter(
        ([_, timestamp]) => now - (timestamp as number) < dayInMs
      )
    );
    localStorage.setItem("image_views", JSON.stringify(validHistory));

    console.log(
      "조회 기록 초기화 완료. 현재 기록된 이미지 ID들:",
      Array.from(viewdImage.value)
    );
  };

  //

  //이미지 삭제
  const deleteImage = async () => {
    //현재 운영자페이지에서의 삭제는 백엔드에서 처리안했음 운영자가 삭제하는건 좀..

    //이미지 업로더명과 로그인한유저가 다르면 X
    if (
      !(selectedImage.value?.uploaderName === loginStore.user?.username) &&
      !loginStore.user?.roleSet.includes("ROLE_ADMIN")
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/image/delete/${selectedImage.value!.id}`
      );
      console.log(response.data);
      alert(response.data);
      window.location.reload();
    } catch (error) {
      console.log("에러남" + error);
    }
  };

  // 이미지 다운로드
  const downloadImage = async () => {
    if (!selectedImage.value) return;

    try {
      // 실제로는 여기서 API 호출하여 다운로드 처리
      const link = document.createElement("a");
      link.href = selectedImage.value.imageUrl;
      link.download = selectedImage.value.imageName || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 다운로드 카운트 증가 (실제로는 API 호출 필요)
      selectedImage.value.downloadCount++;
    } catch (error) {
      console.error("다운로드 실패:", error);
    }
  };

  //이미지 공개로 변경
  const togglePublic = async () => {
    if (!selectedImage.value) return;
    if (!loginStore.getUser) return;
    if (
      !(selectedImage.value?.uploaderName === loginStore.user?.username) &&
      !loginStore.user?.roleSet.includes("ROLE_ADMIN")
    ) {
      return;
    }

    try {
      const response = await axios.put(
        `/api/image/ispublic/${selectedImage.value.id}`
      );

      // 응답 데이터에서 isPublic 값만 추출해서 업데이트
      selectedImage.value.isPublic = response.data.isPublic;
      alert("이미지 공개 상태가 변경되었습니다.");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("오류가 발생했습니다.");
      }
      console.log("에러남", error);
    }
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    dialog.value = false;
  };

  const loadRecentViewImages = async () => {
    try {
      // 1. 서버에서 최근 본 이미지 id 배열 받아오기
      const response = await axios.get<RecentViewItem[]>(`/api/image/recent`);
      recentViewItems.value = response.data;
    } catch (e) {
      console.log("최근 본 이미지 로드 실패", e);
      recentViewItems.value = [];
    }
  };

  const addRecentViewImage = async (id: number) => {
    // 중복 제거
    recentViewItems.value = recentViewItems.value.filter(
      (item: RecentViewItem) => item.imageId !== id
    );
    // 서버에서 이미지 정보 받아오기
    try {
      const response = await axios.get<ImageDto>(`/api/image/${id}`, {
        params: { increaseView: false },
      });

      // 새로운 RecentViewItem 생성
      const newRecentItem: RecentViewItem = {
        imageId: id,
        imageUrl: response.data.imageUrl,
      };

      // 배열 앞쪽에 추가
      recentViewItems.value.unshift(newRecentItem);

      // 최대 10개까지만 유지
      if (recentViewItems.value.length > 10) {
        recentViewItems.value = recentViewItems.value.slice(0, 10);
      }
    } catch (e) {
      // 에러 무시
    }
  };

  return {
    // 상태
    images,
    loading,
    page,
    size,
    totalPages,
    searchTag,
    selectedGrade,
    sortOption,
    selectedImage,
    isLiked,
    dialog,
    searchCategory,
    searchQuery,
    myImageList,
    likeImageList,
    recentViewItems,

    // 옵션
    gradeOptions,
    sortOptions,

    // 메서드
    getGradeColor,
    formatFileSize,
    loadImages,
    viewImageDetail,
    searchByTag,
    toggleLike,
    downloadImage,
    closeDialog,
    resetAll,
    fetchUserLikes,
    deleteImage,
    togglePublic,
    initImageViewHistory,
    addRecentViewImage,
    loadRecentViewImages,
  };
});
