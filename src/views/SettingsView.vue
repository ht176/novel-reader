<template>
  <main class="settings-view">
    <header class="settings-header">
      <div class="container flex items-center justify-between">
        <button class="btn-icon" @click="$router.push('/')" aria-label="返回">
          ←
        </button>
        <h1 class="settings-title">⚙️ 设置</h1>
        <div style="width: 40px;"></div>
      </div>
    </header>

    <div class="container">
      <div class="settings-content">
        <!-- 阅读设置 -->
        <section class="settings-section">
          <h2 class="section-title">📖 阅读设置</h2>
          
          <div class="setting-item">
            <label class="setting-label">默认字体大小</label>
            <div class="button-group">
              <button 
                v-for="size in [14, 16, 18, 20]"
                :key="size"
                :class="['size-btn', { active: defaultFontSize === size }]"
                @click="defaultFontSize = size"
              >
                {{ size === 14 ? '小' : size === 16 ? '中' : size === 18 ? '大' : '超大' }}
              </button>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">字体大小调节</label>
            <div class="font-size-controls flex items-center gap-3">
              <button @click="decreaseFontSize" class="btn btn-outline" :disabled="defaultFontSize <= 12">
                −
              </button>
              <span class="font-size-display text-center" style="min-width: 60px;">
                {{ defaultFontSize }}px
              </span>
              <button @click="increaseFontSize" class="btn btn-outline" :disabled="defaultFontSize >= 24">
                +
              </button>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">默认主题</label>
            <div class="button-group">
              <button 
                :class="['theme-btn', { active: currentTheme === 'light' }]"
                @click="setDefaultTheme('light')"
              >
                ☀️ 日间
              </button>
              <button 
                :class="['theme-btn', { active: currentTheme === 'dark' }]"
                @click="setDefaultTheme('dark')"
              >
                🌙 夜间
              </button>
              <button 
                :class="['theme-btn', { active: currentTheme === 'sepia' }]"
                @click="setDefaultTheme('sepia')"
              >
                📜 护眼
              </button>
              <button 
                :class="['theme-btn', { active: currentTheme === 'auto' }]"
                @click="setDefaultTheme('auto')"
              >
                🤖 自动
              </button>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">默认行间距</label>
            <select v-model="defaultLineHeight" class="line-height-select">
              <option value="1.5">紧凑</option>
              <option value="1.8">正常</option>
              <option value="2.2">宽松</option>
              <option value="2.6">超宽</option>
            </select>
          </div>
        </section>

        <!-- 数据管理 -->
        <section class="settings-section">
          <h2 class="section-title">💾 数据管理</h2>
          
          <div class="setting-item">
            <label class="setting-label">备份数据</label>
            <button @click="backupData" class="btn btn-primary">
              📁 备份
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">恢复数据</label>
            <input 
              ref="restoreInput"
              type="file" 
              accept=".json"
              @change="restoreData"
              class="file-input-hidden"
            />
            <button @click="triggerRestore" class="btn btn-secondary">
              📂 恢复
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">清除缓存</label>
            <button @click="clearCache" class="btn btn-danger">
              🗑️ 清除
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">清除所有数据</label>
            <button @click="confirmClearAll" class="btn btn-danger">
              🚨 全部清除
            </button>
          </div>
        </section>

        <!-- 书源管理 -->
        <section class="settings-section">
          <h2 class="section-title">🔗 书源管理</h2>
          
          <div class="setting-item">
            <label class="setting-label">手动添加书源</label>
            <button @click="openAddSourceDialog" class="btn btn-primary">
              ✏️ 新增
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">从 URL 导入</label>
            <input 
              v-model="sourceUrlInput"
              type="url" 
              placeholder="https://example.com/sources.json"
              class="url-input"
            />
            <button @click="importFromUrl" class="btn btn-primary" :disabled="!sourceUrlInput.trim()">
              🌐 导入
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">导入书源文件</label>
            <input 
              ref="importSourceInput"
              type="file" 
              accept=".json"
              @change="importSources"
              class="file-input-hidden"
            />
            <button @click="triggerImportSource" class="btn btn-secondary">
              📁 导入
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">导出书源</label>
            <button @click="exportSources" class="btn btn-secondary">
              📂 导出
            </button>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">重置默认书源</label>
            <button @click="resetDefaultSources" class="btn btn-warning">
              🔄 重置
            </button>
          </div>
        </section>

        <!-- 关于 -->
        <section class="settings-section">
          <h2 class="section-title">ℹ️ 关于</h2>
          
          <div class="about-info">
            <p class="version-info">版本: {{ version }}</p>
            <p class="author-info">开发者: 贾维斯 🤖</p>
            <p class="license-info">许可证: MIT</p>
          </div>
        </section>
      </div>
    </div>

    <!-- 新增书源对话框 -->
    <div v-if="showAddSourceDialog" class="dialog-overlay" @click="showAddSourceDialog = false">
      <div class="dialog dialog-large animate-slide-up" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">✏️ 新增书源</h2>
          <button class="btn-icon" @click="showAddSourceDialog = false">✕</button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">书源名称 *</label>
            <input v-model="newSource.name" type="text" class="form-input" placeholder="例如：起点中文" />
          </div>
          
          <div class="form-group">
            <label class="form-label">书源 URL *</label>
            <input v-model="newSource.bookSourceUrl" type="url" class="form-input" placeholder="https://www.qidian.com" />
          </div>
          
          <div class="form-group">
            <label class="form-label">搜索 URL *</label>
            <input v-model="newSource.searchUrl" type="url" class="form-input" placeholder="https://example.com/search?q={keyword}" />
            <p class="form-hint">使用 {'{keyword}'} 作为关键词占位符</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">书籍列表选择器 *</label>
            <input v-model="newSource.ruleSearch.bookList" type="text" class="form-input" placeholder=".book-list .book-item" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">书名选择器 *</label>
              <input v-model="newSource.ruleSearch.name" type="text" class="form-input" placeholder=".book-title" />
            </div>
            <div class="form-group">
              <label class="form-label">作者选择器 *</label>
              <input v-model="newSource.ruleSearch.author" type="text" class="form-input" placeholder=".book-author" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">封面选择器</label>
              <input v-model="newSource.ruleSearch.coverUrl" type="text" class="form-input" placeholder=".book-cover img" />
            </div>
            <div class="form-group">
              <label class="form-label">书籍 URL 选择器 *</label>
              <input v-model="newSource.ruleSearch.bookUrl" type="text" class="form-input" placeholder=".book-link" />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">书籍详情 - 书名选择器 *</label>
            <input v-model="newSource.ruleBookInfo.name" type="text" class="form-input" placeholder="h1.book-title" />
          </div>
          
          <div class="form-group">
            <label class="form-label">书籍详情 - 作者选择器 *</label>
            <input v-model="newSource.ruleBookInfo.author" type="text" class="form-input" placeholder=".author" />
          </div>
          
          <div class="form-group">
            <label class="form-label">章节列表选择器 *</label>
            <input v-model="newSource.ruleToc.chapterList" type="text" class="form-input" placeholder=".chapter-list li" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">章节标题选择器 *</label>
              <input v-model="newSource.ruleToc.chapterName" type="text" class="form-input" placeholder=".chapter-title" />
            </div>
            <div class="form-group">
              <label class="form-label">章节 URL 选择器 *</label>
              <input v-model="newSource.ruleToc.chapterUrl" type="text" class="form-input" placeholder=".chapter-link" />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">正文内容选择器 *</label>
            <input v-model="newSource.ruleContent.content" type="text" class="form-input" placeholder=".chapter-content" />
          </div>
          
          <div class="form-group">
            <label class="form-checkbox">
              <input v-model="newSource.enabled" type="checkbox" />
              <span>启用此书源</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showAddSourceDialog = false" class="btn btn-outline">取消</button>
          <button @click="addNewSource" class="btn btn-primary" :disabled="!validateSource()">保存</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * SettingsView - 设置页面 (现代化版本)
 * 
 * 功能：
 * 1. 阅读设置（字体、主题、行间距）
 * 2. 数据管理（备份、恢复、清除）
 * 3. 书源管理（导入、导出、重置）
 * 4. 关于信息
 */

