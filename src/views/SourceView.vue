<template>
  <main class="source-view">
    <!-- 顶部导航 -->
    <header class="source-header">
      <div class="container flex items-center justify-between">
        <button class="btn-icon" @click="$router.push('/')" aria-label="返回">
          ←
        </button>
        <h1 class="source-title">📡 书源管理</h1>
        <button 
          @click="showAddDialog = true" 
          class="btn btn-primary"
          aria-label="添加书源"
        >
          + 添加书源
        </button>
      </div>
    </header>

    <!-- 书源列表 -->
    <div class="container">
      <div class="source-list">
        <div 
          v-for="source in sources" 
          :key="source.id"
          class="source-item"
          :class="{ disabled: !source.enabled }"
        >
          <div class="source-info">
            <h3 class="source-name">{{ source.name }}</h3>
            <p class="source-url truncate">{{ source.baseUrl }}</p>
            <div class="source-meta flex items-center gap-3">
              <span class="status-badge" :class="{ active: source.enabled }">
                {{ source.enabled ? '✓ 启用' : '✗ 禁用' }}
              </span>
              <span class="create-time text-sm text-secondary">
                {{ formatDate(source.createdAt) }}
              </span>
            </div>
          </div>
          <div class="source-actions flex gap-2">
            <button 
              @click="toggleSource(source)" 
              class="btn"
              :class="source.enabled ? 'btn-outline' : 'btn-primary'"
              :aria-label="source.enabled ? '禁用书源' : '启用书源'"
            >
              {{ source.enabled ? '禁用' : '启用' }}
            </button>
            <button @click="editSource(source)" class="btn btn-outline">
              编辑
            </button>
            <button @click="testSource(source)" class="btn btn-outline">
              测试
            </button>
            <button @click="deleteSource(source)" class="btn btn-danger">
              删除
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="sources.length === 0" class="empty-state">
          <div class="empty-icon">📡</div>
          <h3 class="empty-title">暂无书源</h3>
          <p class="empty-text">点击右上角添加按钮添加书源</p>
          <button @click="showAddDialog = true" class="btn btn-primary">
            + 添加第一个书源
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑书源对话框 -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showAddDialog" class="dialog-overlay" @click="closeDialog">
          <div class="dialog-content animate-slide-up" @click.stop>
            <header class="dialog-header">
              <h2 class="dialog-title">
                {{ editingSource ? '编辑书源' : '添加书源' }}
              </h2>
              <button class="btn-icon" @click="closeDialog" aria-label="关闭">
                ✕
              </button>
            </header>
            <form class="dialog-body" @submit.prevent="saveSource">
              <div class="form-group">
                <label class="form-label">书源名称 *</label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  class="form-input"
                  placeholder="例如：起点中文网"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">基础URL *</label>
                <input 
                  v-model="formData.baseUrl" 
                  type="url" 
                  class="form-input"
                  placeholder="例如：https://www.qidian.com"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">搜索URL模板 *</label>
                <input 
                  v-model="formData.searchUrl" 
                  type="text" 
                  class="form-input"
                  placeholder="例如：https://www.qidian.com/search?q={keyword}"
                  required
                />
                <p class="form-hint">使用 {keyword} 作为关键词占位符</p>
              </div>

              <!-- 选择器配置 -->
              <div class="form-section">
                <h3 class="form-section-title">选择器配置</h3>
                
                <div class="form-group">
                  <label class="form-label">搜索结果列表</label>
                  <input 
                    v-model="formData.selectors.searchResults" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.book-list .book-item"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">书名选择器</label>
                  <input 
                    v-model="formData.selectors.bookTitle" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.book-title"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">作者选择器</label>
                  <input 
                    v-model="formData.selectors.bookAuthor" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.book-author"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">封面选择器</label>
                  <input 
                    v-model="formData.selectors.bookCover" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.book-cover img"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">详情页URL选择器</label>
                  <input 
                    v-model="formData.selectors.bookUrl" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：a.book-link"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">章节列表选择器</label>
                  <input 
                    v-model="formData.selectors.chapters" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.chapter-list li"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">章节标题选择器</label>
                  <input 
                    v-model="formData.selectors.chapterTitle" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.chapter-title"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">章节URL选择器</label>
                  <input 
                    v-model="formData.selectors.chapterUrl" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：a.chapter-link"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">正文内容选择器</label>
                  <input 
                    v-model="formData.selectors.content" 
                    type="text" 
                    class="form-input"
                    placeholder="例如：.chapter-content"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-checkbox">
                  <input 
                    v-model="formData.enabled" 
                    type="checkbox" 
                    class="form-checkbox-input"
                  />
                  <span class="form-checkbox-label">启用此书源</span>
                </label>
              </div>
            </form>
            <footer class="dialog-footer">
              <button @click="closeDialog" class="btn btn-outline">
                取消
              </button>
              <button @click="saveSource" class="btn btn-primary">
                保存
              </button>
            </footer>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- 测试结果对话框 -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showTestResult" class="dialog-overlay" @click="showTestResult = false">
          <div class="dialog-content animate-slide-up" @click.stop style="max-width: 800px;">
            <header class="dialog-header">
              <h2 class="dialog-title">测试结果</h2>
              <button class="btn-icon" @click="showTestResult = false" aria-label="关闭">
                ✕
              </button>
            </header>
            <div class="dialog-body">
              <div v-if="testLoading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>测试中...</p>
              </div>
              <pre v-else class="test-result">{{ testResult }}</pre>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </main>
