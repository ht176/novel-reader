<template>
  <main class="library-view">
    <!-- 顶部导航 -->
    <header class="library-header">
      <div class="container flex items-center justify-between">
        <button class="btn-icon" @click="$router.push('/')" aria-label="返回">
          ←
        </button>
        <h1 class="library-title">📚 在线书城</h1>
        <button 
          class="btn-icon mobile-only" 
          @click="$router.push('/sources')"
          aria-label="管理书源"
        >
          ⚙️
        </button>
        <button 
          class="btn-secondary mobile-hidden" 
          @click="$router.push('/sources')"
        >
          管理书源
        </button>
      </div>
    </header>

    <!-- 搜索区域 -->
    <section class="search-section">
      <div class="container">
        <div class="search-box">
          <input 
            v-model="searchKeyword"
            type="text"
            placeholder="搜索书名、作者..."
            class="search-input"
            @keyup.enter="search"
            aria-label="搜索书籍"
          />
          <button 
            @click="search" 
            :disabled="searching"
            class="btn btn-primary search-btn"
          >
            <span v-if="searching" class="animate-spin">⏳</span>
            <span v-else>🔍</span>
            {{ searching ? '搜索中...' : '搜索' }}
          </button>
        </div>
        
        <!-- 书源选择 -->
        <div class="source-selector">
          <label class="source-label">书源：</label>
          <select 
            v-model="selectedSourceId" 
            class="source-select"
            :disabled="searching"
          >
            <option :value="0">全部书源</option>
            <option 
              v-for="source in enabledSources" 
              :key="source.id"
              :value="source.id"
            >
              {{ source.name }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <!-- 主内容区 -->
    <section class="main-content">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="searching" class="loading-container animate-fade-in">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在搜索...</p>
        </div>

        <!-- 错误提示 -->
        <div v-else-if="error" class="error-container animate-fade-in">
          <div class="error-icon">❌</div>
          <p class="error-message">{{ error }}</p>
          <button @click="search" class="btn btn-primary">重试</button>
        </div>

        <!-- 搜索结果 -->
        <div v-else-if="searchResults.length > 0" class="results-section animate-fade-in">
          <div class="results-header">
            <span class="results-count text-sm">
              共 {{ searchResults.length }} 个结果
            </span>
          </div>
          
          <div class="book-grid">
            <div 
              v-for="result in searchResults" 
              :key="result.url"
              class="book-item"
              @click="viewBookDetail(result)"
            >
              <div class="book-cover">
                <span v-if="!result.coverUrl" class="cover-placeholder">📖</span>
                <img 
                  v-else 
                  :src="result.coverUrl" 
                  :alt="result.title"
                  loading="lazy"
                />
              </div>
              <div class="book-info">
                <h3 class="book-title">{{ result.title }}</h3>
                <p class="book-author">{{ result.author }}</p>
                <p class="book-source">来源：{{ result.sourceName }}</p>
                <p v-if="result.description" class="book-desc line-clamp-2">
                  {{ result.description }}
                </p>
              </div>
              <button 
                class="btn btn-primary btn-add"
                @click.stop="addToLibrary(result)"
                :aria-label="`添加《${result.title}》到书架`"
              >
                📥 添加
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="searched" class="empty-state animate-fade-in">
          <div class="empty-icon">🔍</div>
          <p class="empty-text">没有找到相关书籍</p>
          <p class="empty-hint">试试其他关键词或更换书源</p>
        </div>

        <!-- 初始状态 -->
        <div v-else class="welcome-state animate-fade-in">
          <div class="welcome-icon">📚</div>
          <h2 class="welcome-title">在线书城</h2>
          <p class="welcome-text">输入关键词搜索小说</p>
          <div class="quick-sources" v-if="enabledSources.length > 0">
            <p class="quick-hint text-sm">可用书源：</p>
            <div class="source-tags">
              <span 
                v-for="source in enabledSources.slice(0, 5)" 
                :key="source.id"
                class="source-tag"
              >
                {{ source.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 书籍详情对话框 -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showDetail" class="dialog-overlay" @click="showDetail = false">
          <div class="dialog-content animate-slide-up" @click.stop>
            <header class="dialog-header">
              <h2 class="dialog-title truncate">{{ selectedBook?.title }}</h2>
              <button 
                class="btn-icon" 
                @click="showDetail = false" 
                aria-label="关闭"
              >
                ✕
              </button>
            </header>
            <div class="dialog-body scrollbar-thin">
              <div class="book-detail-info">
                <p class="detail-item">
                  <strong>作者：</strong>{{ selectedBook?.author }}
                </p>
                <p class="detail-item">
                  <strong>来源：</strong>{{ selectedBook?.sourceName }}
                </p>
                <p v-if="selectedBook?.description" class="detail-item">
                  <strong>简介：</strong>
                  <span class="description line-clamp-3">
                    {{ selectedBook?.description }}
                  </span>
                </p>
              </div>
            </div>
            <footer class="dialog-footer">
              <button @click="showDetail = false" class="btn btn-outline">
                取消
              </button>
              <button 
                @click="addToLibrary(selectedBook!)" 
                class="btn btn-primary"
              >
                📥 添加到书架
              </button>
            </footer>
          </div>
        </div>
      </transition>
    </teleport>
  </main>
</template>

<script setup lang="ts">
/**
 * LibraryView - 书城页面 (现代化版本)
 * 
 * 功能：
 * 1. 多书源搜索
 * 2. 搜索结果展示
 * 3. 书籍详情查看
 * 4. 添加到书架
 * 
 * 特性：
 * - 响应式网格布局
 * - 流畅动画过渡
 * - 无障碍支持
 * - 图片懒加载
 */

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, type BookSource } from '@/db';
import { crawler, type SearchResult } from '@/services/crawler';
import { useBookStore } from '@/stores/books';

// ============ 状态管理 ============
const bookStore = useBookStore();
const router = useRouter();

// ============ 本地状态 ============
const searchKeyword = ref('');
const selectedSourceId = ref(0);
const searching = ref(false);
const searched = ref(false);
const error = ref<string | null>(null);
const searchResults = ref<SearchResult[]>([]);
const showDetail = ref(false);
const selectedBook = ref<SearchResult | null>(null);
const enabledSources = ref<BookSource[]>([]);

// ============ 生命周期 ============
onMounted(async () => {
  await loadSources();
});

// ============ 方法 ============

/**
 * 加载启用的书源
 */
async function loadSources() {
  try {
    const sources = await db.sources
      .where('enabled')
      .equals(1) // 使用 1 代替 true
      .toArray();
    enabledSources.value = sources;
    
    if (sources.length === 0) {
      error.value = '暂无可用书源，请先在"书源管理"中添加书源';
    }
  } catch (err) {
    console.error('[LibraryView] 加载书源失败:', err);
  }
}

/**
 * 执行搜索
 * 
 * 逻辑说明：
 * 1. 根据选择的书源搜索
 * 2. 如果选择"全部书源"，则并行搜索所有启用的书源
 * 3. 合并结果并去重
 */
async function search() {
  if (!searchKeyword.value.trim()) {
    error.value = '请输入搜索关键词';
    return;
  }
  
  searching.value = true;
  error.value = null;
  searchResults.value = [];
  searched.value = true;
  
  try {
    let sources: BookSource[] = [];
    
    if (selectedSourceId.value === 0) {
      // 搜索所有书源
      sources = enabledSources.value;
    } else {
      // 搜索指定书源
      const source = enabledSources.value.find(s => s.id === selectedSourceId.value);
      if (source) {
        sources = [source];
      }
    }
    
    if (sources.length === 0) {
      throw new Error('没有可用的书源');
    }
    
    // 并行搜索所有书源
    const results = await Promise.allSettled(
      sources.map(source => crawler.search(source, searchKeyword.value))
    );
    
    // 收集成功结果
    const allResults: SearchResult[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        const sourceName = sources[index]?.name ?? '未知书源';
        console.warn(`[LibraryView] 书源"${sourceName}"搜索失败:`, result.reason);
      }
    });
    
    // 去重（根据书名 + 作者）
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => 
        r.title === result.title && r.author === result.author
      )
    );
    
    searchResults.value = uniqueResults;
    
    if (uniqueResults.length === 0) {
      error.value = '未找到相关书籍，试试其他关键词';
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败';
    console.error('[LibraryView] 搜索失败:', err);
  } finally {
    searching.value = false;
  }
}

