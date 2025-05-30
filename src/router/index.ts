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
  {
    path: "/image/edit/:imageId",
    name: "ImageEdit",
    component: () =>
      import(/* webpackChunkName: "imageedit" */ "../pages/image/edit.vue"),
    props: true, // imageId를 props로 전달
  },
  {
    path: "/mypage",
    name: "MyPage",
    component: () =>
      import(/* webpackChunkName: "mypage" */ "../pages/mypage/index.vue"),
  },
  // router/index.js
  {
    path: "/forum",
    name: "Forum",
    component: () =>
      import(/* webpackChunkName: "forum" */ "../pages/forum/forum.vue"),
    children: [
      {
        // 게시판 목록 (기본 경로)
        path: "",
        name: "BoardList",
        component: () =>
          import(
            /* webpackChunkName: "boardlist" */ "../pages/forum/boardlist.vue"
          ),
      },
      {
        // 게시글 상세 페이지
        path: ":postId",
        name: "PostDetail",
        component: () =>
          import(
            /* webpackChunkName: "postdetail" */ "../pages/forum/postdetail.vue"
          ),
        props: true, // postId를 props로 전달
      },
    ],
  },
  {
    path: "/forum/post",
    name: "ForumPost",
    component: () =>
      import(/* webpackChunkName: "formpost" */ "../pages/forum/post.vue"),
  },
  {
    path: "/forum/edit/:postId",
    name: "ForumEdit",
    component: () =>
      import(/* webpackChunkName: "formedit" */ "../pages/forum/edit.vue"),
    props: true, // postId를 props로 전달
  },
  {
    path: "/admin",
    component: () => import("../pages/admin/index.vue"),
    children: [
      {
        path: "users",
        name: "AdminUsers",
        component: () => import("../pages/admin/users.vue"),
      },
      {
        path: "images",
        name: "AdminImages",
        component: () => import("../pages/admin/images.vue"),
      },
      // ... 기타 어드민 페이지
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
