import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "axios";
import type { ImageDetailDto, ImageDto } from "../types/ImageTypes";
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
  const size = ref(6);
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
        endpoint = "/api/image/popular";
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
    } catch (error) {
      console.error("이미지 로드 실패:", error);
    } finally {
      loading.value = false;
    }
  };

  // 이미지 상세 정보 로드
  const viewImageDetail = async (id: number) => {
    try {
      const response = await axios.get<ImageDetailDto>(`/api/image/${id}`);
      selectedImage.value = response.data;
      await fetchUserLikes();
      dialog.value = true;
    } catch (error) {
      console.error("이미지 상세 정보 로드 실패:", error);
    }
  };

  // 태그로 검색
  const searchByTag = (tag: string) => {
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
    console.log("유저좋아요 발동");
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

  // 다이얼로그 닫기
  const closeDialog = () => {
    dialog.value = false;
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
  };
});
