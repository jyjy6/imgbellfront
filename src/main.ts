import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";

// Vuetify 스타일은 플러그인 파일에서 이미 불러왔으므로 별도 불러오기 필요 없음
import vuetify from "./plugins/vuetify";
import router from "./router";
import axios from "./plugins/axios";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(axios);
app.use(vuetify);
app.mount("#app");
