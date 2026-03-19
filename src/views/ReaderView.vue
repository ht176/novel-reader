<template>
  <div class="reader-view" :class="themeClass" @click="toggleControls">
    <!-- 顶部控制栏 -->
    <transition name="slide-down">
      <div v-show="showControls" class="reader-header">
        <button class="btn-back" @click.stop="goBack">
          ← 返回
        </button>
        <h1 class="reader-title">{{ currentBook?.title }}</h1>
        <button class="btn-menu" @click.stop="showMenu = true">
          ⋮
        </button>
      </div>
    </transition>

    <!-- 阅读区域 -->
    <div class="reader-content" ref="contentRef">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <p>❌ {{ error }}</p>
        <button @click="loadChapter" class="btn-retry">重试</button>
      </div>
      
      <div v-else class="chapter-container">
        <h2 class="chapter-title">{{ currentChapter?.title }}</h2>
        <div 
          class="chapter-content"
          v-html="currentChapter?.content"
          :style="contentStyle"
        ></div>
        
        <!-- 章节导航 -->
        <div class="chapter-nav">
          <button 
            v-if="hasPrevChapter" 
            @click.stop="prevChapter"
            class="btn-chapter"
          >
            ← 上一章
          </button>
          <button 
            v-if="hasNextChapter" 
            @click.stop="nextChapter"
            class="btn-chapter"
          >
            下一章 →
          </button>
        </div>
      </div>
    </div>

    <!-- 底部进度条 -->
    <transition name="slide-up">
      <div v-show="showControls" class="reader-footer">
        <span class="progress-text">{{ currentChapterOrder + 1 }} / {{ totalChapters }}</span>
        <input 
          type="range" 
          min="0" 
          :max="totalChapters - 1"
          :value="currentChapterOrder"
          @input="jumpToChapter"
          class="progress-slider"
        />
      </div>
    </transition>

    <!-- 设置菜单 -->
    <transition name="fade">
      <div v-if="showMenu" class="menu-overlay" @click="showMenu = false">
        <div class="menu-content" @click.stop>
          <h3 class="menu-title">设置</h3>
          
          <!-- 字体大小 -->
          <div class="menu-item">
            <label>字体大小</label>
            <div class="size-buttons">
              <button 
                :class="['size-btn', { active: fontSize === 14 }]"
                @click="fontSize = 14"
              >
                小
              </button>
              <button 
                :class="['size-btn', { active: fontSize === 16 }]"
                @click="fontSize = 16"
              >
                中
              </button>
              <button 
                :class="['size-btn', { active: fontSize === 18 }]"
                @click="fontSize = 18"
              >
                大
              </button>
              <button 
                :class="['size-btn', { active: fontSize === 20 }]"
                @click="fontSize = 20"
              >
                超大
              </button>
            </div>
          </div>
          
          <!-- 主题切换 -->
          <div class="menu-item">
            <label>主题</label>
            <div class="theme-buttons">
              <button 
                :class="['theme-btn', { active: theme === 'light' }]"
                @click="theme = 'light'"
              >
                ☀️ 日间
              </button>
              <button 
                :class="['theme-btn', { active: theme === 'dark' }]"
                @click="theme = 'dark'"
              >
                🌙 夜间
              </button>
              <button 
                :class="['theme-btn', { active: theme === 'sepia' }]"
                @click="theme = 'sepia'"
              >
                📜 护眼
              </button>
            </div>
          </div>
          
          <!-- 行间距 -->
          <div class="menu-item">
            <label>行间距</label>
            <select v-model="lineHeight" class="line-height-select">
              <option :value="1.5">紧凑</option>
              <option :value="1.8">正常</option>
              <option :value="2.2">宽松</option>
              <option :value="2.6">超宽</option>
            </select>
          </div>
          
          <!-- 目录 -->
          <div class="menu-item">
            <button @click="showChapterList = true" class="btn-chapters">
              📑 章节目录
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 目录面板 -->
    <transition name="slide-left">
      <div v-if="showChapterList" class="chapter-list-overlay" @click="showChapterList = false">
        <div class="chapter-list-panel" @click.stop>
          <div class="chapter-list-header">
            <h3>目录</h3>
            <button @click="showChapterList = false" class="btn-close">✕</button>
          </div>
          <div class="chapter-list-content">
            <div 
              v-for="chapter in chapters" 
              :key="chapter.id"
              :class="['chapter-item', { active: chapter.id === currentChapter?.id }]"
              @click="selectChapter(chapter)"
            >
              {{ chapter.order + 1 }}. {{ chapter.title }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * ReaderView - 阅读器页面
 * 
 * 功能：
 * 1. 显示章节内容
 * 2. 章节切换（上一章/下一章）
 * 3. 字体大小、主题、行距设置
 * 4. 阅读进度保存
 * 5. 目录浏览
 * 
 * 路由参数：
 * - bookId: 书籍 ID
 * - chapterId: 章节 ID（可选，默认从进度读取）
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, type Book, type Chapter } from '@/db';

