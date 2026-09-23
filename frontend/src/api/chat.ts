import { http } from "./http";

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updateAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | string;
  content: string;
  createdAt: string;
};

export function listConversations() {
  return http.get<Conversation[]>("/conversations");
}

export function createConversation(title?: string) {
  return http.post<Conversation>("/conversations", title ? { title } : {});
}

export function listMessages(conversationId: string) {
  // 注意：后端是 /message 单数
  return http.get<Message[]>(`/conversations/${conversationId}/message`);
}

export function sendMessage(conversationId: string, content: string) {
  return http.post<{
    userMessage: Message;
    assistantMessage: Message;
  }>(`/conversations/${conversationId}/message`, { content });
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  handlers: {
    onToken: (delta: string) => void;
    onDone: (payload: {
      userMessage: Message;
      assistantMessage: Message;
    }) => void;
    onError: (message: string) => void;
  },
) {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `/api/conversations/${conversationId}/message/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    },
  );

  if (!res.ok || !res.body) {
    throw new Error("流式请求失败");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      const payload = JSON.parse(data);
      if (event === "token") handlers.onToken(payload.delta);
      if (event === "done") handlers.onDone(payload);
      if (event === "error") handlers.onError(payload.message);
    }
  }
}
