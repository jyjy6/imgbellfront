// @ts-ignore
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light", // 기본 테마 설정
  },
  icons: {
    defaultSet: "mdi", // MDI 아이콘 세트
  },
});
