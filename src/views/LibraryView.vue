<template>
  <div class="library-view">
    <!-- 顶部导航 -->
    <header class="library-header">
      <button class="btn-back" @click="$router.push('/')">
        ← 返回
      </button>
      <h1 class="library-title">📚 在线书城</h1>
      <div style="width: 60px;"></div>
    </header>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchKeyword"
          type="text"
          placeholder="搜索书名、作者..."
          class="search-input"
          @keyup.enter="search"
        />
        <button @click="search" class="btn-search" :disabled="searching">
          {{ searching ? '搜索中...' : '🔍 搜索' }}
        </button>
      </div>
      
      <!-- 书源选择 -->
      <div class="source-selector">
        <label>书源：</label>
        <select v-model="selectedSourceId" class="source-select">
          <option :value="0">全部书源</option>
          <option 
            v-for="source in enabledSources" 
            :key="source.id"
            :value="source.id"
          >
            {{ source.name }}
          </option>
        </select>
        <button @click="$router.push('/sources')" class="btn-manage">
          管理书源
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="searching" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在搜索...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">❌ {{ error }}</p>
      <button @click="search" class="btn-retry">重试</button>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="searchResults.length > 0" class="results-section">
      <div class="results-header">
        <span class="results-count">共 {{ searchResults.length }} 个结果</span>
      </div>
      
      <div class="book-list">
        <div 
          v-for="result in searchResults" 
          :key="result.url"
          class="book-item"
          @click="viewBookDetail(result)"
        >
          <div class="book-cover-small">
            <span v-if="!result.coverUrl" class="cover-placeholder">📖</span>
            <img v-else :src="result.coverUrl" :alt="result.title" />
          </div>
          <div class="book-info">
            <h3 class="book-title">{{ result.title }}</h3>
            <p class="book-author">{{ result.author }}</p>
            <p class="book-source">来源：{{ result.sourceName }}</p>
            <p v-if="result.description" class="book-desc">{{ result.description }}</p>
          </div>
          <button class="btn-add" @click.stop="addToLibrary(result)">
            📥 加入书架
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="searched" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">没有找到相关书籍</p>
      <p class="empty-hint">试试其他关键词或更换书源</p>
    </div>

    <!-- 初始状态 -->
    <div v-else class="welcome-state">
      <div class="welcome-icon">📚</div>
      <h2 class="welcome-title">在线书城</h2>
      <p class="welcome-text">输入关键词搜索小说</p>
      <div class="quick-sources" v-if="enabledSources.length > 0">
        <p class="quick-hint">可用书源：</p>
        <div class="source-tags">
          <span 
            v-for="source in enabledSources" 
            :key="source.id"
            class="source-tag"
          >
            {{ source.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- 书籍详情对话框 -->
    <div v-if="showDetail" class="dialog-overlay" @click="showDetail = false">
      <div class="dialog" @click.stop>
        <h2 class="dialog-title">{{ selectedBook?.title }}</h2>
        <div class="dialog-content">
          <p><strong>作者：</strong>{{ selectedBook?.author }}</p>
          <p><strong>来源：</strong>{{ selectedBook?.sourceName }}</p>
          <p v-if="selectedBook?.description"><strong>简介：</strong></p>
          <p v-if="selectedBook?.description" class="description">{{ selectedBook?.description }}</p>
        </div>
        <div class="dialog-actions">
          <button @click="showDetail = false" class="btn-cancel">取消</button>
          <button @click="addToLibrary(selectedBook!)" class="btn-confirm">
            📥 加入书架
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * LibraryView - 书城页面
 * 
 * 功能：
 * 1. 多书源搜索
 * 2. 搜索结果展示
 * 3. 书籍详情查看
 * 4. 添加到书架
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, type BookSource } from '@/db';
import { crawler, type SearchResult } from '@/services/crawler';
import { useBookStore } from '@/stores/books';

const router = useRouter();

// ============ 状态管理 ============
const bookStore = useBookStore();

// ============ 本地状态 ============
const searchKeyword = ref('');
const selectedSourceId = ref(0);
const searching = ref(false);
const searched = ref(false);
const error = ref<string | null>(null);
const searchResults = ref<SearchResult[]>([]);
const showDetail = ref(false);
const selectedBook = ref<SearchResult | null>(null);

// ============ 计算属性 ============
const enabledSources = ref<BookSource[]>([]);

// 添加 toRaw 辅助函数用于 Dexie 对象
function toRawObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

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
      .equals(true)
      .toArray();
    enabledSources.value = sources.map(s => toRawObject(s));
    
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
        console.warn(`[LibraryView] 书源"${sources[index].name}"搜索失败:`, result.reason);
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
    
    alert('✅ 已添加到书架！');
    router?.push('/');
    
  } catch (err) {
    alert(`❌ 添加失败：${err instanceof Error ? err.message : '未知错误'}`);
    console.error('[LibraryView] 添加到书架失败:', err);
  }
}
</script>

<style scoped>
/**
 * 书城页面样式
 */

.library-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* 顶部导航 */
.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-back {
  padding: 8px 15px;
  background: transparent;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-back:hover {
  background: #f0f0f0;
}

.library-title {
  font-size: 20px;
  margin: 0;
}

/* 搜索区域 */
.search-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #2196F3;
}

.btn-search {
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-search:hover {
  background: #1976D2;
}

.btn-search:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 书源选择 */
.source-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-select {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn-manage {
  padding: 8px 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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

/* 搜索结果 */
.results-section {
  margin-top: 20px;
}

.results-header {
  margin-bottom: 15px;
}

.results-count {
  font-size: 14px;
  color: #666;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.book-item {
  display: flex;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.book-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.book-cover-small {
  width: 80px;
  height: 100px;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-placeholder {
  font-size: 32px;
}

.book-cover-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 16px;
  margin: 0 0 8px;
  color: #333;
}

.book-author {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px;
}

.book-source {
  font-size: 12px;
  color: #999;
  margin: 0 0 8px;
}

.book-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.btn-add {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  height: fit-content;
  align-self: flex-start;
}

.btn-add:hover {
  background: #45a049;
}

/* 空状态 */
.empty-state,
.welcome-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon,
.welcome-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-text,
.welcome-text {
  font-size: 16px;
  color: #999;
}

.empty-hint {
  font-size: 14px;
  color: #bbb;
  margin-top: 10px;
}

.welcome-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

/* 快速书源 */
.quick-sources {
  margin-top: 30px;
}

.quick-hint {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.source-tags {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.source-tag {
  padding: 6px 12px;
  background: #E3F2FD;
  color: #1976D2;
  border-radius: 20px;
  font-size: 13px;
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
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-title {
  margin: 0 0 20px;
  font-size: 20px;
  color: #333;
}

.dialog-content p {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
}

.description {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .book-item {
    flex-direction: column;
  }
  
  .book-cover-small {
    width: 100%;
    height: 200px;
  }
  
  .btn-add {
    width: 100%;
    margin-top: 10px;
  }
}
</style>
