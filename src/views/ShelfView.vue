<template>
  <div class="shelf-view">
    <!-- 顶部导航栏 -->
    <header class="shelf-header">
      <h1 class="shelf-title">📚 我的书架</h1>
      <div class="header-actions">
        <button 
          class="btn-import" 
          @click="showImportDialog = true"
          title="导入本地书籍"
        >
          📥 导入
        </button>
        <button 
          class="btn-search" 
          @click="$router.push('/library')"
          title="搜索在线书籍"
        >
          🔍 书城
        </button>
      </div>
    </header>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button 
        :class="['tab', { active: currentFilter === 'all' }]"
        @click="currentFilter = 'all'"
      >
        全部 ({{ totalCount }})
      </button>
      <button 
        :class="['tab', { active: currentFilter === 'reading' }]"
        @click="currentFilter = 'reading'"
      >
        阅读中 ({{ readingCount }})
      </button>
      <button 
        :class="['tab', { active: currentFilter === 'completed' }]"
        @click="currentFilter = 'completed'"
      >
        已完结 ({{ completedCount }})
      </button>
      <button 
        :class="['tab', { active: currentFilter === 'paused' }]"
        @click="currentFilter = 'paused'"
      >
        暂停 ({{ pausedCount }})
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        v-model="searchKeyword"
        type="text"
        placeholder="搜索书籍..."
        class="search-input"
      />
      <span class="search-icon">🔍</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">❌ {{ error }}</p>
      <button @click="loadBooks" class="btn-retry">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredBooks.length === 0" class="empty-state">
      <div class="empty-icon">📖</div>
      <p class="empty-text">
        {{ searchKeyword ? '没有找到匹配的书籍' : '书架还是空的' }}
      </p>
      <div class="empty-actions" v-if="!searchKeyword">
        <button @click="showImportDialog = true" class="btn-primary">
          📥 导入本地书籍
        </button>
        <button @click="$router.push('/library')" class="btn-secondary">
          🔍 逛逛书城
        </button>
      </div>
    </div>

    <!-- 书籍列表 -->
    <div v-else class="book-grid">
      <BookCard 
        v-for="book in filteredBooks" 
        :key="book.id"
        :book="book"
        @click="openBook(book)"
        @delete="confirmDelete(book)"
      />
    </div>

    <!-- 导入对话框 -->
    <div v-if="showImportDialog" class="dialog-overlay" @click="showImportDialog = false">
      <div class="dialog" @click.stop>
        <h2 class="dialog-title">导入书籍</h2>
        <div class="dialog-content">
          <input 
            ref="fileInput"
            type="file" 
            accept=".txt,.epub"
            @change="handleFileImport"
            class="file-input"
          />
          <p class="import-hint">支持格式：TXT、EPUB</p>
          <p v-if="importing" class="importing-hint">正在导入...</p>
          <p v-if="importError" class="import-error">❌ {{ importError }}</p>
        </div>
        <div class="dialog-actions">
          <button @click="showImportDialog = false" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ShelfView - 书架页面
 * 
 * 功能：
 * 1. 展示所有书籍
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
 * 
 * @param book - 书籍信息
 */
function openBook(book: Book) {
  if (book.id) {
    router.push(`/reader/${book.id}`);
  }
}

/**
 * 处理文件导入
 * 
 * @param event - 文件选择事件
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
    // 重置文件输入
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
 * 
 * @param book - 要删除的书籍
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
/**
 * 书架页面样式
 */

.shelf-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* 顶部导航栏 */
.shelf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.shelf-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-import,
.btn-search {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-import {
  background: #4CAF50;
  color: white;
}

.btn-import:hover {
  background: #45a049;
}

.btn-search {
  background: #2196F3;
  color: white;
}

.btn-search:hover {
  background: #1976D2;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.tab {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab:hover {
  border-color: #2196F3;
  color: #2196F3;
}

.tab.active {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

/* 搜索框 */
.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 2px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2196F3;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示 */
.error-container {
  text-align: center;
  padding: 60px 20px;
}

.error-message {
  color: #f44336;
  margin-bottom: 20px;
}

.btn-retry {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 30px;
}

.empty-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-secondary {
  background: #fff;
  color: #2196F3;
  border: 2px solid #2196F3;
}

/* 书籍网格 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.dialog-title {
  margin: 0 0 20px;
  font-size: 20px;
  color: #333;
}

.dialog-content {
  margin-bottom: 20px;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.import-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

.importing-hint {
  margin-top: 10px;
  font-size: 14px;
  color: #2196F3;
}

.import-error {
  margin-top: 10px;
  font-size: 14px;
  color: #f44336;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .shelf-view {
    padding: 15px;
  }
  
  .shelf-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .btn-import,
  .btn-search {
    flex: 1;
  }
  
  .book-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
  }
}
</style>
