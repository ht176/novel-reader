<template>
  <div class="settings-view">
    <header class="settings-header">
      <button class="btn-back" @click="$router.push('/')">
        ← 返回
      </button>
      <h1 class="settings-title">⚙️ 设置</h1>
      <div style="width: 60px;"></div>
    </header>

    <div class="settings-content">
      <!-- 阅读设置 -->
      <section class="settings-section">
        <h2 class="section-title">📖 阅读设置</h2>
        
        <div class="setting-item">
          <label class="setting-label">默认字体大小</label>
          <div class="button-group">
            <button 
              :class="['size-btn', { active: defaultFontSize === 14 }]"
              @click="defaultFontSize = 14"
            >
              小
            </button>
            <button 
              :class="['size-btn', { active: defaultFontSize === 16 }]"
              @click="defaultFontSize = 16"
            >
              中
            </button>
            <button 
              :class="['size-btn', { active: defaultFontSize === 18 }]"
              @click="defaultFontSize = 18"
            >
              大
            </button>
            <button 
              :class="['size-btn', { active: defaultFontSize === 20 }]"
              @click="defaultFontSize = 20"
            >
              超大
            </button>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">默认主题</label>
          <div class="button-group">
            <button 
              :class="['theme-btn', { active: defaultTheme === 'light' }]"
              @click="defaultTheme = 'light'"
            >
              ☀️ 日间
            </button>
            <button 
              :class="['theme-btn', { active: defaultTheme === 'dark' }]"
              @click="defaultTheme = 'dark'"
            >
              🌙 夜间
            </button>
            <button 
              :class="['theme-btn', { active: defaultTheme === 'sepia' }]"
              @click="defaultTheme = 'sepia'"
            >
              📜 护眼
            </button>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">默认行间距</label>
          <select v-model="defaultLineHeight" class="setting-select">
            <option :value="1.5">紧凑 (1.5)</option>
            <option :value="1.8">正常 (1.8)</option>
            <option :value="2.2">宽松 (2.2)</option>
            <option :value="2.6">超宽 (2.6)</option>
          </select>
        </div>
      </section>

      <!-- 数据管理 -->
      <section class="settings-section">
        <h2 class="section-title">💾 数据管理</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3 class="info-title">书籍统计</h3>
            <p class="info-desc">
              总书籍：{{ stats.bookCount }} 本<br>
              总章节：{{ stats.chapterCount }} 章<br>
              书源数：{{ stats.sourceCount }} 个<br>
              缓存大小：{{ formatSize(stats.cacheSize) }}
            </p>
          </div>
        </div>
        
        <div class="setting-item">
          <button @click="exportData" class="btn-setting">
            📤 导出数据
          </button>
          <p class="setting-hint">导出书籍、书源等数据到文件</p>
        </div>
        
        <div class="setting-item">
          <button @click="importData" class="btn-setting">
            📥 导入数据
          </button>
          <p class="setting-hint">从文件恢复数据</p>
          <input 
            ref="importInput"
            type="file" 
            accept=".json"
            @change="handleImport"
            style="display: none"
          />
        </div>
        
        <div class="setting-item">
          <button @click="clearCache" class="btn-setting btn-warning">
            🗑️ 清理缓存
          </button>
          <p class="setting-hint">清理过期缓存数据</p>
        </div>
        
        <div class="setting-item">
          <button @click="resetAll" class="btn-setting btn-danger">
            ⚠️ 重置所有数据
          </button>
          <p class="setting-hint">删除所有书籍、书源和进度（不可恢复）</p>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section">
        <h2 class="section-title">ℹ️ 关于</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3 class="info-title">小说阅读器</h3>
            <p class="info-desc">
              版本：v0.1.0<br>
              开发中 🚧<br>
              <br>
              一个基于 Vue 3 的跨平台小说阅读器
            </p>
          </div>
        </div>
        
        <div class="setting-item">
          <button @click="checkUpdate" class="btn-setting">
            🔍 检查更新
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SettingsView - 设置页面
 * 
 * 功能：
 * 1. 阅读偏好设置
 * 2. 数据导出/导入
 * 3. 缓存清理
 * 4. 应用信息
 */

import { ref, onMounted, watch } from 'vue';
import { db } from '@/db';

// ============ 状态 ============
const defaultFontSize = ref(16);
const defaultTheme = ref<'light' | 'dark' | 'sepia'>('light');
const defaultLineHeight = ref(1.8);
const stats = ref({
  bookCount: 0,
  chapterCount: 0,
  sourceCount: 0,
  cacheSize: 0
});
const importInput = ref<HTMLInputElement | null>(null);

// ============ 生命周期 ============
onMounted(async () => {
  loadSettings();
  await loadStats();
});

// ============ 监听设置变化 ============
watch([defaultFontSize, defaultTheme, defaultLineHeight], () => {
  saveSettings();
});

