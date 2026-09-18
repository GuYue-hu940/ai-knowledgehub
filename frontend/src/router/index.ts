import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import LoginView from "../views/LoginView.vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true }, //仅未登录可访问
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true }, //必须登录
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  //登录才能进，但没token去登录页
  if (to.meta.requiresAuth && !auth.token) {
    return "/login";
  }

  //已登录还去登录页 返回首页
  if (to.meta.guestOnly && auth.token) {
    return "/";
  }

  //不return 或return true放行
});

export default router;
