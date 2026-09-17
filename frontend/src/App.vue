<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const email = ref('test@example.com')
const password = ref('123456')
const message = ref('')
const loading = ref(false)

onMounted(async () => {
  if (auth.token) {
    try {
      await auth.fetchMe()
      message.value = '已恢复登陆状态'
    } catch {
      auth.logout()
      message.value = '登陆已过期，请重新登录'
    }
  }
})

async function onLogin() {
  loading.value = true
  message.value = ''
  try {
    await auth.login(email.value, password.value)
    message.value = '登录成功'
  } catch (e: any) {
    message.value = e?.response?.data?.message || '登陆失败'
  } finally {
    loading.value = false
  }
}

function onLogout() {
  auth.logout()
  message.value = '已退出'
}
</script>

<template>
  <div style="max-width:420px;margin:40px auto;font-family:sans-serif">
    <h1>AI KnowledgeHub</h1>
    <p>{{ message }}</p>

    <div v-if="!auth.isLoggedIn">
      <p>
        <label>邮箱</label>
        <input v-model="email" style="width:100%" />
      </p>
      <p>
        <label>密码</label>
        <input v-model="password" type="password" style="width:100%" />
      </p>
      <button :disabled="loading" @click="onLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </div>

    <div v-else>
      <p>当前用户：{{ auth.user?.name }}({{ auth.user?.email }})</p>
      <p>角色：{{ auth.user?.role }}</p>
      <button @click="onLogout">退出登录</button>
    </div>
  </div>
</template>
