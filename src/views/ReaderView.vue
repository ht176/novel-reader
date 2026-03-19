<template>
  <article 
    class="reader-view" 
    :class="themeClass"
    @click="toggleControls"
  >
    <!-- 顶部控制栏 -->
    <transition name="slide-down" appear>
      <header v-show="showControls" class="reader-header">
        <div class="container flex items-center justify-between">
          <button class="btn-icon" @click.stop="goBack" aria-label="返回">
            ←
          </button>
          <h1 class="reader-title truncate">{{ currentBook?.title }}</h1>
          <button class="btn-icon" @click.stop="showMenu = true" aria-label="菜单">
            ⋮
          </button>
        </div>
      </header>
    </transition>

    <!-- 阅读区域 -->
    <main class="reader-content" ref="contentRef">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container animate-fade-in">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container animate-fade-in">
        <div class="error-icon">❌</div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadChapter" class="btn btn-primary">重试</button>
      </div>
      
      <!-- 章节内容 -->
      <div v-else class="chapter-container animate-fade-in">
        <h2 class="chapter-title">{{ currentChapter?.title }}</h2>
        <div 
          class="chapter-content"
          v-html="currentChapter?.content"
          :style="contentStyle"
        />
        
        <!-- 章节导航 -->
        <nav class="chapter-nav">
          <button 
            v-if="hasPrevChapter" 
            @click.stop="prevChapter"
            class="btn btn-outline"
          >
            ← 上一章
          </button>
          <button 
            v-if="hasNextChapter" 
            @click.stop="nextChapter"
            class="btn btn-outline"
          >
            下一章 →
          </button>
        </nav>
      </div>
    </main>

    <!-- 底部进度条 -->
    <transition name="slide-up" appear>
      <footer v-show="showControls" class="reader-footer">
        <span class="progress-text text-sm">
          {{ currentChapterOrder + 1 }} / {{ totalChapters }}
        </span>
        <input 
          type="range" 
          min="0" 
          :max="totalChapters - 1"
          :value="currentChapterOrder"
          @input="jumpToChapter"
          class="progress-slider"
          aria-label="章节进度"
        />
      </footer>
    </transition>

    <!-- 设置菜单 -->
    <transition name="fade" appear>
      <div v-if="showMenu" class="menu-overlay" @click="showMenu = false">
        <div class="menu-content animate-slide-up" @click.stop>
          <header class="menu-header">
            <h3 class="menu-title">阅读设置</h3>
            <button class="btn-icon" @click="showMenu = false" aria-label="关闭">✕</button>
          </header>
          
          <div class="menu-body scrollbar-thin">
            <!-- 字体大小 -->
            <section class="menu-section">
              <label class="menu-label">字体大小</label>
              <div class="size-buttons">
                <button 
                  v-for="size in [14, 16, 18, 20]"
                  :key="size"
                  :class="['size-btn', { active: fontSize === size }]"
                  @click="fontSize = size"
                >
                  {{ size === 14 ? '小' : size === 16 ? '中' : size === 18 ? '大' : '超大' }}
                </button>
              </div>
            </section>
            
            <!-- 主题切换 -->
            <section class="menu-section">
              <label class="menu-label">主题</label>
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
            </section>
            
            <!-- 行间距 -->
            <section class="menu-section">
              <label class="menu-label">行间距</label>
              <select v-model="lineHeight" class="line-height-select">
                <option :value="1.5">紧凑 (1.5)</option>
                <option :value="1.8">正常 (1.8)</option>
                <option :value="2.2">宽松 (2.2)</option>
                <option :value="2.6">超宽 (2.6)</option>
              </select>
            </section>
            
            <!-- 目录 -->
            <section class="menu-section">
              <button @click="showChapterList = true" class="btn btn-primary w-full">
                📑 章节目录
              </button>
            </section>
          </div>
        </div>
      </div>
    </transition>

    <!-- 目录面板 -->
    <transition name="slide-left" appear>
      <div v-if="showChapterList" class="chapter-list-overlay" @click="showChapterList = false">
        <aside class="chapter-list-panel animate-slide-up" @click.stop>
          <header class="chapter-list-header">
            <h3>章节目录</h3>
            <button @click="showChapterList = false" class="btn-icon" aria-label="关闭">✕</button>
          </header>
          <div class="chapter-list-content scrollbar-thin">
            <div 
              v-for="chapter in chapters" 
              :key="chapter.id"
              :class="['chapter-item', { active: chapter.id === currentChapter?.id }]"
              @click="selectChapter(chapter)"
              role="button"
              tabindex="0"
              @keyup.enter="selectChapter(chapter)"
            >
              <span class="chapter-number">{{ chapter.order + 1 }}.</span>
              <span class="chapter-name truncate">{{ chapter.title }}</span>
            </div>
          </div>
        </aside>
      </div>
    </transition>
  </article>