// ============ 方法 ============

/**
 * 加载设置
 */
function loadSettings() {
  const saved = localStorage.getItem('novel-reader-settings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      if (settings.fontSize) defaultFontSize.value = settings.fontSize;
      if (settings.theme) defaultTheme.value = settings.theme;
      if (settings.lineHeight) defaultLineHeight.value = settings.lineHeight;
    } catch (err) {
      console.error('[SettingsView] 加载设置失败:', err);
    }
  }
}

/**
 * 保存设置
 */
function saveSettings() {
  localStorage.setItem('novel-reader-settings', JSON.stringify({
    fontSize: defaultFontSize.value,
    theme: defaultTheme.value,
    lineHeight: defaultLineHeight.value
  }));
  console.log('[SettingsView] 设置已保存');
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const dbStats = await db.getStats();
    stats.value = dbStats;
  } catch (err) {
    console.error('[SettingsView] 加载统计失败:', err);
  }
}

/**
 * 导出数据
 */
async function exportData() {
  try {
    const data = {
      version: '1.0',
      exportDate: Date.now(),
      books: await db.books.toArray(),
      sources: await db.sources.toArray(),
      progress: await db.progress.toArray()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel-reader-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ 数据导出成功');
  } catch (err) {
    console.error('[SettingsView] 导出数据失败:', err);
    alert('❌ 导出失败');
  }
}

/**
 * 导入数据
 */
function importData() {
  importInput.value?.click();
}

/**
 * 处理导入文件
 * 
 * @param event - 文件选择事件
 */
async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  if (!confirm('导入数据将覆盖现有数据，确定继续吗？')) {
    target.value = '';
    return;
  }
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.version || !data.books) {
      throw new Error('无效的备份文件');
    }
    
    // 清空现有数据
    await db.books.clear();
    await db.sources.clear();
    await db.progress.clear();
    
    // 导入新数据
    if (data.books.length > 0) {
      await db.books.bulkAdd(data.books);
    }
    if (data.sources.length > 0) {
      await db.sources.bulkAdd(data.sources);
    }
    if (data.progress.length > 0) {
      await db.progress.bulkAdd(data.progress);
    }
    
    alert('✅ 数据导入成功');
    await loadStats();
    target.value = '';
  } catch (err) {
    console.error('[SettingsView] 导入数据失败:', err);
    alert(`❌ 导入失败：${err instanceof Error ? err.message : '未知错误'}`);
    target.value = '';
  }
}

/**
 * 清理缓存
 */
async function clearCache() {
  if (!confirm('确定要清理缓存吗？')) return;
  
  try {
    await db.cleanExpiredCache();
    await db.cache.clear();
    alert('✅ 缓存已清理');
    await loadStats();
  } catch (err) {
    console.error('[SettingsView] 清理缓存失败:', err);
    alert('❌ 清理失败');
  }
}

/**
 * 重置所有数据
 */
async function resetAll() {
  if (!confirm('⚠️ 警告：此操作将删除所有数据且不可恢复！\n\n确定要继续吗？')) return;
  if (!confirm('再次确认：所有书籍、书源和进度都将被删除！')) return;
  
  try {
    await db.books.clear();
    await db.sources.clear();
    await db.chapters.clear();
    await db.progress.clear();
    await db.cache.clear();
    
    alert('✅ 已重置所有数据');
    await loadStats();
  } catch (err) {
    console.error('[SettingsView] 重置数据失败:', err);
    alert('❌ 重置失败');
  }
}

/**
 * 检查更新
 */
function checkUpdate() {
  alert('当前已是最新版本 (v0.1.0)\n\n更多功能开发中... 🚧');
}

/**
 * 格式化文件大小
 * 
 * @param bytes - 字节数
 * @returns 格式化后的大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
</script>

<style scoped>
/**
 * 设置页面样式
 */

.settings-view {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* 顶部导航 */
.settings-header {
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

.settings-title {
  font-size: 20px;
  margin: 0;
}

/* 设置内容 */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 设置区块 */
.settings-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  margin: 0 0 20px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

/* 设置项 */
.setting-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.setting-label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.size-btn,
.theme-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.size-btn.active,
.theme-btn.active {
  border-color: #2196F3;
  background: #E3F2FD;
}

/* 选择器 */
.setting-select {
  width: 100%;
  max-width: 200px;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

/* 设置信息 */
.setting-info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.info-title {
  font-size: 16px;
  margin: 0 0 10px;
  color: #333;
}

.info-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

/* 设置按钮 */
.btn-setting {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: #2196F3;
  color: white;
  margin-bottom: 8px;
}

.btn-setting:hover {
  opacity: 0.9;
}

.btn-warning {
  background: #FF9800;
}

.btn-danger {
  background: #f44336;
}

.setting-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .settings-view {
    padding: 15px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .size-btn,
  .theme-btn {
    width: 100%;
  }
}
</style>
