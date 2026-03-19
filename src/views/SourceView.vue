<template>
  <div class="source-view">
    <!-- 顶部导航 -->
    <header class="source-header">
      <button class="btn-back" @click="$router.push('/')">
        ← 返回
      </button>
      <h1 class="source-title">📡 书源管理</h1>
      <button @click="showAddDialog = true" class="btn-add-source">
        + 添加书源
      </button>
    </header>

    <!-- 书源列表 -->
    <div class="source-list">
      <div 
        v-for="source in sources" 
        :key="source.id"
        class="source-item"
        :class="{ disabled: !source.enabled }"
      >
        <div class="source-info">
          <h3 class="source-name">{{ source.name }}</h3>
          <p class="source-url">{{ source.baseUrl }}</p>
          <div class="source-meta">
            <span class="status-tag" :class="{ active: source.enabled }">
              {{ source.enabled ? '✓ 启用' : '✗ 禁用' }}
            </span>
            <span class="create-time">
              添加于 {{ formatDate(source.createdAt) }}
            </span>
          </div>
        </div>
        <div class="source-actions">
          <button 
            @click="toggleSource(source)" 
            class="btn-action"
            :class="source.enabled ? 'btn-disable' : 'btn-enable'"
          >
            {{ source.enabled ? '禁用' : '启用' }}
          </button>
          <button @click="editSource(source)" class="btn-action btn-edit">
            编辑
          </button>
          <button @click="testSource(source)" class="btn-action btn-test">
            测试
          </button>
          <button @click="deleteSource(source)" class="btn-action btn-delete">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="sources.length === 0" class="empty-state">
      <div class="empty-icon">📡</div>
      <h2 class="empty-title">暂无书源</h2>
      <p class="empty-text">点击"添加书源"创建第一个书源</p>
      <button @click="showAddDialog = true" class="btn-primary">
        + 添加书源
      </button>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showAddDialog || showEditDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <h2 class="dialog-title">{{ showEditDialog ? '编辑书源' : '添加书源' }}</h2>
        
        <div class="dialog-content">
          <!-- 基本信息 -->
          <div class="form-group">
            <label>书源名称 *</label>
            <input 
              v-model="formData.name"
              type="text"
              placeholder="例如：起点中文网"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>基础 URL *</label>
            <input 
              v-model="formData.baseUrl"
              type="url"
              placeholder="https://example.com"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>搜索 URL 模板 *</label>
            <input 
              v-model="formData.searchUrl"
              type="text"
              placeholder="https://example.com/search?q={keyword}"
              class="form-input"
            />
            <p class="form-hint">使用 {'{keyword}'} 作为搜索关键词占位符</p>
          </div>
          
          <div class="form-group">
            <label>书籍详情 URL 模板</label>
            <input 
              v-model="formData.detailUrl"
              type="text"
              placeholder="https://example.com/book/{id}"
              class="form-input"
            />
            <p class="form-hint">使用 {'{id}'} 作为书籍 ID 占位符</p>
          </div>
          
          <div class="form-group">
            <label>章节列表 URL 模板</label>
            <input 
              v-model="formData.chapterUrl"
              type="text"
              placeholder="https://example.com/book/{id}/chapters"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>章节内容 URL 模板</label>
            <input 
              v-model="formData.contentUrl"
              type="text"
              placeholder="https://example.com/chapter/{id}"
              class="form-input"
            />
          </div>
          
          <!-- 选择器配置 -->
          <div class="form-section">
            <h3 class="section-title">HTML 选择器配置</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>搜索结果列表</label>
                <input 
                  v-model="formData.selectors.searchResults"
                  type="text"
                  placeholder=".book-item"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>书名选择器</label>
                <input 
                  v-model="formData.selectors.bookTitle"
                  type="text"
                  placeholder=".book-title"
                  class="form-input"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>作者选择器</label>
                <input 
                  v-model="formData.selectors.bookAuthor"
                  type="text"
                  placeholder=".book-author"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>封面选择器</label>
                <input 
                  v-model="formData.selectors.bookCover"
                  type="text"
                  placeholder=".book-cover img"
                  class="form-input"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>章节列表选择器</label>
                <input 
                  v-model="formData.selectors.chapters"
                  type="text"
                  placeholder=".chapter-list li"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>章节标题选择器</label>
                <input 
                  v-model="formData.selectors.chapterTitle"
                  type="text"
                  placeholder=".chapter-title"
                  class="form-input"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>章节内容选择器</label>
                <input 
                  v-model="formData.selectors.content"
                  type="text"
                  placeholder=".chapter-content"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.enabled" type="checkbox" />
              启用此书源
            </label>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="closeDialog" class="btn-cancel">取消</button>
          <button @click="saveSource" class="btn-confirm">
            {{ showEditDialog ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 测试对话框 -->
    <div v-if="showTestDialog" class="dialog-overlay" @click="showTestDialog = false">
      <div class="dialog dialog-small" @click.stop>
        <h2 class="dialog-title">测试书源</h2>
        <div class="dialog-content">
          <div v-if="testing" class="testing">
            <div class="loading-spinner"></div>
            <p>正在测试...</p>
          </div>
          <div v-else-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
            <p class="result-icon">{{ testResult.success ? '✅' : '❌' }}</p>
            <p class="result-message">{{ testResult.message }}</p>
            <p v-if="testResult.details" class="result-details">{{ testResult.details }}</p>
          </div>
          <div class="test-input">
            <input 
              v-model="testKeyword"
              type="text"
              placeholder="输入测试关键词"
              class="form-input"
            />
            <button @click="runTest" class="btn-test-full">测试搜索</button>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showTestDialog = false" class="btn-cancel">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SourceView - 书源管理页面
 * 
 * 功能：
 * 1. 书源列表展示
 * 2. 添加/编辑/删除书源
 * 3. 启用/禁用书源
 * 4. 测试书源
 */

import { ref, onMounted } from 'vue';
import { db, type BookSource, type SourceSelectors } from '@/db';
import { crawler } from '@/services/crawler';

// ============ 状态 ============
const sources = ref<BookSource[]>([]);
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const showTestDialog = ref(false);
const testing = ref(false);
const testResult = ref<{ success: boolean; message: string; details?: string } | null>(null);
const testKeyword = ref('');
const testingSource = ref<BookSource | null>(null);

// ============ 表单数据 ============
const defaultSelectors: SourceSelectors = {
  searchResults: '.book-item',
  bookTitle: '.book-title',
  bookAuthor: '.book-author',
  bookCover: '.book-cover img',
  bookUrl: 'a.book-link',
  chapters: '.chapter-list li',
  chapterTitle: '.chapter-title',
  chapterUrl: '.chapter-link',
  content: '.chapter-content'
};

const formData = ref<BookSource>({
  id: 0,
  name: '',
  baseUrl: '',
  searchUrl: '',
  detailUrl: '',
  chapterUrl: '',
  contentUrl: '',
  selectors: { ...defaultSelectors },
  enabled: true,
  createdAt: Date.now()
});

// ============ 生命周期 ============
onMounted(async () => {
  await loadSources();
});

// ============ 方法 ============

/**
 * 加载所有书源
 */
async function loadSources() {
  try {
    sources.value = await db.sources.toArray();
  } catch (err) {
    console.error('[SourceView] 加载书源失败:', err);
  }
}

/**
 * 切换书源启用状态
 * 
 * @param source - 书源对象
 */
async function toggleSource(source: BookSource) {
  try {
    await db.sources.update(source.id!, {
      enabled: !source.enabled
    });
    source.enabled = !source.enabled;
  } catch (err) {
    console.error('[SourceView] 更新书源状态失败:', err);
    alert('操作失败');
  }
}

/**
 * 编辑书源
 * 
 * @param source - 书源对象
 */
function editSource(source: BookSource) {
  formData.value = { ...source, selectors: { ...source.selectors } };
  showEditDialog.value = true;
}

/**
 * 测试书源
 * 
 * @param source - 书源对象
 */
function testSource(source: BookSource) {
  testingSource.value = source;
  testKeyword.value = '';
  testResult.value = null;
  testing.value = false;
  showTestDialog.value = true;
}

/**
 * 运行书源测试
 */
async function runTest() {
  if (!testingSource.value) return;
  
  if (!testKeyword.value.trim()) {
    testResult.value = {
      success: false,
      message: '请输入测试关键词'
    };
    return;
  }
  
  testing.value = true;
  testResult.value = null;
  
  try {
    const results = await crawler.search(testingSource.value, testKeyword.value);
    
    if (results.length > 0) {
      testResult.value = {
        success: true,
        message: `搜索成功！找到 ${results.length} 本书`,
        details: results.slice(0, 3).map(r => `• ${r.title} - ${r.author}`).join('\n')
      };
    } else {
      testResult.value = {
        success: false,
        message: '搜索成功但未找到结果',
        details: '可能原因：关键词不匹配或书源选择器配置有误'
      };
    }
  } catch (err) {
    testResult.value = {
      success: false,
      message: '搜索失败',
      details: err instanceof Error ? err.message : '未知错误'
    };
  } finally {
    testing.value = false;
  }
}

/**
 * 删除书源
 * 
 * @param source - 书源对象
 */
async function deleteSource(source: BookSource) {
  if (!confirm(`确定要删除书源"${source.name}"吗？`)) return;
  
  try {
    await db.sources.delete(source.id!);
    sources.value = sources.value.filter(s => s.id !== source.id);
  } catch (err) {
    console.error('[SourceView] 删除书源失败:', err);
    alert('删除失败');
  }
}

/**
 * 保存书源（新增/编辑）
 */
async function saveSource() {
  // 验证必填字段
  if (!formData.value.name.trim() || !formData.value.baseUrl.trim() || !formData.value.searchUrl.trim()) {
    alert('请填写必填字段（书名、基础 URL、搜索 URL）');
    return;
  }
  
  try {
    if (showEditDialog.value && formData.value.id) {
      // 更新
      await db.sources.update(formData.value.id, formData.value);
    } else {
      // 新增
      formData.value.createdAt = Date.now();
      await db.sources.add(formData.value);
    }
    
    await loadSources();
    closeDialog();
    alert('✅ 保存成功');
  } catch (err) {
    console.error('[SourceView] 保存书源失败:', err);
    alert(`保存失败：${err instanceof Error ? err.message : '未知错误'}`);
  }
}

/**
 * 关闭对话框
 */
function closeDialog() {
  showAddDialog.value = false;
  showEditDialog.value = false;
  showTestDialog.value = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  formData.value = {
    id: 0,
    name: '',
    baseUrl: '',
    searchUrl: '',
    detailUrl: '',
    chapterUrl: '',
    contentUrl: '',
    selectors: { ...defaultSelectors },
    enabled: true,
    createdAt: Date.now()
  };
}

/**
 * 格式化日期
 * 
 * @param timestamp - 时间戳
 * @returns 格式化后的日期字符串
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}
</script>

<style scoped>
/**
 * 书源管理页面样式
 */

.source-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* 顶部导航 */
.source-header {
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

.source-title {
  font-size: 20px;
  margin: 0;
}

.btn-add-source {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-add-source:hover {
  background: #45a049;
}

/* 书源列表 */
.source-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.source-item.disabled {
  opacity: 0.6;
}

.source-info {
  flex: 1;
}

.source-name {
  font-size: 18px;
  margin: 0 0 8px;
  color: #333;
}

.source-url {
  font-size: 13px;
  color: #999;
  margin: 0 0 10px;
  word-break: break-all;
}

.source-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-tag {
  padding: 4px 10px;
  background: #f5f5f5;
  color: #999;
  border-radius: 12px;
  font-size: 12px;
}

.status-tag.active {
  background: #E8F5E9;
  color: #388E3C;
}

.create-time {
  font-size: 12px;
  color: #bbb;
}

.source-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: #f0f0f0;
  color: #333;
}

.btn-action:hover {
  opacity: 0.8;
}

.btn-enable {
  background: #4CAF50;
  color: white;
}

.btn-disable {
  background: #FF9800;
  color: white;
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-test {
  background: #9C27B0;
  color: white;
}

.btn-delete {
  background: #f44336;
  color: white;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 20px;
  color: #666;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
}

.btn-primary {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
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
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-small {
  max-width: 500px;
}

.dialog-title {
  margin: 0 0 20px;
  font-size: 20px;
  color: #333;
}

/* 表单样式 */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #2196F3;
}

.form-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.form-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  margin: 0 0 15px;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

/* 对话框操作 */
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

/* 测试对话框 */
.testing {
  text-align: center;
  padding: 20px;
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

.test-result {
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.test-result.success {
  background: #E8F5E9;
  color: #2E7D32;
}

.test-result.error {
  background: #FFEBEE;
  color: #C62828;
}

.result-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.result-message {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.result-details {
  font-size: 14px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.test-input {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.test-input .form-input {
  flex: 1;
}

.btn-test-full {
  padding: 10px 20px;
  background: #9C27B0;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .source-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .source-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .btn-action {
    flex: 1;
    min-width: 60px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