</template>

<script setup lang="ts">
/**
 * ReaderView - 阅读器页面 (现代化版本)
 * 
 * 功能：
 * 1. 章节内容显示 (响应式排版)
 * 2. 章节切换（上一章/下一章/跳转）
 * 3. 个性化设置（字体/主题/行距）
 * 4. 阅读进度自动保存
 * 5. 目录浏览
 * 
 * 特性：
 * - 点击屏幕显示/隐藏控制栏
 * - 三种主题模式（日间/夜间/护眼）
 * - 流畅动画过渡
 * - 无障碍支持
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, type Book, type Chapter } from '@/db';
import { useBreakpoints } from '@vueuse/core';

// ============ 路由 ============
const route = useRoute();
const router = useRouter();

// ============ 响应式断点 ============
const breakpoints = useBreakpoints({ mobile: 768 });
const isMobile = breakpoints.smaller('mobile');

// ============ 状态管理 ============
const currentBook = ref<Book | null>(null);
const chapters = ref<Chapter[]>([]);
const currentChapter = ref<Chapter | null>(null);
const currentChapterOrder = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const showControls = ref(true);
const showMenu = ref(false);
const showChapterList = ref(false);
const contentRef = ref<HTMLElement | null>(null);

// ============ 阅读设置 (从 localStorage 读取) ============
const fontSize = ref<number>(parseInt(localStorage.getItem('reader-fontSize') || '16'));
const theme = ref<'light' | 'dark' | 'sepia'>((localStorage.getItem('reader-theme') as any) || 'light');
const lineHeight = ref<number>(parseFloat(localStorage.getItem('reader-lineHeight') || '1.8'));

// ============ 计算属性 ============
const totalChapters = computed(() => chapters.value.length);

const hasPrevChapter = computed(() => currentChapterOrder.value > 0);

const hasNextChapter = computed(() => currentChapterOrder.value < totalChapters.value - 1);

const themeClass = computed(() => ({
  'theme-light': theme.value === 'light',
  'theme-dark': theme.value === 'dark',
  'theme-sepia': theme.value === 'sepia'
}));

const contentStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: String(lineHeight.value)
}));

// ============ 生命周期 ============
onMounted(async () => {
  await loadBook();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  saveSettings();
});

// ============ 方法 ============

/**
 * 加载书籍和章节
 */
async function loadBook() {
  const bookId = parseInt(route.params.bookId as string);
  
  if (isNaN(bookId)) {
    error.value = '无效的书籍 ID';
    loading.value = false;
    return;
  }
  
  try {
    // 加载书籍信息
    const book = await db.books.get(bookId);
    if (!book) {
      throw new Error('书籍不存在');
    }
    currentBook.value = book;
    
    // 加载章节列表
    chapters.value = await db.chapters
      .where('bookId')
      .equals(bookId)
      .sortBy('order');
    
    if (chapters.value.length === 0) {
      throw new Error('暂无章节');
    }
    
    // 加载阅读进度或指定章节
    const chapterId = route.params.chapterId 
      ? parseInt(route.params.chapterId as string)
      : await loadProgress(bookId);
    
    if (chapterId) {
      const chapterIndex = chapters.value.findIndex(c => c.id === chapterId);
      currentChapterOrder.value = chapterIndex >= 0 ? chapterIndex : 0;
    }
    
    await loadChapter();
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
    console.error('[ReaderView] 加载书籍失败:', err);
  } finally {
    loading.value = false;
  }
}

/**
 * 加载阅读进度
 */
async function loadProgress(bookId: number): Promise<number | undefined> {
  const progress = await db.progress
    .where('bookId')
    .equals(bookId)
    .first();
  
  return progress?.chapterId;
}

/**
 * 加载当前章节
 */
