// @ts-ignore
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";

// 커스텀 테마 정의
const customLightTheme = {
  dark: false,
  colors: {
    primary: "#6366F1", // 인디고 블루
    secondary: "#EC4899", // 핑크
    accent: "#F59E0B", // 앰버
    error: "#EF4444", // 레드
    warning: "#F59E0B", // 앰버
    info: "#3B82F6", // 블루
    success: "#10B981", // 에메랄드
    surface: "#FFFFFF",
    background: "#F8FAFC", // 슬레이트 50
    "surface-variant": "#F1F5F9", // 슬레이트 100
    "on-surface": "#0F172A", // 슬레이트 900
    "primary-darken-1": "#4F46E5",
    "secondary-darken-1": "#DB2777",
  },
};

const customDarkTheme = {
  dark: true,
  colors: {
    primary: "#8B5CF6", // 바이올렛
    secondary: "#F472B6", // 핑크
    accent: "#FBBF24", // 앰버
    error: "#F87171", // 레드
    warning: "#FBBF24", // 앰버
    info: "#60A5FA", // 블루
    success: "#34D399", // 에메랄드
    surface: "#1E293B", // 슬레이트 800
    background: "#0F172A", // 슬레이트 900
    "surface-variant": "#334155", // 슬레이트 700
    "on-surface": "#F8FAFC", // 슬레이트 50
    "primary-darken-1": "#7C3AED",
    "secondary-darken-1": "#EC4899",
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "customLight",
    themes: {
      customLight: customLightTheme,
      customDark: customDarkTheme,
    },
  },
  icons: {
    defaultSet: "mdi",
  },
  defaults: {
    // 글로벌 컴포넌트 기본값 설정
    VCard: {
      elevation: 3,
      rounded: "lg",
    },
    VBtn: {
      rounded: "lg",
      style: "text-transform: none;", // 버튼 텍스트 대소문자 유지
    },
    VTextField: {
      variant: "outlined",
      density: "comfortable",
      rounded: "lg",
    },
    VSelect: {
      variant: "outlined",
      density: "comfortable",
      rounded: "lg",
    },
    VChip: {
      rounded: "lg",
    },
  },
  display: {
    mobileBreakpoint: "sm",
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});
