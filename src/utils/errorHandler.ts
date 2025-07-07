// 에러 처리 유틸리티 함수들

export interface ApiError {
  errorCode?: string;
  message: string;
  status: number;
  timestamp?: string;
}

/**
 * API 에러를 처리하고 사용자에게 표시할 메시지를 반환
 */
export const handleApiError = (error: any): string => {
  console.group("🚨 API 에러 상세 정보");
  console.error("에러 객체:", error);

  if (error.response?.data) {
    const errorData: ApiError = error.response.data;
    console.error("백엔드 에러 응답:", errorData);
    console.error("커스텀 에러 코드:", errorData.errorCode);
    console.error("에러 메시지:", errorData.message);
    console.error("상태 코드:", errorData.status);
    console.groupEnd();

    // 커스텀 에러 코드가 있으면 표시
    if (errorData.errorCode) {
      return `[${errorData.errorCode}] ${errorData.message}`;
    }
    return errorData.message || "서버 오류가 발생했습니다.";
  }

  console.error("네트워크 오류 또는 예상치 못한 에러");
  console.groupEnd();
  return "네트워크 오류가 발생했습니다.";
};

/**
 * 에러를 콘솔에 자세히 로깅
 */
export const logError = (context: string, error: any): void => {
  console.group(`🚨 ${context} 에러`);
  console.error("에러 발생 위치:", context);
  console.error("에러 객체:", error);

  if (error.response) {
    console.error("응답 상태:", error.response.status);
    console.error("응답 헤더:", error.response.headers);
    console.error("응답 데이터:", error.response.data);

    if (error.response.data?.errorCode) {
      console.error("커스텀 에러 코드:", error.response.data.errorCode);
    }
  } else if (error.request) {
    console.error("요청 정보:", error.request);
  } else {
    console.error("에러 메시지:", error.message);
  }

  console.groupEnd();
};

/**
 * 특정 에러 코드에 따른 처리
 */
export const handleSpecificError = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    FORUM_NOT_FOUND: "해당 게시글을 찾을 수 없습니다.",
    MEMBER_NOT_FOUND: "사용자를 찾을 수 없습니다.",
    UNAUTHORIZED: "인증이 필요합니다.",
    FORBIDDEN: "권한이 없습니다.",
    DUPLICATE_USERNAME: "이미 사용 중인 아이디입니다.",
    DUPLICATE_DISPLAY_NAME: "이미 사용 중인 닉네임입니다.",
    INVALID_PASSWORD: "비밀번호가 올바르지 않습니다.",
    IMAGE_NOT_FOUND: "이미지를 찾을 수 없습니다.",
  };

  return errorMessages[errorCode] || "알 수 없는 오류가 발생했습니다.";
};
