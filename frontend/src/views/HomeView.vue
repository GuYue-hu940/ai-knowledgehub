<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore()
const router = useRouter()
const message = ref('')

onMounted(async () => {
    //有token但没有user信息时，拉一次/me
    if (auth.token && !auth.user) {
        try {
            await auth.fetchMe()
        } catch {
            auth.logout()
            message.value = '登录已过期'
            await router.push('/login')
        }
    }
})

async function onLogout() {
    auth.logout()
    await router.push('/login')
}
</script>

<template>
    <div style="max-width: 720px;margin: 40px auto;font-family: sans-serif;">
        <h1>AI KnowledgeHub</h1>
        <p v-if="message">{{ message }}</p>
        <p>当前用户：{{ auth.user?.name }}({{ auth.user?.email }})</p>
        <p>角色：{{ auth.user?.role }}</p>

        <p style="color: #666;">下一步这里会变成聊天 / 知识库入口</p>

        <button @click="onLogout">退出登录</button>
    </div>
</template>