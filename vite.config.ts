import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173,
    strictPort: true, // 포트가 사용 중이면 자동으로 다른 포트 사용 안함
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