async function loadChapter() {
  try {
    loading.value = true;
    error.value = null;
    
    const chapter = chapters.value[currentChapterOrder.value];
    if (!chapter) {
      throw new Error('章节不存在');
    }
    
    currentChapter.value = chapter;
    
    // 滚动到顶部
    if (contentRef.value) {
      contentRef.value.scrollTop = 0;
    }
    
    // 保存进度
    await saveProgress();
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
    console.error('[ReaderView] 加载章节失败:', err);
  } finally {
    loading.value = false;
  }
}

/**
 * 保存阅读进度
 */
async function saveProgress() {
  if (!currentBook.value || !currentChapter.value) return;
  
  const progress = {
    bookId: currentBook.value.id!,
    chapterId: currentChapter.value.id!,
    chapterOrder: currentChapterOrder.value,
    progress: Math.round((currentChapterOrder.value + 1) / totalChapters.value * 100),
    lastReadAt: Date.now()
  };
  
  await db.progress.put(progress);
}

/**
 * 保存设置
 */
function saveSettings() {
  localStorage.setItem('reader-fontSize', String(fontSize.value));
  localStorage.setItem('reader-theme', theme.value);
  localStorage.setItem('reader-lineHeight', String(lineHeight.value));
}

/**
 * 切换控制栏显示
 */
function toggleControls() {
  showControls.value = !showControls.value;
}

/**
 * 返回上一页
 */
function goBack() {
  router.back();
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
 * 跳转章节
 */
function jumpToChapter(event: Event) {
  const target = event.target as HTMLInputElement;
  const order = parseInt(target.value);
  if (order !== currentChapterOrder.value) {
    currentChapterOrder.value = order;
    loadChapter();
  }
}

/**
 * 选择章节
 */
function selectChapter(chapter: Chapter) {
  const index = chapters.value.findIndex(c => c.id === chapter.id);
  if (index >= 0) {
    currentChapterOrder.value = index;
    showChapterList.value = false;
    loadChapter();
  }
}

/**
 * 键盘快捷键
 */
function handleKeydown(event: KeyboardEvent) {
  // 菜单打开时不处理
  if (showMenu.value || showChapterList.value) return;
  
  switch (event.key) {
    case 'ArrowLeft':
      prevChapter();
      break;
    case 'ArrowRight':
      nextChapter();
      break;
    case 'Escape':
      showMenu.value = false;
      showChapterList.value = false;
      break;
    case 'm':
    case 'M':
      showMenu.value = !showMenu.value;
      break;
    case 't':
    case 'T':
      showChapterList.value = !showChapterList.value;
      break;
  }
}
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   阅读器布局
   ═══════════════════════════════════════════════════════════ */

.reader-view {
  min-height: 100vh;
  background: var(--reader-bg, #f5f5f5);
  transition: background var(--duration-300) var(--ease-in-out);
}

/* 主题 */
.theme-light {
  --reader-bg: var(--color-neutral-50);
  --reader-surface: #ffffff;
  --reader-text: var(--color-neutral-900);
  --reader-text-secondary: var(--color-neutral-600);
}

.theme-dark {
  --reader-bg: #1a1a1a;
  --reader-surface: #2d2d2d;
  --reader-text: #e0e0e0;
  --reader-text-secondary: #a0a0a0;
}

.theme-sepia {
  --reader-bg: #f4ecd8;
  --reader-surface: #faf6eb;
  --reader-text: #5b4636;
  --reader-text-secondary: #8b7355;
}

/* ═══════════════════════════════════════════════════════════
   顶部控制栏
   ═══════════════════════════════════════════════════════════ */

.reader-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--reader-surface);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
  backdrop-filter: blur(8px);
}

.reader-header .container {
  height: 100%;
}

.reader-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--reader-text);
  margin: 0;
  max-width: 60%;
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  color: var(--reader-text);
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}

.btn-icon:hover {
  background: var(--color-neutral-100);
}

/* ═══════════════════════════════════════════════════════════
   阅读区域
   ═══════════════════════════════════════════════════════════ */