// ============ 路由 ============
const route = useRoute();
const router = useRouter();
const bookId = computed(() => Number(route.params.bookId));

// ============ 状态 ============
const currentBook = ref<Book | null>(null);
const chapters = ref<Chapter[]>([]);
const currentChapter = ref<Chapter | null>(null);
const currentChapterOrder = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);

// ============ 控制状态 ============
const showControls = ref(true);
const showMenu = ref(false);
const showChapterList = ref(false);
const contentRef = ref<HTMLElement | null>(null);

// ============ 阅读设置 ============
const fontSize = ref(16);
const lineHeight = ref(1.8);
const theme = ref<'light' | 'dark' | 'sepia'>('light');

// ============ 计算属性 ============
const totalChapters = computed(() => chapters.value.length);
const hasPrevChapter = computed(() => currentChapterOrder.value > 0);
const hasNextChapter = computed(() => currentChapterOrder.value < totalChapters.value - 1);

/**
 * 根据主题返回 CSS 类名
 */
const themeClass = computed(() => {
  return {
    'theme-light': theme.value === 'light',
    'theme-dark': theme.value === 'dark',
    'theme-sepia': theme.value === 'sepia'
  };
});

/**
 * 内容区域样式
 */
const contentStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: String(lineHeight.value)
}));

// ============ 生命周期 ============
onMounted(async () => {
  await loadBook();
  // 监听键盘事件
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  // 离开时保存进度
  saveProgress();
});

// ============ 方法 ============

/**
 * 加载书籍和章节
 */
async function loadBook() {
  loading.value = true;
  error.value = null;
  
  try {
    // 获取书籍信息
    const book = await db.books.get(bookId.value);
    if (!book) {
      throw new Error('书籍不存在');
    }
    currentBook.value = book;
    
    // 获取所有章节
    chapters.value = await db.chapters
      .where('bookId')
      .equals(bookId.value)
      .sortBy('order');
    
    // 获取阅读进度
    const progress = await db.progress
      .where('bookId')
      .equals(bookId.value)
      .first();
    
    // 确定从哪章开始
    let startOrder = 0;
    if (route.params.chapterId) {
      const chapter = chapters.value.find(c => c.id === Number(route.params.chapterId));
      if (chapter) {
        startOrder = chapter.order;
      }
    } else if (progress) {
      startOrder = progress.chapterOrder;
    }
    
    // 加载章节
    currentChapterOrder.value = startOrder;
    currentChapter.value = chapters.value[startOrder] || null;
    await loadChapter();
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
    console.error('[ReaderView] 加载书籍失败:', err);
  } finally {
    loading.value = false;
  }
}

/**
 * 加载当前章节
 */
async function loadChapter() {
  try {
    currentChapter.value = chapters.value[currentChapterOrder.value];
    
    // 滚动到顶部
    if (contentRef.value) {
      contentRef.value.scrollTop = 0;
    }
    
    // 保存进度
    saveProgress();
    
  } catch (err) {
    console.error('[ReaderView] 加载章节失败:', err);
  }
}

/**
 * 上一章
 */
function prevChapter() {
  if (hasPrevChapter.value) {
    currentChapterOrder.value--;
    loadChapter();
  }
}

/**
 * 下一章
 */
function nextChapter() {
  if (hasNextChapter.value) {
    currentChapterOrder.value++;
    loadChapter();
  }
}

/**
 * 跳转到指定章节
 * 
 * @param event - 滑块事件
 */
function jumpToChapter(event: Event) {
  const target = event.target as HTMLInputElement;
  const order = Number(target.value);
  currentChapterOrder.value = order;
  loadChapter();
}

/**
 * 选择章节
 * 
 * @param chapter - 章节对象
 */
function selectChapter(chapter: Chapter) {
  currentChapterOrder.value = chapter.order;
  currentChapter.value = chapter;
  showChapterList.value = false;
  loadChapter();
}

/**
 * 保存阅读进度
 */