import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/db';
import { useThemeStore, type ThemeType } from '@/stores/theme';

// ============ 状态管理 ============
const router = useRouter();

// ============ 状态管理 ============
const themeStore = useThemeStore();

// ============ 本地状态 ============
const defaultFontSize = ref<number>(16);
const defaultTheme = ref<ThemeType>('light');
const defaultLineHeight = ref<string>('1.8');
const version = ref<string>('v0.1.0');

// 文件输入引用
const restoreInput = ref<HTMLInputElement | null>(null);
const importSourceInput = ref<HTMLInputElement | null>(null);

// 书源管理状态
const sourceUrlInput = ref<string>('');
const showAddSourceDialog = ref<boolean>(false);
const newSource = ref<any>({
  name: '',
  bookSourceUrl: '',
  searchUrl: '',
  ruleSearch: {
    bookList: '',
    name: '',
    author: '',
    coverUrl: '',
    bookUrl: '',
    intro: ''
  },
  ruleBookInfo: {
    name: '',
    author: '',
    coverUrl: '',
    intro: '',
    lastChapter: ''
  },
  ruleToc: {
    chapterList: '',
    chapterName: '',
    chapterUrl: ''
  },
  ruleContent: {
    content: ''
  },
  enabled: true
});

// ============ 生命周期 ============
onMounted(() => {
  loadSettings();
});

