/**
 * Calibre 服务
 * 用于连接 Calibre Content Server，实现图书库浏览和书籍导入
 * 
 * API 文档：https://manual.calibre-web.org/api/
 */

export interface CalibreConfig {
  baseUrl: string;
  port: number;
  username?: string;
  password?: string;
}

export interface CalibreBook {
  id: number;
  title: string;
  author: string;
  authors: string[];
  cover?: string; // 封面 URL
  tags: string[];
  series?: string;
  series_index?: number;
  pubdate?: string;
  timestamp?: string;
  languages: string[];
  formats: string[]; // 可用格式：EPUB, MOBI, AZW3, PDF 等
  comments?: string; // 书籍简介
}

export interface CalibreSearchResult {
  total: number;
  books: CalibreBook[];
}

class CalibreService {
  private config: CalibreConfig | null = null;
  private readonly STORAGE_KEY = 'calibre_config';

  /**
   * 从 localStorage 加载配置
   */
  loadConfig(): CalibreConfig | null {
    if (this.config) return this.config;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
        return this.config;
      }
    } catch (error) {
      console.error('[Calibre] 加载配置失败:', error);
    }
    return null;
  }

  /**
   * 保存配置到 localStorage
   */
  saveConfig(config: CalibreConfig): void {
    this.config = config;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('[Calibre] 保存配置失败:', error);
    }
  }

  /**
   * 清除配置
   */
  clearConfig(): void {
    this.config = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 获取 API 基础 URL
   */
  private getApiUrl(): string | null {
    if (!this.config) return null;
    return `${this.config.baseUrl}:${this.config.port}`;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) {
      return { success: false, error: '未配置 Calibre 服务器' };
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/search?limit=1`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `连接失败：${response.status} ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '网络错误' 
      };
    }
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config?.username && this.config?.password) {
      const credentials = btoa(`${this.config.username}:${this.config.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    return headers;
  }

  /**
   * 搜索书籍
   */
  async search(query: string, limit: number = 20): Promise<CalibreSearchResult> {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) {
      throw new Error('未配置 Calibre 服务器');
    }

    try {
      const url = `${baseUrl}/api/v1/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`搜索失败：${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 适配 Calibre API 响应格式
      const books: CalibreBook[] = (data.books || []).map((book: any) => this.parseBook(book));
      
      return {
        total: data.total || books.length,
        books,
      };
    } catch (error) {
      console.error('[Calibre] 搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取书籍详情
   */
  async getBookDetail(bookId: number): Promise<CalibreBook | null> {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) {
      throw new Error('未配置 Calibre 服务器');
    }

    try {
      const url = `${baseUrl}/api/v1/book/${bookId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`获取详情失败：${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseBook(data);
    } catch (error) {
      console.error('[Calibre] 获取书籍详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取书籍封面 URL
   */
  getCoverUrl(bookId: number): string | null {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) return null;
    return `${baseUrl}/api/v1/book/${bookId}/cover`;
  }

  /**
   * 获取书籍下载 URL
   */
  getDownloadUrl(bookId: number, format: string = 'EPUB'): string | null {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) return null;
    return `${baseUrl}/get/${bookId}/format/${format.toUpperCase()}`;
  }

  /**
   * 下载书籍文件
   */
  async downloadBook(bookId: number, format: string = 'EPUB'): Promise<Blob> {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) {
      throw new Error('未配置 Calibre 服务器');
    }

    try {
      const url = `${baseUrl}/get/${bookId}/format/${format.toUpperCase()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`下载失败：${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('[Calibre] 下载书籍失败:', error);
      throw error;
    }
  }

  /**
   * 解析书籍数据
   */
  private parseBook(data: any): CalibreBook {
    return {
      id: data.id || 0,
      title: data.title || '未知标题',
      author: data.authors?.[0] || '未知作者',
      authors: data.authors || [],
      cover: data.cover_url || undefined,
      tags: data.tags || [],
      series: data.series || undefined,
      series_index: data.series_index || undefined,
      pubdate: data.pubdate || undefined,
      timestamp: data.timestamp || undefined,
      languages: data.languages || ['zh'],
      formats: data.formats || [],
      comments: data.comments || undefined,
    };
  }

  /**
   * 获取所有书籍（分页）
   */
  async getBooks(page: number = 1, limit: number = 50): Promise<CalibreSearchResult> {
    const baseUrl = this.getApiUrl();
    if (!baseUrl) {
      throw new Error('未配置 Calibre 服务器');
    }

    try {
      const offset = (page - 1) * limit;
      const url = `${baseUrl}/api/v1/search?limit=${limit}&offset=${offset}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`获取书籍列表失败：${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const books: CalibreBook[] = (data.books || []).map((book: any) => this.parseBook(book));
      
      return {
        total: data.total || books.length,
        books,
      };
    } catch (error) {
      console.error('[Calibre] 获取书籍列表失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const calibreService = new CalibreService();