/**
 * 查看书籍详情
 * 
 * @param book - 书籍信息
 */
function viewBookDetail(book: SearchResult) {
  selectedBook.value = book;
  showDetail.value = true;
}

/**
 * 添加到书架
 * 
 * 逻辑说明：
 * 1. 获取书籍详情（章节列表）
 * 2. 保存到数据库
 * 3. 跳转到书架
 * 
 * @param book - 书籍信息
 */
async function addToLibrary(book: SearchResult) {
  try {
    showDetail.value = false;
    
    // TODO: 获取章节列表
    // 这里简化处理，先添加到书架，章节列表后续获取
    await bookStore.addBook(
      {
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        sourceId: book.sourceId,
        sourceUrl: book.url,
        description: book.description
      },
      [] // 章节列表待获取
    );
    
    // 显示成功提示
    alert('✅ 已添加到书架！');
    router.push('/');
    
  } catch (err) {
    alert(`❌ 添加失败：${err instanceof Error ? err.message : '未知错误'}`);
    console.error('[LibraryView] 添加到书架失败:', err);
  }
}
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   书城页面布局
   ═══════════════════════════════════════════════════════════ */

.library-view {
  min-height: 100vh;
  background: var(--color-bg);
}

/* ═══════════════════════════════════════════════════════════
   顶部导航
   ═══════════════════════════════════════════════════════════ */