// ============ 方法 ============

/**
 * 加载设置
 */
function loadSettings() {
  // 从 localStorage 加载设置
  const savedFontSize = localStorage.getItem('reader-fontSize');
  const savedTheme = localStorage.getItem('reader-theme');
  const savedLineHeight = localStorage.getItem('reader-lineHeight');
  
  if (savedFontSize) defaultFontSize.value = parseInt(savedFontSize);
  if (savedTheme) defaultTheme.value = savedTheme as any;
  if (savedLineHeight) defaultLineHeight.value = savedLineHeight;
}

/**
 * 保存设置
 */
function saveSettings() {
  localStorage.setItem('reader-fontSize', String(defaultFontSize.value));
  localStorage.setItem('reader-theme', defaultTheme.value);
  localStorage.setItem('reader-lineHeight', defaultLineHeight.value);
}

/**
 * 备份数据
 */
async function backupData() {
  try {
    // 导出所有数据
    const backupData = {
      timestamp: Date.now(),
      books: await db.books.toArray(),
      chapters: await db.chapters.toArray(),
      progress: await db.progress.toArray(),
      sources: await db.sources.toArray(),
      cache: await db.cache.toArray()
    };
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel-reader-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 数据备份成功！');
  } catch (error) {
    alert(`❌ 备份失败: ${(error as Error).message}`);
    console.error('[SettingsView] 备份失败:', error);
  }
}

/**
 * 恢复数据
 */
async function restoreData(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const content = await file.text();
    const data = JSON.parse(content);
    
    // 确认恢复
    if (!confirm(`确定要恢复数据吗？\n\n这将覆盖当前所有数据！`)) {
      return;
    }
    
    // 清除当前数据
    await db.transaction('rw', [
      db.books, db.chapters, db.progress, db.sources, db.cache
    ], async (tx) => {
      await Promise.all([
        db.books.clear(),
        db.chapters.clear(),
        db.progress.clear(),
        db.sources.clear(),
        db.cache.clear()
      ]);
      
      // 恢复数据
      if (data.books) await db.books.bulkPut(data.books);
      if (data.chapters) await db.chapters.bulkPut(data.chapters);
      if (data.progress) await db.progress.bulkPut(data.progress);
      if (data.sources) await db.sources.bulkPut(data.sources);
      if (data.cache) await db.cache.bulkPut(data.cache);
    });
    
    alert('✅ 数据恢复成功！请刷新页面。');
    location.reload();
  } catch (error) {
    alert(`❌ 恢复失败: ${(error as Error).message}`);
    console.error('[SettingsView] 恢复失败:', error);
  } finally {
    // 重置文件输入
    if (target) {
      target.value = '';
    }
  }
}

/**
 * 触发恢复数据输入
 */
function triggerRestore() {
  if (restoreInput.value) {
    restoreInput.value.click();
  }
}

/**
 * 清除缓存
 */
async function clearCache() {
  try {
    await db.cache.clear();
    alert('✅ 缓存清除成功！');
  } catch (error) {
    alert(`❌ 清除失败: ${(error as Error).message}`);
    console.error('[SettingsView] 清除缓存失败:', error);
  }
}

/**
 * 确认清空所有数据
 */
function confirmClearAll() {
  if (confirm('⚠️ 警告！\n\n您即将清空所有数据（书籍、章节、进度、书源等）。\n\n此操作不可逆，确定要继续吗？')) {
    clearAllData();
  }
}

/**
 * 清空所有数据
 */
