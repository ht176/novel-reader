<template>
  <div class="calibre-view">
    <div class="calibre-header">
      <h1>📚 Calibre 图书库</h1>
      <p class="subtitle">连接你的 Calibre 图书服务器，导入书籍到本地书架</p>
      <div class="mock-mode-toggle">
        <label>
          <input type="checkbox" v-model="useMockMode" @change="toggleMockMode" />
          🧪 模拟模式（测试用）
        </label>
      </div>
    </div>

    <!-- 配置区域 -->
    <div class="config-section" v-if="!isConnected">
      <div class="config-card">
        <h2>🔌 配置 Calibre 服务器</h2>
        
        <div class="form-group">
          <label for="baseUrl">服务器地址</label>
          <input
            id="baseUrl"
            v-model="config.baseUrl"
            type="text"
            placeholder="http://192.168.1.8"
            class="form-input"
          />
          <small>例如：http://192.168.1.8</small>
        </div>

        <div class="form-group">
          <label for="port">端口</label>
          <input
            id="port"
            v-model.number="config.port"
            type="number"
            placeholder="8083"
            class="form-input"
          />
          <small>Calibre Content Server 默认端口：8083</small>
        </div>

        <div class="form-group">
          <label for="username">用户名（可选）</label>
          <input
            id="username"
            v-model="config.username"
            type="text"
            placeholder="留空则无需认证"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">密码（可选）</label>
          <input
            id="password"
            v-model="config.password"
            type="password"
            placeholder="留空则无需认证"
            class="form-input"
          />
        </div>

        <div class="form-actions">
          <button @click="testConnection" class="btn btn-primary" :disabled="testing">
            {{ testing ? '测试中...' : '🔍 测试连接' }}
          </button>
          <button @click="saveConfig" class="btn btn-success" :disabled="!connectionOk">
            💾 保存配置
          </button>
        </div>

        <div v-if="connectionError" class="error-message">
          ❌ {{ connectionError }}
        </div>
        <div v-if="connectionOk" class="success-message">
          ✅ 连接成功！
        </div>
      </div>
    </div>

    <!-- 已连接状态 -->
    <div v-else class="connected-section">
      <div class="toolbar">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索书籍..."
            class="search-input"
            @keyup.enter="searchBooks"
          />
          <button @click="searchBooks" class="btn btn-primary">🔍 搜索</button>
        </div>
        
        <div class="toolbar-actions">
          <button @click="loadAllBooks" class="btn btn-secondary">📖 全部书籍</button>
          <button @click="disconnect" class="btn btn-danger">🔌 断开连接</button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 搜索结果 -->
      <div v-else-if="searchResults.length > 0" class="book-grid">
        <div v-for="book in searchResults" :key="book.id" class="book-card">
          <div class="book-cover">
            <img
              v-if="book.cover"
              :src="book.cover"
              :alt="book.title"
              @error="handleImageError"
            />
            <div v-else class="no-cover">📖</div>
          </div>
          
          <div class="book-info">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">{{ book.author }}</p>
            <p v-if="book.series" class="book-series">📚 {{ book.series }} #{{ book.series_index }}</p>
            <div class="book-tags" v-if="book.tags.length > 0">
              <span v-for="tag in book.tags.slice(0, 3)" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
            <div class="book-formats">
              <span v-for="format in book.formats" :key="format" class="format-badge">
                {{ format }}
              </span>
            </div>
          </div>

          <div class="book-actions">
            <button @click="viewDetail(book)" class="btn btn-sm btn-secondary">
              📄 详情
            </button>
            <button @click="importBook(book)" class="btn btn-sm btn-primary" :disabled="importingBooks.has(book.id)">
              {{ importingBooks.has(book.id) ? '⏳ 导入中...' : '📥 导入' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>📚 暂无书籍</p>
        <p>点击"全部书籍"浏览图书库，或搜索特定书籍</p>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="currentPage <= 1" class="btn btn-sm">
          ⬅️ 上一页
        </button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage >= totalPages" class="btn btn-sm">
          下一页 ➡️
        </button>
      </div>
    </div>

    <!-- 书籍详情弹窗 -->
    <div v-if="selectedBook" class="modal-overlay" @click="selectedBook = null">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="selectedBook = null">×</button>
        
        <div class="detail-header">
          <div class="detail-cover">
            <img
              v-if="selectedBook.cover"
              :src="selectedBook.cover"
              :alt="selectedBook.title"
              @error="handleImageError"
            />
            <div v-else class="no-cover">📖</div>
          </div>
          <div class="detail-info">
            <h2>{{ selectedBook.title }}</h2>
            <p class="detail-author">作者：{{ selectedBook.author }}</p>
            <p v-if="selectedBook.series" class="detail-series">
              系列：{{ selectedBook.series }} #{{ selectedBook.series_index }}
            </p>
            <p v-if="selectedBook.pubdate" class="detail-pubdate">
              出版日期：{{ formatDate(selectedBook.pubdate) }}
            </p>
            <div class="detail-tags" v-if="selectedBook.tags.length > 0">
              <span v-for="tag in selectedBook.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
            <div class="detail-formats">
              <span>可用格式：</span>
              <span v-for="format in selectedBook.formats" :key="format" class="format-badge">
                {{ format }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="selectedBook.comments" class="detail-comments">
          <h3>简介</h3>
          <p>{{ selectedBook.comments }}</p>
        </div>

        <div class="detail-actions">
          <button @click="importBook(selectedBook)" class="btn btn-primary btn-lg">
            📥 导入到书架
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { calibreService, type CalibreBook, type CalibreConfig } from '@/services/calibre';
import { enableMockMode } from '@/services/calibre-mock';
import { useBookStore } from '@/stores/books';

const bookStore = useBookStore();

// 状态
const isConnected = ref(false);
const testing = ref(false);
const connectionOk = ref(false);
const connectionError = ref('');
const loading = ref(false);
const importingBooks = ref(new Set<number>());
const useMockMode = ref(false);

// 配置
const config = reactive<CalibreConfig>({
  baseUrl: 'http://192.168.1.8',
  port: 8083,
  username: '',
  password: '',
});

// 搜索和分页
const searchQuery = ref('');
const searchResults = ref<CalibreBook[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalResults = ref(0);
const pageSize = 20;

// 选中的书籍
const selectedBook = ref<CalibreBook | null>(null);

// 图片加载错误处理
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
};

// 格式化日期
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
};

// 加载配置
onMounted(() => {
  const savedConfig = calibreService.loadConfig();
  if (savedConfig) {
    config.baseUrl = savedConfig.baseUrl;
    config.port = savedConfig.port;
    config.username = savedConfig.username || '';
    config.password = savedConfig.password || '';
    isConnected.value = true;
  }
});

// 切换模拟模式
const toggleMockMode = () => {
  if (useMockMode.value) {
    enableMockMode();
    // 模拟模式下自动连接
    isConnected.value = true;
    connectionOk.value = true;
    alert('🧪 模拟模式已启用\n\n已加载 8 本测试书籍，可以测试搜索、浏览和导入功能');
    loadAllBooks();
  } else {
    window.location.reload();
  }
};

// 测试连接
const testConnection = async () => {
  testing.value = true;
  connectionError.value = '';
  connectionOk.value = false;

  try {
    const result = await calibreService.testConnection();
    if (result.success) {
      connectionOk.value = true;
    } else {
      connectionError.value = result.error || '连接失败';
    }
  } catch (error) {
    connectionError.value = error instanceof Error ? error.message : '连接失败';
  } finally {
    testing.value = false;
  }
};

// 保存配置
const saveConfig = () => {
  if (!config.baseUrl) {
    connectionError.value = '请输入服务器地址';
    return;
  }

  calibreService.saveConfig(config);
  isConnected.value = true;
  connectionError.value = '';
  loadAllBooks();
};

// 断开连接
const disconnect = () => {
  calibreService.clearConfig();
  isConnected.value = false;
  connectionOk.value = false;
  searchResults.value = [];
};

// 搜索书籍
const searchBooks = async () => {
  if (!searchQuery.value.trim()) {
    loadAllBooks();
    return;
  }

  loading.value = true;
  try {
    const result = await calibreService.search(searchQuery.value, pageSize);
    searchResults.value = result.books;
    totalResults.value = result.total;
    totalPages.value = Math.ceil(result.total / pageSize);
    currentPage.value = 1;
  } catch (error) {
    connectionError.value = error instanceof Error ? error.message : '搜索失败';
  } finally {
    loading.value = false;
  }
};

// 加载全部书籍
const loadAllBooks = async () => {
  loading.value = true;
  searchQuery.value = '';
  
  try {
    const result = await calibreService.getBooks(currentPage.value, pageSize);
    searchResults.value = result.books;
    totalResults.value = result.total;
    totalPages.value = Math.ceil(result.total / pageSize);
  } catch (error) {
    connectionError.value = error instanceof Error ? error.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadAllBooks();
  }
};

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadAllBooks();
  }
};

