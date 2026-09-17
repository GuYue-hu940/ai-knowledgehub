import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { http } from "../api/http";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  function setSession(accessToken: string, nextUser: User) {
    token.value = accessToken;
    user.value = nextUser;
    localStorage.setItem("token", accessToken);
  }

  function clearSession() {
    ((token.value = null),
      (user.value = null),
      localStorage.removeItem("token"));
  }

  async function login(email: string, password: string) {
    const { data } = await http.post("/auth/login", { email, password });
    setSession(data.accessToken, data.user);
    return data;
  }

  async function fetchMe() {
    if (!token.value) return null;
    const { data } = await http.get("/auth/me");
    user.value = data;
    return data;
  }

  function logout() {
    clearSession();
  }

  return { token, user, isLoggedIn, login, fetchMe, logout };
});
