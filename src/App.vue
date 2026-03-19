<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
/**
 * App.vue - 应用根组件
 * 
 * 功能：
 * 1. 初始化数据库
 * 2. 提供路由出口
 */

import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { db } from '@/db';

/**
 * 应用初始化
 */
onMounted(async () => {
  try {
    // 初始化数据库
    await db.initialize();
    console.log('[App] 应用初始化完成');
  } catch (error) {
    console.error('[App] 初始化失败:', error);
  }
});
</script>

<style>
/**
 * 全局样式
 */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
