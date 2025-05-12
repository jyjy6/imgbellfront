import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: () =>
      import(/* webpackChunkName: "home" */ "../pages/index.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () =>
      import(/* webpackChunkName: "login" */ "../pages/login.vue"),
  },
  {
    path: "/register",
    name: "Register",
    component: () =>
      import(/* webpackChunkName: "register" */ "../pages/register.vue"),
  },
  {
    path: "/image/upload",
    name: "ImageUpload",
    component: () =>
      import(/* webpackChunkName: "imageupload" */ "../pages/image/upload.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
