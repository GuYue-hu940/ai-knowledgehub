<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
    sendMessageStream,
    createConversation,
    listConversations,
    listMessages,
    sendMessage,
    type Conversation,
    type Message,
} from '../api/chat'

const auth = useAuthStore()
const router = useRouter()

const conversations = ref<Conversation[]>([])
const currentId = ref<string | null>(null)
const messages = ref<Message[]>([])
const input = ref('')
const loadingList = ref(false)
const sending = ref(false)
const errorText = ref('')
const listRef = ref<HTMLElement | null>(null)

async function scrollToBottom() {
    await nextTick()
    if (listRef.value) {
        listRef.value.scrollTop = listRef.value.scrollHeight
    }
}

async function loadConversations() {
    loadingList.value = true
    errorText.value = ''
    try {
        const { data } = await listConversations()
        conversations.value = data
    } catch (e: any) {
        errorText.value = e?.response?.data?.message || '加载会话失败'
    } finally {
        loadingList.value = false
    }
}

async function openConversation(id: string) {
    currentId.value = id
    errorText.value = ''
    try {
        const { data } = await listMessages(id)
        messages.value = data
        await scrollToBottom()
    } catch (e: any) {
        errorText.value = e?.response?.data?.message || '加载消息失败'
    }
}

async function onCreateConversation() {
    errorText.value = ''
    try {
        const { data } = await createConversation()
        conversations.value.unshift(data)
        await openConversation(data.id)
    } catch (e: any) {
        errorText.value = e?.response?.data?.message || '新建失败'
    }
}

async function onSend() {
    const content = input.value.trim()
    if (!content || sending.value) return

    // 没有当前会话就先建一个
    if (!currentId.value) {
        const { data } = await createConversation()
        conversations.value.unshift(data)
        currentId.value = data.id
        messages.value = []
    }

    sending.value = true
    errorText.value = ''
    input.value = ''

    const userTempId = `temp-user-${Date.now()}`
    messages.value.push({
        id: userTempId,
        conversationId: currentId.value!,
        role: 'user',
        content, // 刚才输入的内容
        createdAt: new Date().toISOString(),
    })

    const assistantTempId = `temp-ai-${Date.now()}`
    messages.value.push({
        id: assistantTempId,
        conversationId: currentId.value!,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
    })
    await scrollToBottom()

    try {
        await sendMessageStream(currentId.value!, content, {
            onToken: async (delta) => {
                const target = messages.value.find((m) => m.id === assistantTempId)
                if (target) {
                    target.content += delta
                    await scrollToBottom()
                }
            },
            onDone: async ({ userMessage, assistantMessage }) => {
                messages.value = messages.value.filter(
                    (m) => !String(m.id).startsWith('temp-')
                )
                messages.value.push(userMessage, assistantMessage)
                await loadConversations()
                await scrollToBottom()
            },
            onError: (message) => {
                errorText.value = message
            }
        })
    } catch (e: any) {
        errorText.value = e?.message || '发送失败'
    } finally {
        sending.value = false
    }
}

async function onLogout() {
    auth.logout()
    await router.push('/login')
}

onMounted(async () => {
    if (auth.token && !auth.user) {
        try {
            await auth.fetchMe()
        } catch {
            auth.logout()
            await router.push('/login')
            return
        }
    }
    await loadConversations()
    if (conversations.value.length > 0) {
        await openConversation(conversations.value[0].id)
    }
})
</script>

<template>
    <div class="layout">
        <aside class="sidebar">
            <button class="primary" @click="onCreateConversation">新建对话</button>
            <p v-if="loadingList" class="muted">加载中...</p>
            <button v-for="c in conversations" :key="c.id" class="conv" :class="{ active: c.id === currentId }"
                @click="openConversation(c.id)">
                {{ c.title }}
            </button>
        </aside>

        <main class="main">
            <header class="top">
                <strong>AI KnowledgeHub</strong>
                <span>{{ auth.user?.name }}</span>
                <button @click="onLogout">退出</button>
            </header>

            <p v-if="errorText" class="error">{{ errorText }}</p>

            <div ref="listRef" class="messages">
                <div v-if="!currentId" class="muted">请新建或选择一个对话</div>
                <div v-for="m in messages" :key="m.id" class="bubble" :class="m.role">
                    <div class="role">{{ m.role === 'user' ? '我' : 'AI' }}</div>
                    <div class="content">{{ m.content }}</div>
                </div>
                <div v-if="sending" class="muted">AI 思考中，请稍候...</div>
            </div>

            <footer class="composer">
                <input v-model="input" :disabled="sending" placeholder="输入问题，回车发送" @keyup.enter="onSend" />
                <button class="primary" :disabled="sending || !input.trim()" @click="onSend">
                    {{ sending ? '发送中...' : '发送' }}
                </button>
            </footer>
        </main>
    </div>
</template>

<style scoped>
.layout {
    display: flex;
    height: 100vh;
    font-family: system-ui, sans-serif;
}

.sidebar {
    width: 260px;
    border-right: 1px solid #e5e5e5;
    padding: 12px;
    overflow: auto;
    background: #fafafa;
}

.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.top {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e5e5;
}

.messages {
    flex: 1;
    overflow: auto;
    padding: 16px;
}

.bubble {
    max-width: 720px;
    margin-bottom: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f3f4f6;
}

.bubble.user {
    background: #e8f1ff;
    margin-left: auto;
}

.role {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.content {
    white-space: pre-wrap;
    line-height: 1.5;
}

.composer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #e5e5e5;
}

.composer input {
    flex: 1;
    padding: 10px 12px;
}

.primary {
    background: #2563eb;
    color: #fff;
    border: 0;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
}

.conv {
    display: block;
    width: 100%;
    text-align: left;
    margin-top: 8px;
    padding: 8px;
    border: 1px solid #e5e5e5;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
}

.conv.active {
    border-color: #2563eb;
    background: #eff6ff;
}

.muted {
    color: #888;
}

.error {
    color: #b91c1c;
    padding: 0 16px;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>