// 查看详情
const viewDetail = (book: CalibreBook) => {
  selectedBook.value = book;
};

// 导入书籍
const importBook = async (book: CalibreBook) => {
  if (importingBooks.value.has(book.id)) return;

  importingBooks.value.add(book.id);
  
  try {
    // 获取最佳格式（优先 EPUB）
    const preferredFormat = book.formats.includes('EPUB') 
      ? 'EPUB' 
      : book.formats[0];

    if (!preferredFormat) {
      throw new Error('没有可用的书籍格式');
    }

    // 下载书籍文件
    const blob = await calibreService.downloadBook(book.id, preferredFormat);
    
    // 创建 File 对象
    const file = new File([blob], `${book.title}.${preferredFormat.toLowerCase()}`, {
      type: blob.type || 'application/epub+zip',
    });

    // 导入到书架
    await bookStore.importBook(file);

    // 更新封面 URL（使用 Calibre 的封面）
    const coverUrl = calibreService.getCoverUrl(book.id);
    if (coverUrl) {
      // TODO: 更新书籍封面
      console.log('[Calibre] 封面 URL:', coverUrl);
    }

    alert(`✅ 《${book.title}》导入成功！`);
  } catch (error) {
    console.error('[Calibre] 导入失败:', error);
    alert(`❌ 导入失败：${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    importingBooks.value.delete(book.id);
  }
};
</script>

<style scoped>
.calibre-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.calibre-header {
  text-align: center;
  margin-bottom: 30px;
}

.calibre-header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.mock-mode-toggle {
  margin-top: 12px;
  font-size: 0.9rem;
}

.mock-mode-toggle label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-secondary);
}

.mock-mode-toggle input[type="checkbox"] {
  cursor: pointer;
}

/* 配置区域 */
.config-section {
  max-width: 500px;
  margin: 0 auto;
}

.config-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-card h2 {
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 8px;
  color: #ff4444;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 255, 0, 0.1);
  border-radius: 8px;
  color: #00cc00;
}

/* 已连接区域 */
.connected-section {
  margin-top: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

/* 书籍网格 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.book-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
}

.book-cover {
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover {
  font-size: 4rem;
  opacity: 0.5;
}

.book-info {
  padding: 16px;
}

.book-title {
  font-size: 1rem;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-author {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.book-series {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag {
  background: var(--accent-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.book-formats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.format-badge {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.book-actions {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 30px;
  padding: 20px;
}

.page-info {
  color: var(--text-secondary);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-primary);
}

.detail-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.detail-cover {
  width: 150px;
  flex-shrink: 0;
}

.detail-cover img {
  width: 100%;
  border-radius: 8px;
}

.detail-info h2 {
  margin-bottom: 8px;
}

.detail-author,
.detail-series,
.detail-pubdate {
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.detail-formats {
  margin-top: 12px;
  color: var(--text-secondary);
}

.detail-comments {
  margin: 24px 0;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.detail-comments h3 {
  margin-bottom: 8px;
}

.detail-comments p {
  line-height: 1.6;
  color: var(--text-secondary);
}

.detail-actions {
  text-align: center;
  margin-top: 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .detail-cover {
    width: 120px;
  }

  .toolbar {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
