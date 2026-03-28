<template>
  <div class="backup-view">
    <div class="backup-header">
      <h1>📤 数据备份</h1>
      <p class="subtitle">导出和导入您的阅读数据</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">{{ stats.books }}</div>
        <div class="stat-label">📚 书籍</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.chapters }}</div>
        <div class="stat-label">📑 章节</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.sources }}</div>
        <div class="stat-label">🔗 书源</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.sizeFormatted }}</div>
        <div class="stat-label">💾 大小</div>
      </div>
    </div>

    <!-- 导出功能 -->
    <section class="backup-section">
      <h2>📥 导出数据</h2>
      <p class="section-desc">将所有数据导出为 JSON 文件，用于备份或迁移</p>
      
      <div class="export-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.books" />
          <span>📚 书籍信息</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.chapters" />
          <span>📑 章节内容</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.sources" />
          <span>🔗 书源配置</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportOptions.settings" />
          <span>⚙️ 阅读设置</span>
        </label>
      </div>

      <button @click="exportData" class="btn btn-primary btn-lg" :disabled="exporting">
        {{ exporting ? '⏳ 导出中...' : '📥 导出备份' }}
      </button>
    </section>

    <!-- 导入功能 -->
    <section class="backup-section">
      <h2>📤 导入数据</h2>
      <p class="section-desc">从备份文件恢复数据</p>
      
      <div class="import-area" @dragover.prevent @drop.prevent="handleDrop">
        <input 
          ref="fileInput"
          type="file" 
          accept=".json"
          @change="handleFileSelect"
          class="file-input"
        />
        <div class="import-placeholder" @click="$refs.fileInput.click()">
          <div class="import-icon">📁</div>
          <p>点击选择文件或拖拽到此处</p>
          <p class="import-hint">支持 .json 格式的备份文件</p>
        </div>
      </div>

      <div v-if="importFile" class="import-file-info">
        <div class="file-name">📄 {{ importFile.name }}</div>
        <div class="file-size">大小：{{ formatFileSize(importFile.size) }}</div>
      </div>

      <div v-if="importPreview" class="import-preview">
        <h3>📋 导入预览</h3>
        <div class="preview-stats">
          <div class="preview-item">
            <span class="preview-label">书籍:</span>
            <span class="preview-value">{{ importPreview.books }} 本</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">章节:</span>
            <span class="preview-value">{{ importPreview.chapters }} 章</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">书源:</span>
            <span class="preview-value">{{ importPreview.sources }} 个</span>
          </div>
        </div>

        <div class="import-options">
          <h4>导入选项</h4>
          <label class="checkbox-label">
            <input type="checkbox" v-model="importOptions.books" />
            <span>📚 导入书籍</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="importOptions.chapters" />
            <span>📑 导入章节</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="importOptions.sources" />
            <span>🔗 导入书源</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="importOptions.settings" />
            <span>⚙️ 导入设置</span>
          </label>
        </div>

        <div class="duplicate-options">
          <h4>重复数据处理</h4>
          <label class="radio-label">
            <input type="radio" value="skip" v-model="importOptions.onDuplicate" />
            <span>跳过已存在的书籍</span>
          </label>
          <label class="radio-label">
            <input type="radio" value="overwrite" v-model="importOptions.onDuplicate" />
            <span>覆盖已存在的书籍</span>
          </label>
        </div>
      </div>

      <button 
        v-if="importFile" 
        @click="importData" 
        class="btn btn-success btn-lg"
        :disabled="importing"
      >
        {{ importing ? '⏳ 导入中...' : '📤 确认导入' }}
      </button>
    </section>

    <!-- 自动备份 -->
    <section class="backup-section">
      <h2>🔄 自动备份</h2>
      <p class="section-desc">系统会自动创建备份，防止数据丢失</p>
      
      <div class="auto-backup-info">
        <div v-if="lastAutoBackup" class="backup-time">
          最近自动备份：{{ formatTime(lastAutoBackup) }}
        </div>
        <button @click="createAutoBackup" class="btn btn-secondary" :disabled="creatingBackup">
          {{ creatingBackup ? '⏳ 创建中...' : '🔄 立即备份' }}
        </button>
      </div>
    </section>

    <!-- 结果提示 -->
    <transition name="fade">
      <div v-if="resultMessage" :class="['result-message', resultType]">
        {{ resultMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { backupService, type BackupStats, type ImportOptions } from '@/services/backup';

// 统计信息
const stats = ref<BackupStats>({
  books: 0,
  chapters: 0,
  sources: 0,
  sizeBytes: 0,
  sizeFormatted: '0 B',
});

// 导出选项
const exportOptions = reactive({
  books: true,
  chapters: true,
  sources: true,
  settings: true,
});

// 导入状态
const importing = ref(false);
const exporting = ref(false);
const creatingBackup = ref(false);
const importFile = ref<File | null>(null);
const importPreview = ref<{ books: number; chapters: number; sources: number } | null>(null);

// 导入选项
const importOptions = ref<ImportOptions>({
  importBooks: true,
  importChapters: true,
  importSources: true,
  importSettings: true,
  onDuplicate: 'skip',
});

// 自动备份
const lastAutoBackup = ref<number | null>(null);

// 结果提示
const resultMessage = ref<string>('');
const resultType = ref<'success' | 'error'>('success');

// 加载统计信息
onMounted(async () => {
  await loadStats();
  await checkAutoBackup();
});

// 加载统计
async function loadStats() {
  stats.value = await backupService.getBackupStats();
}

// 检查自动备份
async function checkAutoBackup() {
  const backup = await backupService.restoreAutoBackup();
  if (backup) {
    lastAutoBackup.value = backup.timestamp;
  }
}

// 导出数据
async function exportData() {
  exporting.value = true;
  try {
    await backupService.exportToFile();
    showResult('✅ 导出成功！', 'success');
  } catch (error) {
    showResult(`❌ 导出失败：${error}`, 'error');
  } finally {
    exporting.value = false;
  }
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await loadFile(file);
  }
}

// 处理拖拽
async function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file && file.type === 'application/json') {
    await loadFile(file);
  }
}

