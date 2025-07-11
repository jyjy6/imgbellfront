import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import type { Forum, ForumComment } from "../types/ForumTypes";
import { useRouter } from "vue-router";
import { useLoginStore } from "./loginStore";

export const useForumStore = defineStore("forum", () => {
  const posts = ref<Forum[]>([]);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const singlePost = ref<Forum | null>(null);
  const comments = ref<ForumComment[]>([]);
  const noticeList = ref<Forum[]>([]);
  const router = useRouter();
  const loginStore = useLoginStore();
  const userLikeList = ref<Forum[]>([]);

  // 랭킹 관련 상태 추가
  const dailyRankingIds = ref<number[]>([]);
  const weeklyRankingIds = ref<number[]>([]);
  const dailyRankingForums = ref<Forum[]>([]);
  const weeklyRankingForums = ref<Forum[]>([]);
  const rankingLoading = ref(false);

  const fetchNoticeList = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/list`,
        {
          params: {
            page: 0, // Spring Boot는 0-based pagination을 사용
            size: 10,
            forumType: "NOTICE",
          },
        }
      );
      noticeList.value = response.data.content;
    } catch (err) {
      console.error("공지사항 목록 조회 실패:", err);
      error.value = "공지사항 목록을 불러오는데 실패했습니다.";
    } finally {
      loading.value = false;
    }
  };

  const fetchPosts = async (page: number = 1) => {
    loading.value = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/list`,
        {
          params: {
            page: page - 1, // Spring Boot는 0-based pagination을 사용
            size: 10,
          },
        }
      );
      posts.value = response.data.content;
      totalPages.value = response.data.totalPages;
      currentPage.value = page;
    } catch (err) {
      console.error("게시글 목록 조회 실패:", err);
      error.value = "게시글 목록을 불러오는데 실패했습니다.";
    } finally {
      loading.value = false;
    }
  };

  const fetchSinglePost = async (postId: number) => {
    console.log("postId스토어", postId);
    loading.value = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/${postId}`
      );
      singlePost.value = response.data;

      // 게시글 로드 후 좋아요 상태 확인
      if (loginStore.user) {
        await fetchUserLikes();
      }
    } catch (err) {
      console.error("게시글 조회 실패:", err);
      error.value = "게시글을 불러오는데 실패했습니다.";
    } finally {
      loading.value = false;
    }
  };

  const fetchComments = async (postId: number) => {
    loading.value = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}`
      );
      console.log(response.data);
      comments.value = response.data;
    } catch (err) {
      console.error("댓글 조회 실패:", err);
      error.value = "댓글을 불러오는데 실패했습니다.";
    } finally {
      loading.value = false;
    }
  };

  //조회수 증가 ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
  const viewedPosts = ref<Set<number>>(new Set()); // 현재 세션에서 조회한 게시글들
  const forumViewCount = async (postId: number) => {
    // 이미 조회한 게시글이면 카운트하지 않음
    if (viewedPosts.value.has(postId)) {
      console.log("이미 조회한 게시글");
      return;
    }

    console.log("조회수 증가 시도");

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/view/${postId}`
      );

      // 조회 성공시 세션에 기록
      viewedPosts.value.add(postId);

      // 로컬스토리지에도 저장 (시간 기반 만료)
      const viewHistory = JSON.parse(
        localStorage.getItem("forum_views") || "{}"
      );
      viewHistory[postId] = Date.now();
      localStorage.setItem("forum_views", JSON.stringify(viewHistory));
    } catch (err) {
      console.error("게시글 조회수 증가 실패:", err);
      error.value = "게시글 조회수 증가 실패했습니다.";
    }
  };
  const initViewHistory = () => {
    const viewHistory = JSON.parse(localStorage.getItem("forum_views") || "{}");
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000; // 24시간

    Object.entries(viewHistory).forEach(([postId, timestamp]) => {
      if (now - (timestamp as number) < dayInMs) {
        viewedPosts.value.add(Number(postId));
      }
    });

    // 만료된 기록 정리
    const validHistory = Object.fromEntries(
      Object.entries(viewHistory).filter(
        ([_, timestamp]) => now - (timestamp as number) < dayInMs
      )
    );
    localStorage.setItem("forum_views", JSON.stringify(validHistory));
  };

  //

  const deletePost = async (postId: number) => {
    if (confirm("삭제하면 복구할 방법이 없습니다. 진짜 삭제하시겠습니까?")) {
      loading.value = true;
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/forum/${postId}`
        );
        alert(response.data.message);
        router.push("/forum");
      } catch (err) {
        console.error("게시글 삭제 실패:", err);
        error.value = "게시글 삭제 실패했습니다.";
      } finally {
        loading.value = false;
      }
    }
  };

  const addComment = async (
    postId: number,
    content: string,
    parent?: number
  ) => {
    loading.value = true;
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/comment`,
        {
          forumId: postId,
          content: content,
          parentId: parent,
        }
      );

      // 댓글 목록 새로고침
      await fetchComments(postId);

      // 게시글 작성자에게 알림 전송 (자신의 글에 댓글을 단 경우 제외)
      if (singlePost.value && loginStore.user) {
        const postUsername = singlePost.value.authorUsername; // 게시글 작성자 이름
        const commentAuthorUsername = loginStore.user.username; // 댓글 작성자 이름
        console.log(postUsername);
        console.log(commentAuthorUsername);

        // 자신의 글에 댓글을 단 경우가 아닐 때만 알림 전송
        if (postUsername !== commentAuthorUsername) {
          try {
            const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/notify/comment`,
              {
                postId: postId,
                postTitle: singlePost.value.title,
                postUsername: postUsername,
                commentAuthorUsername: commentAuthorUsername,
                commentContent:
                  content.length > 50
                    ? content.substring(0, 50) + "..."
                    : content,
              }
            );
            console.log(response.data.message);
            console.log(response.data.postUsername);
            console.log(response.data.commentAuthorUsername);
          } catch (notifyError) {
            console.error("알림 전송 실패:", notifyError);
            // 알림 전송 실패해도 댓글 작성은 성공으로 처리
          }
        }
      }

      return alert(response.data);
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      error.value = "댓글 작성에 실패했습니다.";
    } finally {
      loading.value = false;
    }
  };

  const fetchCommentCount = async (postId: number) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/count/${postId}`
      );
      return response.data;
    } catch (err) {
      console.error("댓글 개수 조회 실패:", err);
      error.value = "댓글 개수를 불러오는데 실패했습니다.";
    } finally {
      loading.value = false;
    }
  };

  // 좋아요 토글 기능 ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

  const isLiked = ref(false);

  // isLiked 상태를 초기화하는 함수
  const updateLikedStatus = () => {
    if (!singlePost.value || !loginStore.user) {
      isLiked.value = false;
      return;
    }

    if (!userLikeList.value || userLikeList.value.length === 0) {
      isLiked.value = false;
      return;
    }
    console.log("updateLikedStatus");
    console.log(singlePost.value);
    console.log(userLikeList.value);

    isLiked.value = userLikeList.value.some(
      (forum) => forum.id === singlePost.value?.id
    );
  };

  const fetchUserLikes = async () => {
    loading.value = true;
    if (!singlePost.value) return; // 게시글이 없으면 종료
    if (!loginStore.user) {
      return;
    }

    try {
      const response = await axios.get(
        `/api/forumlike/member/${loginStore.getUser!.id}`
      );
      userLikeList.value = response.data;
      updateLikedStatus();
    } catch (err) {
      console.error("좋아요 목록 조회 실패:", err);
      error.value = "좋아요 목록을 불러오는데 실패했습니다.";
    } finally {
      loading.value = false;
      console.log(isLiked.value);
    }
  };

  const toggleLike = async () => {
    loading.value = true;
    if (!singlePost.value) return;
    if (!loginStore.user) return alert("좋아요 기능을 사용하려면 로그인하세요");

    try {
      // UI 즉시 업데이트
      isLiked.value = !isLiked.value;

      if (singlePost.value) {
        singlePost.value.likeCount = isLiked.value
          ? singlePost.value.likeCount + 1
          : singlePost.value.likeCount - 1;
      }

      const response = await axios.post(`/api/forumlike`, {
        memberId: loginStore.user.id, // 로그인 유저 ID
        forumId: singlePost.value.id, // 현재 포스트 ID
      });
      await fetchUserLikes();

      if (isLiked) {
        singlePost.value.likeCount + 1;
      }
      console.log(response.data);
    } catch (err) {
      console.error(err);
      alert("에러 발생");
    } finally {
      loading.value = false;
    }
  };

  //Elastic Search 검색기능

  const searchResults = ref<Forum[]>([]);
  const searchLoading = ref(false);
  const searchKeyword = ref("");

  // 검색 기능
  const searchPosts = async (keyword: string, page: number = 0) => {
    searchLoading.value = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/search`,
        {
          params: {
            keyword,
            page,
            size: 10,
          },
        }
      );
      searchResults.value = response.data.content;
      totalPages.value = response.data.totalPages;
      currentPage.value = page + 1;
    } catch (error) {
      console.error("검색 실패:", error);
    } finally {
      searchLoading.value = false;
    }
  };

  // 검색 결과 초기화
  const clearSearch = () => {
    searchResults.value = [];
    searchKeyword.value = "";
    fetchPosts(1); // 일반 게시글 목록으로 복귀
  };

  // 포럼 랭킹 관련 함수들 ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

  // 포럼 랭킹 데이터 로드
  const loadForumRanking = async (
    period: "daily" | "weekly",
    limit: number = 5
  ) => {
    rankingLoading.value = true;
    try {
      // 1. 랭킹 포럼 ID 가져오기
      const response = await axios.get<number[]>(
        `${import.meta.env.VITE_API_BASE_URL}/api/forum/ranking`,
        {
          params: {
            period,
            limit,
          },
        }
      );

      const rankingIds = response.data;

      // 2. 각 포럼 ID로 상세 정보 가져오기
      if (rankingIds.length > 0) {
        const forumPromises = rankingIds.map((id) =>
          axios
            .get<Forum>(`${import.meta.env.VITE_API_BASE_URL}/api/forum/${id}`)
            .then((res) => res.data)
            .catch(() => null)
        );

        const forums = await Promise.all(forumPromises);
        const validForums = forums.filter((forum): forum is Forum => !!forum);

        // 기간에 따라 저장
        if (period === "daily") {
          dailyRankingIds.value = rankingIds;
          dailyRankingForums.value = validForums;
        } else {
          weeklyRankingIds.value = rankingIds;
          weeklyRankingForums.value = validForums;
        }
      } else {
        // 랭킹 데이터가 없을 경우 초기화
        if (period === "daily") {
          dailyRankingIds.value = [];
          dailyRankingForums.value = [];
        } else {
          weeklyRankingIds.value = [];
          weeklyRankingForums.value = [];
        }
      }
    } catch (error) {
      console.error(`${period} 포럼 랭킹 로드 실패:`, error);
      // 에러 발생 시 초기화
      if (period === "daily") {
        dailyRankingIds.value = [];
        dailyRankingForums.value = [];
      } else {
        weeklyRankingIds.value = [];
        weeklyRankingForums.value = [];
      }
    } finally {
      rankingLoading.value = false;
    }
  };

  // 일간 랭킹 로드
  const loadDailyRanking = () => loadForumRanking("daily");

  // 주간 랭킹 로드
  const loadWeeklyRanking = () => loadForumRanking("weekly");

  // 모든 랭킹 로드
  const loadAllRankings = async () => {
    await Promise.all([loadDailyRanking(), loadWeeklyRanking()]);
  };

  return {
    //상태
    posts,
    currentPage,
    totalPages,
    loading,
    error,
    comments,
    singlePost,
    noticeList,
    isLiked,
    userLikeList,
    searchResults,
    searchLoading,
    searchKeyword,
    // 랭킹 관련 상태
    dailyRankingIds,
    weeklyRankingIds,
    dailyRankingForums,
    weeklyRankingForums,
    rankingLoading,

    //메소드
    fetchPosts,
    fetchSinglePost,
    fetchComments,
    fetchNoticeList,
    forumViewCount,
    initViewHistory,
    deletePost,
    addComment,
    fetchCommentCount,
    fetchUserLikes,
    toggleLike,
    searchPosts,
    clearSearch,
    // 랭킹 관련 메소드
    loadForumRanking,
    loadDailyRanking,
    loadWeeklyRanking,
    loadAllRankings,
  };
});
