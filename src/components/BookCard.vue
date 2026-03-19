<template>
  <div class="book-card" @click="$emit('click', book)" @delete="$emit('delete', book)">
    <!-- 封面 -->
    <div class="book-cover">
      <div v-if="!book.coverUrl" class="cover-placeholder">
        <span class="cover-icon">📖</span>
        <span class="cover-initial">{{ getInitial(book.title) }}</span>
      </div>
      <img v-else :src="book.coverUrl" :alt="book.title" class="cover-image" />
      
      <!-- 删除按钮 -->
      <button class="btn-delete" @click.stop="$emit('delete', book)" title="删除">
        🗑️
      </button>
    </div>
    
    <!-- 书籍信息 -->
    <div class="book-info">
      <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
      <p class="book-author">{{ book.author }}</p>
      
      <!-- 阅读进度 -->
      <div v-if="showProgress" class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${getProgress(book)}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ getProgress(book) }}%</span>
      </div>
      
      <!-- 状态标签 -->
      <div class="status-tag" :class="getStatusClass(book.status)">
        {{ getStatusText(book.status) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * BookCard - 书籍卡片组件
 * 
 * 功能：
 * 1. 展示书籍封面、标题、作者
 * 2. 显示阅读进度
 * 3. 显示阅读状态
 * 4. 删除书籍
 * 
 * @emits click - 点击书籍时触发
 * @emits delete - 点击删除时触发
 */

import type { Book } from '@/db';

// ============ Props ============
/**
 * @property {Book} book - 书籍信息对象
 * @property {boolean} showProgress - 是否显示进度条 (默认 true)
 */
const props = defineProps({
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
const emit = defineEmits<{
  click: [book: Book];
  delete: [book: Book];
}>();

// ============ 方法 ============

/**
 * 获取书名的首字作为封面占位符
 * 
 * @param title - 书名
 * @returns 首字
 */
function getInitial(title: string): string {
  return title.charAt(0).toUpperCase();
}

/**
 * 获取阅读进度百分比
 * 
 * 逻辑说明：
 * 1. 从数据库获取阅读进度
 * 2. 计算已读章节 / 总章节 * 100
 * 
 * @param book - 书籍信息
 * @returns 进度百分比 (0-100)
 */
function getProgress(book: Book): number {
  // TODO: 实际项目中需要从进度表读取
  // 这里简化处理，假设每本书都有 progress 属性
  return (book as any).progress || 0;
}

/**
 * 根据状态获取样式类
 * 
 * @param status - 阅读状态
 * @returns CSS 类名
 */
function getStatusClass(status: Book['status']): string {
  const classMap = {
    reading: 'status-reading',
    completed: 'status-completed',
    paused: 'status-paused'
  };
  return classMap[status] || '';
}

/**
 * 根据状态获取显示文本
 * 
 * @param status - 阅读状态
 * @returns 状态文本
 */
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
/**
 * 书籍卡片样式
 */

.book-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

/* 封面区域 */
.book-cover {
  position: relative;
  width: 100%;
  padding-top: 133%; /* 3:4 比例 */
  background: #f5f5f5;
  overflow: hidden;
}

.cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cover-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.cover-initial {
  font-size: 32px;
  font-weight: bold;
}

.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 删除按钮 */
.btn-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 16px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-card:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: rgba(244, 67, 54, 0.9);
}

/* 书籍信息 */
.book-info {
  padding: 12px;
}

.book-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 13px;
  color: #999;
  margin: 0 0 10px;
}

/* 阅读进度 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #666;
  min-width: 35px;
  text-align: right;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-reading {
  background: #E3F2FD;
  color: #1976D2;
}

.status-completed {
  background: #E8F5E9;
  color: #388E3C;
}

.status-paused {
  background: #FFF3E0;
  color: #F57C00;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .book-info {
    padding: 10px;
  }
  
  .book-title {
    font-size: 14px;
  }
  
  .book-author {
    font-size: 12px;
  }
}
</style>