// 加载文件
async function loadFile(file: File) {
  importFile.value = file;
  
  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    
    importPreview.value = {
      books: backup.books?.length || 0,
      chapters: backup.chapters?.length || 0,
      sources: backup.sources?.length || 0,
    };
  } catch (error) {
    showResult(`❌ 文件解析失败：${error}`, 'error');
    importFile.value = null;
    importPreview.value = null;
  }
}

// 导入数据
async function importData() {
  if (!importFile.value) return;

  importing.value = true;
  try {
    const result = await backupService.importFromFile(importFile.value, importOptions.value);
    
    if (result.success) {
      showResult(
        `✅ 导入成功！书籍：${result.importedBooks}本，章节：${result.importedChapters}章，书源：${result.importedSources}个`,
        'success'
      );
      await loadStats();
      resetImport();
    } else {
      showResult(`⚠️ 导入完成但有错误：${result.errors.join(', ')}`, 'error');
    }
  } catch (error) {
    showResult(`❌ 导入失败：${error}`, 'error');
  } finally {
    importing.value = false;
  }
}

// 创建自动备份
async function createAutoBackup() {
  creatingBackup.value = true;
  try {
    await backupService.createAutoBackup();
    lastAutoBackup.value = Date.now();
    showResult('✅ 自动备份已创建', 'success');
  } catch (error) {
    showResult(`❌ 备份失败：${error}`, 'error');
  } finally {
    creatingBackup.value = false;
  }
}

// 重置导入
function resetImport() {
  importFile.value = null;
  importPreview.value = null;
  const fileInput = document.querySelector('.file-input') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

// 显示结果
function showResult(message: string, type: 'success' | 'error') {
  resultMessage.value = message;
  resultType.value = type;
  setTimeout(() => {
    resultMessage.value = '';
  }, 5000);
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.backup-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.backup-header {
  text-align: center;
  margin-bottom: 30px;
}

.backup-header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
}

/* 统计卡片 */
.stats-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 区块 */
.backup-section {
  margin-bottom: 30px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.backup-section h2 {
  margin-bottom: 8px;
  font-size: 1.3rem;
}

.section-desc {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

/* 导出选项 */
.export-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  cursor: pointer;
}

/* 导入区域 */
.import-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.import-area:hover {
  border-color: var(--accent-color);
  background: rgba(0, 0, 0, 0.02);
}

.file-input {
  display: none;
}

.import-placeholder {
  color: var(--text-secondary);
}

.import-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.import-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 8px;
}

.import-file-info {
  margin: 16px 0;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.file-size {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* 导入预览 */
.import-preview {
  margin: 20px 0;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.import-preview h3 {
  margin-bottom: 16px;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.preview-label {
  color: var(--text-secondary);
}

.preview-value {
  font-weight: 500;
  color: var(--accent-color);
}

.import-options,
.duplicate-options {
  margin-top: 20px;
}

.import-options h4,
.duplicate-options h4 {
  margin-bottom: 12px;
  font-size: 1rem;
}

.radio-label {
  display: block;
  margin: 8px 0;
  cursor: pointer;
}

.radio-label input {
  margin-right: 8px;
}

/* 自动备份 */
.auto-backup-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.backup-time {
  color: var(--text-secondary);
}

/* 结果提示 */
.result-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.result-message.success {
  background: #4CAF50;
  color: white;
}

.result-message.error {
  background: #f44336;
  color: white;
}

/* 按钮 */
.btn-lg {
  padding: 12px 32px;
  font-size: 1rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-card {
    grid-template-columns: repeat(2, 1fr);
  }

  .export-options {
    grid-template-columns: 1fr;
  }

  .preview-stats {
    grid-template-columns: 1fr;
  }

  .auto-backup-info {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