async function clearAllData() {
  try {
    await db.transaction('rw', [
      db.books, db.chapters, db.progress, db.sources, db.cache
    ], async (tx) => {
      await Promise.all([
        db.books.clear(),
        db.chapters.clear(),
        db.progress.clear(),
        db.sources.clear(),
        db.cache.clear()
      ]);
    });
    
    alert('✅ 所有数据已清除！');
    // 返回首页
    router.push('/');
  } catch (error) {
    alert(`❌ 清除失败: ${(error as Error).message}`);
    console.error('[SettingsView] 清除所有数据失败:', error);
  }
}

/**
 * 打开新增书源对话框
 */
function openAddSourceDialog() {
  // 重置表单
  newSource.value = {
    name: '',
    bookSourceUrl: '',
    searchUrl: '',
    ruleSearch: {
      bookList: '',
      name: '',
      author: '',
      coverUrl: '',
      bookUrl: '',
      intro: ''
    },
    ruleBookInfo: {
      name: '',
      author: '',
      coverUrl: '',
      intro: '',
      lastChapter: ''
    },
    ruleToc: {
      chapterList: '',
      chapterName: '',
      chapterUrl: ''
    },
    ruleContent: {
      content: ''
    },
    enabled: true
  };
  showAddSourceDialog.value = true;
}

/**
 * 验证书源配置
 */
function validateSource(): boolean {
  const s = newSource.value;
  const required = [
    s.name,
    s.bookSourceUrl,
    s.searchUrl,
    s.ruleSearch.bookList,
    s.ruleSearch.name,
    s.ruleSearch.author,
    s.ruleSearch.bookUrl,
    s.ruleBookInfo.name,
    s.ruleBookInfo.author,
    s.ruleToc.chapterList,
    s.ruleToc.chapterName,
    s.ruleToc.chapterUrl,
    s.ruleContent.content
  ];
  
  return required.every(v => v && v.trim() !== '');
}

/**
 * 添加新书源
 */
async function addNewSource() {
  if (!validateSource()) {
    alert('❌ 请填写所有必填项！');
    return;
  }
  
  try {
    const source = {
      ...newSource.value,
      id: undefined,
      createdAt: Date.now(),
      lastUpdateTime: Date.now()
    };
    
    await db.sources.add(source);
    
    alert('✅ 书源添加成功！');
    showAddSourceDialog.value = false;
  } catch (error) {
    alert(`❌ 添加失败：${(error as Error).message}`);
    console.error('[SettingsView] 添加书源失败:', error);
  }
}

/**
 * 从 URL 导入书源
 */
async function importFromUrl() {
  if (!sourceUrlInput.value.trim()) {
    alert('❌ 请输入书源 URL！');
    return;
  }
  
  try {
    const response = await fetch(sourceUrlInput.value);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    let sources = JSON.parse(content);
    
    if (!Array.isArray(sources)) {
      throw new Error('书源格式错误，应为 JSON 数组');
    }
    
    // 检测并转换阅读 APP 格式
    const isLegadoFormat = sources.some((s: any) => s.bookSourceUrl || s.ruleSearch);
    if (isLegadoFormat) {
      console.log('[SettingsView] 检测到阅读 APP 格式书源，自动转换中...');
      sources = sources.map((s: any) => convertLegadoSource(s));
    }
    
    // 确认导入
    if (!confirm(`确定要导入 ${sources.length} 个书源吗？${isLegadoFormat ? '\n（已自动转换为兼容格式）' : ''}`)) {
      return;
    }
    
    // 导入书源
    await db.sources.bulkPut(sources);
    
    alert('✅ 书源导入成功！');
    sourceUrlInput.value = '';
  } catch (error) {
    alert(`❌ 导入失败：${(error as Error).message}`);
    console.error('[SettingsView] 从 URL 导入失败:', error);
  }
}

/**
 * 导入书源（支持阅读 APP 格式）
 */
async function importSources(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const content = await file.text();
    let sources = JSON.parse(content);
    
    if (!Array.isArray(sources)) {
      throw new Error('书源格式错误');
    }
    
    // 检测并转换阅读 APP 格式
    const isLegadoFormat = sources.some((s: any) => s.bookSourceUrl || s.ruleSearch);
    if (isLegadoFormat) {
      console.log('[SettingsView] 检测到阅读 APP 格式书源，自动转换中...');
      sources = sources.map((s: any) => convertLegadoSource(s));
    }
    
    // 确认导入
    if (!confirm(`确定要导入 ${sources.length} 个书源吗？${isLegadoFormat ? '\n（已自动转换为兼容格式）' : ''}`)) {
      return;
    }
    
    // 导入书源
    await db.sources.bulkPut(sources);
    
    alert('✅ 书源导入成功！');
  } catch (error) {
    alert(`❌ 导入失败：${(error as Error).message}`);
    console.error('[SettingsView] 导入书源失败:', error);
  } finally {
    // 重置文件输入
    if (target) {
      target.value = '';
    }
  }
}