</template>

<script setup lang="ts">
/**
 * SourceView - 书源管理页面 (现代化版本)
 * 
 * 功能：
 * 1. 书源列表展示
 * 2. 添加/编辑书源
 * 3. 启用/禁用书源
 * 4. 测试书源配置
 * 5. 删除书源
 */

import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { db, type BookSource } from '@/db';
import { crawler } from '@/services/crawler';

// ============ 状态管理 ============
const router = useRouter();

// ============ 本地状态 ============
const sources = ref<BookSource[]>([]);
const showAddDialog = ref(false);
const showTestResult = ref(false);
const testLoading = ref(false);
const testResult = ref('');
const editingSource = ref<BookSource | null>(null);

// ============ 表单数据 ============
const formData = reactive({
  name: '',
  baseUrl: '',
  searchUrl: '',
  selectors: {
    searchResults: '',
    bookTitle: '',
    bookAuthor: '',
    bookCover: '',
    bookUrl: '',
    chapters: '',
    chapterTitle: '',
    chapterUrl: '',
    content: ''
  },
  enabled: true
});

// ============ 计算属性 ============
const isFormValid = computed(() => {
  return formData.name && formData.baseUrl && formData.searchUrl;
});

// ============ 生命周期 ============
onMounted(() => {
  loadSources();
});

// ============ 方法 ============

/**
 * 加载书源列表
 */
async function loadSources() {
  try {
    sources.value = await db.sources.toArray();
  } catch (error) {
    console.error('[SourceView] 加载书源失败:', error);
    alert('❌ 加载书源失败');
  }
}

/**
 * 显示添加书源对话框
 */
function showAddSource() {
  resetForm();
  showAddDialog.value = true;
}

/**
 * 编辑书源
 */
function editSource(source: BookSource) {
  editingSource.value = source;
  Object.assign(formData, source);
  showAddDialog.value = true;
}

/**
 * 重置表单
 */
function resetForm() {
  Object.assign(formData, {
    name: '',
    baseUrl: '',
    searchUrl: '',
    selectors: {
      searchResults: '',
      bookTitle: '',
      bookAuthor: '',
      bookCover: '',
      bookUrl: '',
      chapters: '',
      chapterTitle: '',
      chapterUrl: '',
      content: ''
    },
    enabled: true
  });
  editingSource.value = null;
}

/**
 * 保存书源
 */
async function saveSource() {
  if (!isFormValid.value) {
    alert('❌ 请填写必填字段');
    return;
  }

  try {
    const sourceData: Omit<BookSource, 'id'> = {
      name: formData.name,
      baseUrl: formData.baseUrl,
      searchUrl: formData.searchUrl,
      detailUrl: formData.baseUrl + '/book/{id}',
      chapterUrl: formData.baseUrl + '/book/{id}/chapters',
      contentUrl: formData.baseUrl + '/chapter/{id}',
      selectors: formData.selectors,
      enabled: formData.enabled,
      createdAt: Date.now()
    };

    if (editingSource.value) {
      // 更新现有书源
      await db.sources.update(editingSource.value.id!, sourceData);
      alert('✅ 书源更新成功！');
    } else {
      // 添加新书源
      await db.sources.add(sourceData);
      alert('✅ 书源添加成功！');
    }

    // 重新加载列表
    await loadSources();
    closeDialog();
  } catch (error) {
    console.error('[SourceView] 保存书源失败:', error);
    alert(`❌ 保存失败: ${(error as Error).message}`);
  }
}

