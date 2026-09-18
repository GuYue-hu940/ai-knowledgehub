<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('test@example.com')
const password = ref('123456')
const message = ref('')
const loading = ref(false)

async function onLogin() {
    loading.value = true
    message.value = ''
    try {
        await auth.login(email.value, password.value)
        //登陆成功：跳转首页
        await router.push('/')
    } catch (e: any) {
        message.value = e?.response?.data?.message || '登录失败'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div style="max-width: 420px;margin: 40px auto;font-family: sans-serif;">
        <h1>AI KnowledgeHub 登陆</h1>
        <p v-if="message" style="color: crimson;">{{ message }}</p>
        <p>
            <label>邮箱</label>
            <input v-model="email" style="width: 100%;" />
        </p>
        <p>
            <label>密码</label>
            <input v-model="password" type="password" style="width: 100%;" />
        </p>
        <button :disabled="loading" @click="onLogin">
            {{ loading ? '登录中...' : '登录' }}
        </button>
    </div>
</template>