/**
 * 将阅读 APP（Legado）格式转换为项目兼容格式
 */
function convertLegadoSource(legadoSource: any): any {
  const converted: any = {
    name: legadoSource.bookSourceName || legadoSource.name,
    baseUrl: legadoSource.bookSourceUrl || legadoSource.baseUrl,
    searchUrl: legadoSource.searchUrl || '',
    detailUrl: legadoSource.ruleBookInfo?.tocUrl || '',
    chapterUrl: '',
    contentUrl: '',
    enabled: legadoSource.enabled !== false,
    createdAt: legadoSource.lastUpdateTime || Date.now()
  };
  
  // 转换搜索规则
  if (legadoSource.ruleSearch) {
    converted.ruleSearch = {
      bookList: legadoSource.ruleSearch.bookList,
      name: legadoSource.ruleSearch.name,
      author: legadoSource.ruleSearch.author,
      coverUrl: legadoSource.ruleSearch.coverUrl,
      bookUrl: legadoSource.ruleSearch.bookUrl,
      intro: legadoSource.ruleSearch.intro,
      kind: legadoSource.ruleSearch.kind,
      lastChapter: legadoSource.ruleSearch.lastChapter,
      wordCount: legadoSource.ruleSearch.wordCount
    };
  }
  
  // 转换书籍信息规则
  if (legadoSource.ruleBookInfo) {
    converted.ruleBookInfo = {
      name: legadoSource.ruleBookInfo.name,
      author: legadoSource.ruleBookInfo.author,
      coverUrl: legadoSource.ruleBookInfo.coverUrl,
      intro: legadoSource.ruleBookInfo.intro,
      kind: legadoSource.ruleBookInfo.kind,
      lastChapter: legadoSource.ruleBookInfo.lastChapter,
      tocUrl: legadoSource.ruleBookInfo.tocUrl,
      wordCount: legadoSource.ruleBookInfo.wordCount
    };
  }
  
  // 转换目录规则
  if (legadoSource.ruleToc) {
    converted.ruleToc = {
      chapterList: legadoSource.ruleToc.chapterList,
      chapterName: legadoSource.ruleToc.chapterName,
      chapterUrl: legadoSource.ruleToc.chapterUrl,
      updateTime: legadoSource.ruleToc.updateTime,
      isVip: legadoSource.ruleToc.isVip
    };
  }
  
  // 转换内容规则
  if (legadoSource.ruleContent) {
    converted.ruleContent = {
      content: legadoSource.ruleContent.content,
      replace: legadoSource.ruleContent.replace
    };
  }
  
  return converted;
}

/**
 * 触发导入书源输入
 */
function triggerImportSource() {
  if (importSourceInput.value) {
    importSourceInput.value.click();
  }
}

/**
 * 导出书源
 */
