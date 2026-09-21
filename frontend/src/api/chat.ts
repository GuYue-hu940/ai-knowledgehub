import { http } from './http'

export type Conversation = {
  id: string
  userId: string
  title: string
  createdAt: string
  updateAt: string
}

export type Message = {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | string
  content: string
  createdAt: string
}

export function listConversations() {
  return http.get<Conversation[]>('/conversations')
}

export function createConversation(title?: string) {
  return http.post<Conversation>('/conversations', title ? { title } : {})
}

export function listMessages(conversationId: string) {
  // 注意：后端是 /message 单数
  return http.get<Message[]>(`/conversations/${conversationId}/message`)
}

export function sendMessage(conversationId: string, content: string) {
  return http.post<{
    userMessage: Message
    assistantMessage: Message
  }>(`/conversations/${conversationId}/message`, { content })
}