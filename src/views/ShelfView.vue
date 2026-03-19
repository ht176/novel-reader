<template>
  <div class="shelf-view">
    <!-- 顶部导航栏 -->
    <header class="shelf-header">
      <div class="container flex items-center justify-between">
        <h1 class="shelf-title">📚 我的书架</h1>
        <div class="header-actions">
          <button 
            class="btn btn-icon mobile-only"
            @click="$router.push('/library')"
            title="书城"
          >
            🔍
          </button>
          <button 
            class="btn btn-primary"
            @click="showImportDialog = true"
          >
            <span class="mobile-hidden">📥 导入</span>
            <span class="mobile-only">📥</span>
          </button>
          <button 
            class="btn btn-secondary mobile-hidden"
            @click="$router.push('/library')"
          >
            🔍 书城
          </button>
        </div>
      </div>
    </header>

    <!-- 分类标签 (可滚动) -->
    <div class="category-tabs scrollbar-thin">
      <button 
        :class="['tab', { active: currentFilter === 'all' }]"
        @click="currentFilter = 'all'"
      >
        全部 <span class="tab-count">{{ totalCount }}</span>
      </button>
      <button 
        :class="['tab', { active: currentFilter === 'reading' }]"
        @click="currentFilter = 'reading'"
      >
        阅读中 <span class="tab-count">{{ readingCount }}</span>
      </button>
      <button 
        :class="['tab', { active: currentFilter === 'completed' }]"
        @click="currentFilter = 'completed'"
      >
        已完结 <span class="tab-count">{{ completedCount }}</span>
      </button>
      <button 
        :class="['tab', { active: currentFilter === 'paused' }]"
        @click="currentFilter = 'paused'"
      >
        暂停 <span class="tab-count">{{ pausedCount }}</span>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="container">
      <div class="search-box">
        <input 
          v-model="searchKeyword"
          type="text"
          placeholder="搜索书籍、作者..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
        <button 
          v-if="searchKeyword"
          class="search-clear"
          @click="searchKeyword = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="container">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">❌</div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadBooks" class="btn btn-primary">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredBooks.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <h3 class="empty-title">
          {{ searchKeyword ? '没有找到匹配的书籍' : '书架还是空的' }}
        </h3>
        <p class="empty-text" v-if="!searchKeyword">
          导入本地书籍或从书城搜索
        </p>
        <div class="empty-actions" v-if="!searchKeyword">
          <button @click="showImportDialog = true" class="btn btn-primary">
            📥 导入本地书籍
          </button>
          <button @click="$router.push('/library')" class="btn btn-outline">
            🔍 逛逛书城
          </button>
        </div>
      </div>

      <!-- 书籍网格 -->
      <div v-else class="book-grid">
        <BookCard 
          v-for="book in filteredBooks" 
          :key="book.id"
          :book="book"
          @click="openBook(book)"
          @delete="confirmDelete(book)"
        />
      </div>
    </main>

    <!-- 导入对话框 -->
    <div v-if="showImportDialog" class="dialog-overlay" @click="showImportDialog = false">
      <div class="dialog animate-slide-up" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">导入书籍</h2>
          <button class="btn-icon" @click="showImportDialog = false">✕</button>
        </div>
        <div class="dialog-content">
          <div class="upload-area">
            <input 
              ref="fileInput"
              type="file" 
              accept=".txt,.epub"
              @change="handleFileImport"
              class="file-input"
              id="file-upload"
            />
            <label for="file-upload" class="upload-label">
              <span class="upload-icon">📁</span>
              <span class="upload-text">点击选择文件</span>
              <span class="upload-hint">或拖拽文件到此处</span>
            </label>
          </div>
          <p class="import-hint">支持格式：TXT、EPUB</p>
          <p v-if="importing" class="importing-hint">
            <span class="animate-spin">⏳</span> 正在导入...
          </p>
          <p v-if="importError" class="import-error">❌ {{ importError }}</p>
        </div>
        <div class="dialog-footer">
          <button @click="showImportDialog = false" class="btn btn-outline">取消</button>
        </div>
      </div>
    </div>

    <!-- 移动端底部导航 -->
    <nav class="bottom-nav mobile-only">
      <router-link to="/" class="nav-item active">
        <span class="nav-icon">📚</span>
        <span class="nav-label">书架</span>
      </router-link>
      <router-link to="/library" class="nav-item">
        <span class="nav-icon">🔍</span>
        <span class="nav-label">书城</span>
      </router-link>
      <router-link to="/stats" class="nav-item">
        <span class="nav-icon">📊</span>
        <span class="nav-label">统计</span>
      </router-link>
      <router-link to="/settings" class="nav-item">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
/**
 * ShelfView - 书架页面 (现代化版本)
 * 
 * 功能：
 * 1. 展示所有书籍 (响应式网格布局)
 * 2. 分类过滤（全部/阅读中/已完结/暂停）
 * 3. 搜索书籍
 * 4. 导入本地书籍
 * 5. 打开书籍阅读
 */

import { ref, computed, onMounted } from 'vue';
import { useBookStore } from '@/stores/books';
import { useRouter } from 'vue-router';
import type { Book } from '@/db';
import BookCard from '@/components/BookCard.vue';

// ============ 状态管理 ============
const bookStore = useBookStore();
const router = useRouter();