.library-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
  backdrop-filter: blur(8px);
}

.library-header .container {
  height: 100%;
}

.library-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   搜索区域
   ═══════════════════════════════════════════════════════════ */

.search-section {
  background: var(--color-surface);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
}

.search-box {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.search-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--color-neutral-50);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  color: var(--color-text);
  transition: all var(--duration-200) var(--ease-in-out);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 4px var(--color-primary-100);
}

.search-btn {
  min-width: 80px;
  padding: 0 var(--space-4);
}

/* 书源选择 */
.source-selector {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.source-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.source-select {
  flex: 1;
  min-width: 120px;
  padding: var(--space-2) var(--space-3);
  background: var(--color-neutral-50);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.source-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ═══════════════════════════════════════════════════════════
   主内容区
   ═══════════════════════════════════════════════════════════ */

.main-content {
  padding: var(--space-4) 0;
}

/* ═══════════════════════════════════════════════════════════
   结果区域
   ═══════════════════════════════════════════════════════════ */

.results-header {
  margin-bottom: var(--space-4);
}

.results-count {
  color: var(--color-text-secondary);
}

/* 书籍网格 - 响应式布局 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: var(--space-4);
}

.book-item {
  display: flex;
  gap: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
}

.book-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.book-cover {
  width: 80px;
  height: 120px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  font-size: 24px;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.book-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.book-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.book-author {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.book-source {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
}

.book-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.btn-add {
  align-self: flex-start;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  min-width: 60px;
}

/* ═══════════════════════════════════════════════════════════
   状态页面
   ═══════════════════════════════════════════════════════════ */

.loading-container,
.error-container,
.empty-state,
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-24) var(--space-4);
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-neutral-200);
  border-top-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: var(--space-4);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
}

.error-message {
  font-size: var(--text-base);
  color: var(--color-danger);
  margin-bottom: var(--space-6);
}

.empty-icon,
.welcome-icon {
  font-size: 80px;
  margin-bottom: var(--space-6);
}

.empty-text,
.welcome-text {
  font-size: var(--text-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.empty-hint,
.welcome-text {
  font-size: var(--text-base);
  color: var(--color-text-tertiary);
  margin: 0;
}

.welcome-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
}

/* 快速书源 */
.quick-sources {
  margin-top: var(--space-8);
  width: 100%;
  max-width: 400px;
}

.quick-hint {
  margin-bottom: var(--space-3);
  color: var(--color-text-secondary);
}

.source-tags {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
}

.source-tag {
  padding: var(--space-2) var(--space-3);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

/* ═══════════════════════════════════════════════════════════
   对话框
   ═══════════════════════════════════════════════════════════ */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-2xl);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  min-width: 0;
}

.dialog-body {
  padding: var(--space-6);
  flex: 1;
  overflow-y: auto;
}

.book-detail-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-item {
  margin: 0;
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.description {
  color: var(--color-text-secondary);
  font-style: italic;
  margin-top: var(--space-2);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* ═══════════════════════════════════════════════════════════
   动画
   ═══════════════════════════════════════════════════════════ */

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-300) var(--ease-in-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════
   响应式调整
   ═══════════════════════════════════════════════════════════ */

@media (min-width: 768px) {
  .book-item {
    flex-direction: column;
  }
  
  .book-cover {
    width: 100%;
    height: 150px;
  }
  
  .btn-add {
    align-self: stretch;
    margin-top: auto;
  }
  
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

/* 移动端优化 */
@media (max-width: 767px) {
  .search-box {
    flex-direction: column;
  }
  
  .search-btn {
    min-width: auto;
  }
  
  .source-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .source-select {
    min-width: auto;
  }
}

/* 减少动画 (无障碍) */
@media (prefers-reduced-motion: reduce) {
  .book-item,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
    animation: none;
  }
}
</style>