async function exportSources() {
  try {
    const sources = await db.sources.toArray();
    
    if (sources.length === 0) {
      alert('❌ 暂无书源可导出');
      return;
    }
    
    const blob = new Blob([JSON.stringify(sources, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel-reader-sources-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 书源导出成功！');
  } catch (error) {
    alert(`❌ 导出失败: ${(error as Error).message}`);
    console.error('[SettingsView] 导出书源失败:', error);
  }
}

/**
 * 重置默认书源
 */
async function resetDefaultSources() {
  if (!confirm('确定要重置为默认书源吗？\n\n这将删除所有自定义书源。')) {
    return;
  }
  
  try {
    // 清除所有书源
    await db.sources.clear();
    
    // 添加默认书源
    const defaultSources = [
      {
        name: '示例书源',
        baseUrl: 'https://example.com',
        searchUrl: 'https://example.com/search?q={keyword}',
        detailUrl: 'https://example.com/book/{id}',
        chapterUrl: 'https://example.com/book/{id}/chapters',
        contentUrl: 'https://example.com/chapter/{id}',
        selectors: {
          searchResults: '.book-item',
          bookTitle: '.book-title',
          bookAuthor: '.book-author',
          bookCover: '.book-cover img',
          bookUrl: 'a.book-link',
          chapters: '.chapter-list li',
          chapterTitle: '.chapter-title',
          chapterUrl: '.chapter-link',
          content: '.chapter-content'
        },
        enabled: false,
        createdAt: Date.now()
      }
    ];
    
    await db.sources.bulkAdd(defaultSources);
    
    alert('✅ 默认书源重置成功！');
  } catch (error) {
    alert(`❌ 重置失败: ${(error as Error).message}`);
    console.error('[SettingsView] 重置默认书源失败:', error);
  }
}

/**
 * 设置默认主题
 */
function setDefaultTheme(theme: ThemeType) {
  themeStore.setTheme(theme);
}

/**
 * 减小字体大小
 */
function decreaseFontSize() {
  if (defaultFontSize.value > 12) {
    defaultFontSize.value -= 2;
  }
}

/**
 * 增大字体大小
 */
function increaseFontSize() {
  if (defaultFontSize.value < 24) {
    defaultFontSize.value += 2;
  }
}

// 计算属性
const currentTheme = computed(() => themeStore.currentTheme);

// 监听设置变化并保存
watch([defaultFontSize, defaultLineHeight], saveSettings);
</script>

<style scoped>
@import '@/assets/design-tokens.css';

/* ═══════════════════════════════════════════════════════════
   设置页面布局
   ═══════════════════════════════════════════════════════════ */

.settings-view {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: var(--space-4);
}

/* ═══════════════════════════════════════════════════════════
   顶部导航
   ═══════════════════════════════════════════════════════════ */

.settings-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: var(--header-height);
  backdrop-filter: blur(8px);
}

.settings-header .container {
  height: 100%;
}

.settings-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   设置内容区
   ═══════════════════════════════════════════════════════════ */

.settings-content {
  max-width: 800px;
  margin: var(--space-4) auto;
  padding: var(--space-4);
}

/* ═══════════════════════════════════════════════════════════
   设置区域
   ═══════════════════════════════════════════════════════════ */

.settings-section {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
  overflow: hidden;
}

.section-title {
  padding: var(--space-4) var(--space-6);
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  background: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border);
}

/* ═══════════════════════════════════════════════════════════
   设置项
   ═══════════════════════════════════════════════════════════ */

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  gap: var(--space-4);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
  flex: 1;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.size-btn,
.theme-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--color-neutral-100);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
  min-width: 60px;
  text-align: center;
}

.size-btn:hover,
.theme-btn:hover {
  background: var(--color-neutral-200);
}

.size-btn.active,
.theme-btn.active {
  background: var(--color-primary-500);
  color: white;
  border-color: var(--color-primary-500);
}

/* 行间距选择器 */
.line-height-select {
  padding: var(--space-2) var(--space-3);
  background: var(--color-neutral-100);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--color-text);
  cursor: pointer;
  min-width: 120px;
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

.btn-secondary {
  background: var(--color-neutral-100);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-neutral-200);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn-warning {
  background: var(--color-warning);
  color: white;
}

.btn-warning:hover {
  background: #f57c00;
}

/* ═══════════════════════════════════════════════════════════
   关于信息
   ═══════════════════════════════════════════════════════════ */

.about-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.version-info,
.author-info,
.license-info {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* ═══════════════════════════════════════════════════════════
   隐藏文件输入
   ═══════════════════════════════════════════════════════════ */

.file-input-hidden {
  display: none;
}

/* ═══════════════════════════════════════════════════════════
   URL 输入框
   ═══════════════════════════════════════════════════════════ */

.url-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--color-input);
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.url-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.url-input::placeholder {
  color: var(--color-text-hint);
}

/* ═══════════════════════════════════════════════════════════
   新增书源对话框
   ═══════════════════════════════════════════════════════════ */

.dialog-large {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--color-input);
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-hint);
  margin-top: var(--space-1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.form-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* ═══════════════════════════════════════════════════════════
   响应式调整
   ═══════════════════════════════════════════════════════════ */

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .setting-label {
    text-align: left;
  }
  
  .button-group {
    justify-content: stretch;
  }
  
  .size-btn,
  .theme-btn {
    flex: 1;
  }
  
  .settings-content {
    padding: var(--space-2);
  }
}

/* 减少动画 (无障碍) */
@media (prefers-reduced-motion: reduce) {
  .settings-section,
  .size-btn,
  .theme-btn,
  .btn {
    transition: none;
  }
}
</style>