// ============ 本地状态 ============
const currentFilter = ref<'all' | 'reading' | 'completed' | 'paused'>('all');
const searchKeyword = ref('');
const showImportDialog = ref(false);
const importing = ref(false);
const importError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// ============ 计算属性 ============
const isLoading = computed(() => bookStore.isLoading);
const error = computed(() => bookStore.error);
const totalCount = computed(() => bookStore.totalCount);
const readingCount = computed(() => bookStore.readingBooks.length);
const completedCount = computed(() => bookStore.completedBooks.length);
const pausedCount = computed(() => bookStore.pausedBooks.length);

/**
 * 根据分类和搜索关键词过滤书籍
 */
const filteredBooks = computed(() => {
  let books = bookStore.books;
  
  // 按状态过滤
  if (currentFilter.value !== 'all') {
    books = books.filter(book => book.status === currentFilter.value);
  }
  
  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    books = books.filter(book => 
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword)
    );
  }
  
  return books;
});

// ============ 生命周期 ============
onMounted(async () => {
  await loadBooks();
});

// ============ 方法 ============

/**
 * 加载书籍列表
 */
async function loadBooks() {
  try {
    await bookStore.loadBooks();
  } catch (error) {
    console.error('[ShelfView] 加载书籍失败:', error);
  }
}

/**
 * 打开书籍开始阅读
 */
function openBook(book: Book) {
  if (book.id) {
    router.push(`/reader/${book.id}`);
  }
}

/**
 * 处理文件导入
 */
async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  importing.value = true;
  importError.value = null;
  
  try {
    await bookStore.importBook(file);
    showImportDialog.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    importError.value = error instanceof Error ? error.message : '导入失败';
    console.error('[ShelfView] 导入书籍失败:', error);
  } finally {
    importing.value = false;
  }
}

/**
 * 确认删除书籍
 */
function confirmDelete(book: Book) {
  if (confirm(`确定要删除"${book.title}"吗？\n\n删除后无法恢复。`)) {
    if (book.id) {
      bookStore.deleteBook(book.id);
    }
  }
}
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   书架页面布局
   ═══════════════════════════════════════════════════════════ */

.shelf-view {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--bottom-nav-height-safe);
}

/* 顶部导航栏 */
.shelf-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
}

.shelf-header .container {
  height: 100%;
}

.shelf-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

/* ═══════════════════════════════════════════════════════════
   按钮样式
   ═══════════════════════════════════════════════════════════ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-lg);
  transition: all var(--duration-200) var(--ease-in-out);
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-neutral-200);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--color-primary-500);
  color: var(--color-primary-500);
}

.btn-outline:hover {
  background: var(--color-primary-50);
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: var(--text-lg);
  border-radius: var(--radius-md);
  background: transparent;
}

.btn-icon:hover {
  background: var(--color-neutral-100);
}

/* ═══════════════════════════════════════════════════════════
   分类标签
   ═══════════════════════════════════════════════════════════ */

.category-tabs {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4);
  overflow-x: auto;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: var(--color-neutral-100);
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
  white-space: nowrap;
}

.tab:hover {
  background: var(--color-neutral-200);
  color: var(--color-text-primary);
}

.tab.active {
  background: var(--color-primary-500);
  color: white;
  border-color: var(--color-primary-500);
}

.tab-count {
  font-size: var(--text-xs);
  opacity: 0.8;
}

/* ═══════════════════════════════════════════════════════════
   搜索框
   ═══════════════════════════════════════════════════════════ */

.search-box {
  position: relative;
  margin: var(--space-4) 0;
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-12);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  transition: all var(--duration-200) var(--ease-in-out);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 4px var(--color-primary-100);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-lg);
  color: var(--color-text-tertiary);
}

.search-clear {
  position: absolute;
  right: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-neutral-200);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.search-clear:hover {
  background: var(--color-neutral-300);
}

/* ═══════════════════════════════════════════════════════════
   主内容区
   ═══════════════════════════════════════════════════════════ */

main.container {
  padding: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--bottom-nav-height-safe));
}

/* 书籍网格 - 响应式布局 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: var(--space-4);
}

/* ═══════════════════════════════════════════════════════════
   加载状态
   ═══════════════════════════════════════════════════════════ */

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-24);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ═══════════════════════════════════════════════════════════
   错误状态
   ═══════════════════════════════════════════════════════════ */

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-24);
  text-align: center;
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

/* ═══════════════════════════════════════════════════════════
   空状态
   ═══════════════════════════════════════════════════════════ */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-24);
  text-align: center;
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
  margin-bottom: var(--space-8);
}

.empty-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
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

.dialog {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 480px;
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
}

.dialog-content {
  padding: var(--space-6);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* 上传区域 */
.upload-area {
  position: relative;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10);
  background: var(--color-neutral-50);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
}

.upload-label:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-300);
}

.upload-icon {
  font-size: 48px;
}

.upload-text {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.upload-hint {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.import-hint {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}

.importing-hint {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-primary-500);
  text-align: center;
}

.import-error {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-danger);
  text-align: center;
}

/* ═══════════════════════════════════════════════════════════
   移动端底部导航
   ═══════════════════════════════════════════════════════════ */

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height-safe);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: var(--z-sticky);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-xs);
  transition: color var(--duration-150) var(--ease-in-out);
}

.nav-item.active {
  color: var(--color-primary-500);
}

.nav-icon {
  font-size: var(--text-xl);
}

/* ═══════════════════════════════════════════════════════════
   响应式调整
   ═══════════════════════════════════════════════════════════ */

@media (max-width: 767px) {
  .shelf-title {
    font-size: var(--text-lg);
  }
  
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr));
    gap: var(--space-3);
  }
  
  .dialog {
    margin: var(--space-4);
    max-width: none;
  }
}

@media (min-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (min-width: 1024px) {
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>
