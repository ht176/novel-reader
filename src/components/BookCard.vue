<template>
  <article 
    class="book-card" 
    @click="$emit('click', book)"
    @delete="$emit('delete', book)"
  >
    <!-- 封面区域 -->
    <div class="book-cover">
      <div v-if="!book.coverUrl" class="cover-placeholder">
        <span class="cover-icon">📖</span>
        <span class="cover-initial">{{ getInitial(book.title) }}</span>
      </div>
      <img 
        v-else 
        :src="book.coverUrl" 
        :alt="book.title" 
        class="cover-image"
        loading="lazy"
      />
      
      <!-- 删除按钮 (悬停显示) -->
      <button 
        class="btn-delete" 
        @click.stop="$emit('delete', book)" 
        title="删除"
        aria-label="删除书籍"
      >
        🗑️
      </button>
      
      <!-- 状态标签 -->
      <div class="status-badge" :class="getStatusClass(book.status)">
        {{ getStatusText(book.status) }}
      </div>
    </div>
    
    <!-- 书籍信息 -->
    <div class="book-info">
      <h3 class="book-title" :title="book.title">
        {{ book.title }}
      </h3>
      <p class="book-author">{{ book.author }}</p>
      
      <!-- 阅读进度 -->
      <div v-if="showProgress && getProgress(book) > 0" class="progress-section">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${getProgress(book)}%` }"
          />
        </div>
        <span class="progress-text">{{ getProgress(book) }}%</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * BookCard - 书籍卡片组件
 * 
 * 特性：
 * - 响应式设计 (容器查询)
 * - 悬停动画
 * - 懒加载封面
 * - 无障碍支持
 * 
 * @emits click - 点击书籍时触发
 * @emits delete - 点击删除时触发
 */

import type { Book } from '@/db';

// ============ Props ============
defineProps({
  book: {
    type: Object as () => Book,
    required: true
  },
  showProgress: {
    type: Boolean,
    default: true
  }
});

// ============ Emits ============
defineEmits<{
  click: [book: Book];
  delete: [book: Book];
}>();

// ============ 方法 ============

function getInitial(title: string): string {
  return title.charAt(0).toUpperCase();
}

function getProgress(book: Book): number {
  return (book as any).progress || 0;
}

function getStatusClass(status: Book['status']): string {
  const classMap = {
    reading: 'status-reading',
    completed: 'status-completed',
    paused: 'status-paused'
  };
  return classMap[status] || '';
}

function getStatusText(status: Book['status']): string {
  const textMap = {
    reading: '阅读中',
    completed: '已完结',
    paused: '暂停'
  };
  return textMap[status] || '';
}
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   书籍卡片容器
   ═══════════════════════════════════════════════════════════ */

.book-card {
  /* 启用容器查询 */
  container-type: inline-size;
  container-name: book-card;
  
  /* 基础样式 */
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: 
    transform var(--duration-200) var(--ease-in-out),
    box-shadow var(--duration-200) var(--ease-in-out);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.book-card:active {
  transform: translateY(-2px);
}

/* ═══════════════════════════════════════════════════════════
   封面区域
   ═══════════════════════════════════════════════════════════ */

.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: var(--color-neutral-100);
  overflow: hidden;
}

.cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%);
  color: white;
}

.cover-icon {
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: var(--space-2);
  opacity: 0.9;
}

.cover-initial {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: var(--font-bold);
  text-transform: uppercase;
}

.cover-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-300) var(--ease-out);
}

.book-card:hover .cover-image {
  transform: scale(1.05);
}

/* ═══════════════════════════════════════════════════════════
   删除按钮
   ═══════════════════════════════════════════════════════════ */

.btn-delete {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  color: white;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--duration-200) var(--ease-in-out);
  z-index: var(--z-base);
}

.book-card:hover .btn-delete {
  opacity: 1;
  transform: scale(1);
}

.btn-delete:hover {
  background: var(--color-danger);
  transform: scale(1.1);
}

/* ═══════════════════════════════════════════════════════════
   状态标签
   ═══════════════════════════════════════════════════════════ */

.status-badge {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-sm);
}

.status-reading {
  color: var(--color-primary-600);
}

.status-completed {
  color: var(--color-success);
}

.status-paused {
  color: var(--color-warning);
}

/* ═══════════════════════════════════════════════════════════
   书籍信息
   ═══════════════════════════════════════════════════════════ */

.book-info {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.book-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: var(--leading-tight);
}

.book-author {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   阅读进度
   ═══════════════════════════════════════════════════════════ */

.progress-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg, 
    var(--color-primary-400), 
    var(--color-primary-600)
  );
  border-radius: var(--radius-full);
  transition: width var(--duration-300) var(--ease-out);
}

.progress-text {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  min-width: 32px;
  text-align: right;
}

/* ═══════════════════════════════════════════════════════════
   容器查询 - 响应式布局
   ═══════════════════════════════════════════════════════════ */

/* 小容器 (< 160px) - 紧凑布局 */
@container book-card (max-width: 159px) {
  .book-info {
    padding: var(--space-2);
  }
  
  .book-title {
    font-size: var(--text-sm);
    -webkit-line-clamp: 1;
  }
  
  .book-author {
    font-size: var(--text-xs);
  }
  
  .status-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
}

/* 中等容器 (160px - 200px) - 标准布局 */
@container book-card (min-width: 160px) {
  .book-info {
    padding: var(--space-3);
  }
  
  .book-title {
    font-size: var(--text-base);
  }
}

/* 大容器 (> 200px) - 增强布局 */
@container book-card (min-width: 200px) {
  .book-info {
    padding: var(--space-4);
    gap: var(--space-3);
  }
  
  .book-title {
    font-size: var(--text-lg);
  }
  
  .book-author {
    font-size: var(--text-base);
  }
  
  .progress-bar {
    height: 8px;
  }
}

/* ═══════════════════════════════════════════════════════════
   暗黑模式适配
   ═══════════════════════════════════════════════════════════ */

@media (prefers-color-scheme: dark) {
  .cover-placeholder {
    background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%);
  }
  
  .status-badge {
    background: rgba(45, 45, 45, 0.95);
  }
}

/* ═══════════════════════════════════════════════════════════
   无障碍
   ═══════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-card:hover,
  .cover-image,
  .progress-fill,
  .btn-delete {
    transition: none;
    transform: none;
  }
}
</style>