.reader-content {
  min-height: calc(100vh - var(--header-height) - var(--space-16));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 加载状态 */
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
  color: var(--reader-text-secondary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
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

/* 章节内容 */
.chapter-container {
  max-width: var(--container-md);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.chapter-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--reader-text);
  text-align: center;
  margin-bottom: var(--space-8);
  line-height: var(--leading-tight);
}

.chapter-content {
  color: var(--reader-text);
  text-align: justify;
}

.chapter-content :deep(p) {
  margin-bottom: var(--space-4);
  text-indent: 2em;
}

.chapter-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: var(--space-4) auto;
  border-radius: var(--radius-md);
}

/* 章节导航 */
.chapter-nav {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* ═══════════════════════════════════════════════════════════
   底部进度条
   ═══════════════════════════════════════════════════════════ */

.reader-footer {
  position: sticky;
  bottom: 0;
  z-index: var(--z-sticky);
  background: var(--reader-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-text {
  color: var(--reader-text-secondary);
  min-width: 60px;
  font-variant-numeric: tabular-nums;
}

.progress-slider {
  flex: 1;
  height: 4px;
  background: var(--color-neutral-200);
  border-radius: var(--radius-full);
  appearance: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary-500);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: transform var(--duration-150) var(--ease-in-out);
}

.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* ═══════════════════════════════════════════════════════════
   设置菜单
   ═══════════════════════════════════════════════════════════ */

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  backdrop-filter: blur(4px);
}

.menu-content {
  background: var(--reader-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-2xl);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.menu-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--reader-text);
  margin: 0;
}

.menu-body {
  padding: var(--space-6);
  overflow-y: auto;
}

.menu-section {
  margin-bottom: var(--space-6);
}

.menu-section:last-child {
  margin-bottom: 0;
}

.menu-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--reader-text-secondary);
  margin-bottom: var(--space-3);
}

/* 字体大小按钮 */
.size-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.size-btn {
  padding: var(--space-3);
  background: var(--color-neutral-100);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--reader-text);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
}

.size-btn:hover {
  background: var(--color-neutral-200);
}

.size-btn.active {
  background: var(--color-primary-500);
  color: white;
  border-color: var(--color-primary-500);
}

/* 主题按钮 */
.theme-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.theme-btn {
  padding: var(--space-3);
  background: var(--color-neutral-100);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--reader-text);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
}

.theme-btn:hover {
  background: var(--color-neutral-200);
}

.theme-btn.active {
  background: var(--color-primary-100);
  border-color: var(--color-primary-500);
  color: var(--color-primary-700);
}

/* 行间距选择器 */
.line-height-select {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-neutral-100);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--reader-text);
  cursor: pointer;
}

/* ═══════════════════════════════════════════════════════════
   目录面板
   ═══════════════════════════════════════════════════════════ */

.chapter-list-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  backdrop-filter: blur(4px);
}

.chapter-list-panel {
  background: var(--reader-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-2xl);
}

.chapter-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.chapter-list-header h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--reader-text);
  margin: 0;
}

.chapter-list-content {
  padding: var(--space-4) var(--space-6);
  overflow-y: auto;
  max-height: 60vh;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-item:hover {
  background: var(--color-neutral-50);
}

.chapter-item.active {
  background: var(--color-primary-50);
}

.chapter-number {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--reader-text-secondary);
  min-width: 40px;
}

.chapter-name {
  flex: 1;
  font-size: var(--text-base);
  color: var(--reader-text);
}

/* ═══════════════════════════════════════════════════════════
   动画
   ═══════════════════════════════════════════════════════════ */

.slide-down-enter-active,
.slide-down-leave-active,
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--duration-300) var(--ease-in-out);
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-300) var(--ease-in-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all var(--duration-300) var(--ease-out);
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════
   响应式调整
   ═══════════════════════════════════════════════════════════ */

@media (min-width: 768px) {
  .chapter-container {
    padding: var(--space-8) var(--space-6);
  }
  
  .chapter-title {
    font-size: var(--text-3xl);
  }
  
  .menu-overlay,
  .chapter-list-overlay {
    align-items: center;
  }
  
  .menu-content,
  .chapter-list-panel {
    border-radius: var(--radius-2xl);
    max-height: 70vh;
  }
}

/* 减少动画 (无障碍) */
@media (prefers-reduced-motion: reduce) {
  .slide-down-enter-active,
  .slide-down-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .fade-enter-active,
  .fade-leave-active,
  .slide-left-enter-active,
  .slide-left-leave-active {
    transition: none;
  }
}
</style>
