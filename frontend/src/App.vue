<script setup lang="ts">
import { onMounted, ref } from "vue";
import { http } from "./api/http";
import HelloWorld from "./components/HelloWorld.vue";

const healthText = ref("检查中...");

onMounted(async () => {
  try {
    const { data } = await http.get("/health");
    healthText.value = JSON.stringify(data);
  } catch (error) {
    healthText.value = `后端连接失败，请确认Nest已启动`;
    console.error(error);
  }
});
</script>

<template>
  <p style="padding: 12px">后端状态：{{ healthText }}</p>
  <HelloWorld />
</template>