/**
 * 关闭对话框
 */
function closeDialog() {
  showAddDialog.value = false;
  resetForm();
}

/**
 * 删除书源
 */
async function deleteSource(source: BookSource) {
  if (!confirm(`确定要删除书源 "${source.name}" 吗？`)) {
    return;
  }

  try {
    await db.sources.delete(source.id!);
    await loadSources();
    alert('✅ 书源删除成功！');
  } catch (error) {
    console.error('[SourceView] 删除书源失败:', error);
    alert(`❌ 删除失败: ${(error as Error).message}`);
  }
}

/**
 * 测试书源
 */
async function testSource(source: BookSource) {
  testLoading.value = true;
  showTestResult.value = true;
  testResult.value = '';

  try {
    // 使用示例关键词测试
    const results = await crawler.search(source, '测试');
    testResult.value = JSON.stringify(results, null, 2);
  } catch (error) {
    testResult.value = `测试失败: ${(error as Error).message}`;
  } finally {
    testLoading.value = false;
  }
}

/**
 * 切启/禁用书源
 */
async function toggleSource(source: BookSource) {
  try {
    await db.sources.update(source.id!, { enabled: !source.enabled });
    await loadSources();
  } catch (error) {
    console.error('[SourceView] 切启/禁用书源失败:', error);
    alert(`❌ 操作失败: ${(error as Error).message}`);
  }
}

/**
 * 格式化日期
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   书源管理页面布局
   ═══════════════════════════════════════════════════════════ */

.source-view {
  min-height: 100vh;
  background: var(--color-bg);
}

/* ═══════════════════════════════════════════════════════════
   顶部导航
   ═══════════════════════════════════════════════════════════ */

.source-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
  backdrop-filter: blur(8px);
}

.source-header .container {
  height: 100%;
}

.source-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   书源列表
   ═══════════════════════════════════════════════════════════ */

.source-list {
  padding: var(--space-4) 0;
}

.source-item {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  transition: all var(--duration-200) var(--ease-in-out);
}

.source-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.source-item.disabled {
  opacity: 0.6;
}

.source-info {
  margin-bottom: var(--space-4);
}

.source-name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
}

.source-url {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
}

.source-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.status-badge {
  padding: var(--space-1) var(--space-2);
  background: var(--color-success);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-badge:not(.active) {
  background: var(--color-danger);
}

.create-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.source-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* ═══════════════════════════════════════════════════════════
   空状态
   ═══════════════════════════════════════════════════════════ */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-24) var(--space-4);
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
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
  margin: 0 0 var(--space-6);
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
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
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

.dialog-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* ═══════════════════════════════════════════════════════════
   表单样式
   ═══════════════════════════════════════════════════════════ */

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-neutral-50);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--color-text);
  transition: all var(--duration-200) var(--ease-in-out);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 4px var(--color-primary-100);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
  margin-bottom: 0;
}

.form-section {
  margin: var(--space-6) 0;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.form-section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.form-checkbox-input {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  accent-color: var(--color-primary-500);
}

.form-checkbox-label {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

/* ═══════════════════════════════════════════════════════════
   测试结果
   ═══════════════════════════════════════════════════════════ */

.test-result {
  background: var(--color-neutral-50);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

/* ═══════════════════════════════════════════════════════════
   加载状态
   ═══════════════════════════════════════════════════════════ */

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-8);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-neutral-200);
  border-top-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ═══════════════════════════════════════════════════════════
   按钮样式
   ═══════════════════════════════════════════════════════════ */

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  border: none;
  transition: all var(--duration-200) var(--ease-in-out);
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
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--color-border);
  color: var(--color-text-primary);
}

.btn-outline:hover {
  background: var(--color-neutral-100);
  border-color: var(--color-neutral-300);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
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
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}

.btn-icon:hover {
  background: var(--color-neutral-100);
}

/* ═══════════════════════════════════════════════════════════
   动画
   ═══════════════════════════════════════════════════════════ */

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

@media (max-width: 768px) {
  .source-item {
    padding: var(--space-3);
  }
  
  .source-actions {
    flex-direction: column;
  }
  
  .dialog-content {
    margin: var(--space-4);
    max-width: none;
  }
  
  .dialog-body {
    padding: var(--space-4);
  }
  
  .dialog-footer {
    padding: var(--space-4);
  }
}

/* 减少动画 (无障碍) */
@media (prefers-reduced-motion: reduce) {
  .source-item,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
