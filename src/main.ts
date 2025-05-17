import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import axios from "./plugins/axios";
// Vuetify 스타일은 플러그인 파일에서 이미 불러왔으므로 별도 불러오기 필요 없음
import vuetify from "./plugins/vuetify";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(axios);
app.use(pinia);
app.use(router);
app.use(vuetify);
app.mount("#app");