async function saveProgress() {
  if (!currentBook.value || !currentChapter.value) return;
  
  try {
    const progress = {
      bookId: bookId.value,
      chapterId: currentChapter.value.id!,
      chapterOrder: currentChapterOrder.value,
      progress: Math.round((currentChapterOrder.value + 1) / totalChapters.value * 100),
      lastReadAt: Date.now()
    };
    
    // 更新或添加进度
    const existing = await db.progress
      .where('bookId')
      .equals(bookId.value)
      .first();
    
    if (existing) {
      await db.progress.update(existing.id!, progress);
    } else {
      await db.progress.add(progress);
    }
    
    // 更新书籍状态为"阅读中"
    if (currentBook.value.status === 'completed') {
      await db.books.update(bookId.value, { status: 'reading' });
    }
    
  } catch (err) {
    console.error('[ReaderView] 保存进度失败:', err);
  }
}

/**
 * 返回书架
 */
function goBack() {
  router.push('/');
}

/**
 * 切换控制栏显示
 */
function toggleControls() {
  showControls.value = !showControls.value;
}

/**
 * 键盘快捷键
 * 
 * @param event - 键盘事件
 */
function handleKeydown(event: KeyboardEvent) {
  // 左右方向键切换章节
  if (event.key === 'ArrowLeft') {
    prevChapter();
  } else if (event.key === 'ArrowRight') {
    nextChapter();
  }
  // ESC 隐藏控制栏
  else if (event.key === 'Escape') {
    showControls.value = false;
    showMenu.value = false;
    showChapterList.value = false;
  }
}
</script>

<style scoped>
/**
 * 阅读器页面样式
 */

.reader-view {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 主题 */
.theme-light {
  background: #f5f5f5;
  color: #333;
}

.theme-dark {
  background: #1a1a1a;
  color: #ccc;
}

.theme-sepia {
  background: #f4ecd8;
  color: #5b4636;
}

/* 顶部控制栏 */
.reader-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 0 15px;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.theme-dark .reader-header {
  background: rgba(30, 30, 30, 0.95);
}

.btn-back {
  padding: 8px 15px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
}

.btn-back:hover {
  background: rgba(0, 0, 0, 0.1);
}

.reader-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-menu {
  padding: 8px 15px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  border-radius: 6px;
}

/* 阅读区域 */
.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 60px 20px 80px;
}

.chapter-container {
  max-width: 800px;
  margin: 0 auto;
}

.chapter-title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 30px;
}

.chapter-content {
  text-align: justify;
  margin-bottom: 40px;
}

/* 章节导航 */
.chapter-nav {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.btn-chapter {
  flex: 1;
  padding: 12px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-chapter:hover {
  background: #1976D2;
}

.btn-chapter:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 底部进度条 */
.reader-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.theme-dark .reader-footer {
  background: rgba(30, 30, 30, 0.95);
}

.progress-text {
  font-size: 12px;
  color: #999;
  min-width: 80px;
}

.progress-slider {
  flex: 1;
  margin: 0 15px;
}

/* 设置菜单 */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.menu-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.theme-dark .menu-content {
  background: #2a2a2a;
}

.menu-title {
  margin: 0 0 20px;
  font-size: 18px;
  text-align: center;
}

.menu-item {
  margin-bottom: 20px;
}

.menu-item label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.size-buttons {
  display: flex;
  gap: 10px;
}

.size-btn {
  flex: 1;
  padding: 8px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.size-btn.active {
  border-color: #2196F3;
  background: #E3F2FD;
}

.theme-buttons {
  display: flex;
  gap: 10px;
}

.theme-btn {
  flex: 1;
  padding: 8px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.theme-btn.active {
  border-color: #2196F3;
  background: #E3F2FD;
}

.line-height-select {
  width: 100%;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn-chapters {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

/* 目录面板 */
.chapter-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

.chapter-list-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  background: white;
  display: flex;
  flex-direction: column;
}

.theme-dark .chapter-list-panel {
  background: #2a2a2a;
}

.chapter-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.chapter-list-header h3 {
  margin: 0;
  font-size: 18px;
}

.btn-close {
  padding: 5px 10px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.chapter-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chapter-item {
  padding: 12px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.chapter-item:hover {
  background: #f5f5f5;
}

.chapter-item.active {
  background: #E3F2FD;
  color: #1976D2;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active,
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
}

/* 加载和错误 */
.loading-container,
.error-container {
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

.btn-retry {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
