<template>
  <main class="stats-view">
    <!-- 顶部导航 -->
    <header class="stats-header">
      <div class="container flex items-center justify-between">
        <button class="btn-icon" @click="$router.push('/')" aria-label="返回">
          ←
        </button>
        <h1 class="stats-title">📊 阅读统计</h1>
        <div style="width: 40px;"></div>
      </div>
    </header>

    <div class="container">
      <!-- 总览卡片 -->
      <section class="overview-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ formatTime(totalStats.totalReadTime) }}</div>
            <div class="stat-label">总阅读时长</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ totalStats.totalChaptersRead }}</div>
            <div class="stat-label">已读章节数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✍️</div>
            <div class="stat-value">{{ formatNumber(totalStats.totalWordsRead) }}</div>
            <div class="stat-label">已读字数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ totalStats.totalDays }}</div>
            <div class="stat-label">阅读天数</div>
          </div>
        </div>
      </section>

      <!-- 书籍选择 -->
      <section class="book-selection-section">
        <h2 class="section-title">📈 书籍统计</h2>
        <div class="book-selector">
          <select v-model="selectedBookId" class="book-select" @change="loadBookStats">
            <option value="">请选择书籍</option>
            <option v-for="book in books" :key="book.id" :value="book.id">
              {{ book.title }} ({{ book.author }})
            </option>
          </select>
        </div>
      </section>

      <!-- 书籍详情统计 -->
      <section v-if="selectedBookId" class="book-stats-section">
        <h2 class="section-title">{{ selectedBookTitle }} 统计</h2>
        
        <div v-if="bookStats.length > 0" class="book-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ formatTime(bookTotalTime) }}</div>
            <div class="stat-label">阅读时长</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ bookTotalChapters }}</div>
            <div class="stat-label">阅读章节数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✍️</div>
            <div class="stat-value">{{ formatNumber(bookTotalWords) }}</div>
            <div class="stat-label">阅读字数</div>
          </div>
        </div>

        <!-- 阅读趋势图 -->
        <div class="reading-chart-section">
          <h3 class="chart-title">📅 近期阅读趋势</h3>
          <div class="chart-container">
            <div 
              v-for="(stat, index) in recentStats" 
              :key="index" 
              class="chart-bar"
              :style="{ height: `${Math.min(100, stat.readTime / maxTime * 100)}%` }"
            >
              <div class="bar-content">
                <div class="bar-value">{{ formatTime(stat.readTime) }}</div>
                <div class="bar-date">{{ formatDate(stat.date) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细记录 -->
        <div class="detailed-stats">
          <h3 class="detailed-title">📋 详细记录</h3>
          <div class="stats-table">
            <div class="table-header">
              <div class="table-cell">日期</div>
              <div class="table-cell">阅读时长</div>
              <div class="table-cell">阅读章节</div>
              <div class="table-cell">阅读字数</div>
            </div>
            <div 
              v-for="stat in bookStats" 
              :key="stat.id" 
              class="table-row"
            >
              <div class="table-cell">{{ formatDate(stat.date) }}</div>
              <div class="table-cell">{{ formatTime(stat.readTime) }}</div>
              <div class="table-cell">{{ stat.chaptersRead }}</div>
              <div class="table-cell">{{ formatNumber(stat.wordsRead) }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 空状态 -->
      <section v-else class="empty-section">
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3 class="empty-title">选择一本书籍查看详情</h3>
          <p class="empty-text">从上方下拉菜单中选择一本书，查看其阅读统计</p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * ReadingStatsView - 阅读统计页面
 * 
 * 功能：
 * 1. 显示总体阅读统计
 * 2. 按书籍查看详细统计
 * 3. 阅读趋势图表
 * 4. 详细记录表格
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, type Book } from '@/db';
import { useReadingStatsStore, type ReadingStat } from '@/stores/reading-stats';

// ============ 状态管理 ============
const router = useRouter();
const statsStore = useReadingStatsStore();

// ============ 本地状态 ============
const books = ref<Book[]>([]);
const selectedBookId = ref<number | null>(null);
const bookStats = ref<ReadingStat[]>([]);
const loading = ref(false);

// ============ 计算属性 ============
const totalStats = computed(() => {
  const stats = {
    totalReadTime: 0,
    totalChaptersRead: 0,
    totalWordsRead: 0,
    totalDays: 0
  };
  
  // 这里应该计算总统计，但我们暂时返回默认值
  return stats;
});

const selectedBookTitle = computed(() => {
  const book = books.value.find(b => b.id === selectedBookId.value);
  return book?.title || '';
});

const bookTotalTime = computed(() => {
  return bookStats.value.reduce((sum, stat) => sum + stat.readTime, 0);
});

const bookTotalChapters = computed(() => {
  return bookStats.value.reduce((sum, stat) => sum + stat.chaptersRead, 0);
});

const bookTotalWords = computed(() => {
  return bookStats.value.reduce((sum, stat) => sum + stat.wordsRead, 0);
});

const recentStats = computed(() => {
  // 取取最近 7 天的数据
  return [...bookStats.value].slice(-7);
});

const maxTime = computed(() => {
  if (recentStats.value.length === 0) return 1;
  return Math.max(...recentStats.value.map(stat => stat.readTime), 1);
});

// ============ 生命周期 ============
onMounted(async () => {
  await loadBooks();
  await loadTotalStats();
});

// ============ 方法 ============

/**
 * 加载书籍列表
 */
async function loadBooks() {
  try {
    books.value = await db.books.toArray();
  } catch (error) {
    console.error('[ReadingStatsView] 加载书籍失败:', error);
  }
}

/**
 * 加载总统计
 */
async function loadTotalStats() {
  try {
    const stats = await statsStore.getTotalStats();
    // 由计算属性动态计算
  } catch (error) {
    console.error('[ReadingStatsView] 加载总统计失败:', error);
  }
}

/**
 * 加载选定书籍的统计
 */
async function loadBookStats() {
  if (!selectedBookId.value) return;
  
  try {
    loading.value = true;
    bookStats.value = await statsStore.getBookStats(selectedBookId.value);
  } catch (error) {
    console.error('[ReadingStatsView] 加载书籍统计失败:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 格式化时间（秒转为小时:分钟）
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${hours}h`;
}

/**
 * 格式化数字（添加千分位分隔符）
 */
function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  
  return num.toLocaleString();
}

/**
 * 格式化日期显示
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   统计页面布局
   ═══════════════════════════════════════════════════════════ */

.stats-view {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--space-4);
}

/* ═══════════════════════════════════════════════════════════
   顶部导航
   ═══════════════════════════════════════════════════════════ */

.stats-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
  backdrop-filter: blur(8px);
}

.stats-header .container {
  height: 100%;
}

.stats-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   总览部分
   ═══════════════════════════════════════════════════════════ */

.overview-section {
  padding: var(--space-4) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-200) var(--ease-in-out);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-3);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* ═══════════════════════════════════════════════════════════
   书籍选择部分
   ═══════════════════════════════════════════════════════════ */

.book-selection-section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.book-selector {
  margin-bottom: var(--space-4);
}

.book-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-neutral-50);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--color-text);
  cursor: pointer;
}

/* ═══════════════════════════════════════════════════════════
   图表部分
   ═══════════════════════════════════════════════════════════ */

.reading-chart-section {
  margin: var(--space-6) 0;
}

.chart-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.chart-container {
  display: flex;
  align-items: end;
  justify-content: space-around;
  gap: var(--space-2);
  height: 150px;
  padding: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.chart-bar {
  flex: 1;
  min-width: 30px;
  background: var(--color-primary-200);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  position: relative;
  transition: height var(--duration-300) var(--ease-out);
}

.chart-bar:hover {
  background: var(--color-primary-300);
}

.bar-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  margin-bottom: var(--space-2);
  opacity: 0;
  transition: opacity var(--duration-200) var(--ease-in-out);
}

.chart-bar:hover .bar-content {
  opacity: 1;
}

.bar-value {
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.bar-date {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

/* ═══════════════════════════════════════════════════════════
   详细统计
   ═══════════════════════════════════════════════════════════ */

.detailed-stats {
  margin: var(--space-6) 0;
}

.detailed-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.stats-table {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  background: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-3) var(--space-4);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text);
}

/* ═══════════════════════════════════════════════════════════
   空状态
   ═══════════════════════════════════════════════════════════ */

.empty-section {
  margin: var(--space-12) 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-24) var(--space-4);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: var(--space-6);
  opacity: 0.5;
}

.empty-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
}

.empty-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   响应式调整
   ═══════════════════════════════════════════════════════════ */

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    font-size: var(--text-xs);
  }
  
  .table-cell {
    justify-content: flex-start;
    text-align: left;
    margin-left: var(--space-2);
  }
  
  .chart-container {
    height: 120px;
  }
}

/* 减少动画 (无障碍) */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .chart-bar {
    transition: none;
  }
}
</style>