/**
 * 数据库配置 - 使用 Dexie.js (IndexedDB 封装)
 * 
 * 数据库结构说明：
 * - books: 书籍元数据表
 * - chapters: 章节内容表
 * - progress: 阅读进度表
 * - sources: 书源配置表
 * - cache: 缓存表 (网络请求结果)
 * - stats: 阅读统计表
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';

/**
 * 书籍接口定义
 */
export interface Book {
  id?: number;                // 自增 ID
  title: string;              // 书名
  author: string;             // 作者
  coverUrl?: string;          // 封面 URL
  sourceId?: number;          // 书源 ID (本地导入为 0)
  sourceUrl?: string;         // 源 URL
  localPath?: string;         // 本地文件路径
  status: 'reading' | 'completed' | 'paused'; // 阅读状态
  totalChapters: number;      // 总章节数
  createdAt: number;          // 添加时间戳
  updatedAt: number;          // 更新时间戳
  tags?: string[];            // 标签
  description?: string;       // 简介
}

/**
 * 章节接口定义
 */
export interface Chapter {
  id?: number;                // 自增 ID
  bookId: number;             // 所属书籍 ID
  title: string;              // 章节标题
  url?: string;               // 源 URL
  content?: string;           // 章节内容 (HTML 或纯文本)
  order: number;              // 章节顺序
  wordCount: number;          // 字数
  createdAt: number;          // 创建时间戳
}

/**
 * 阅读进度接口定义
 */
export interface ReadingProgress {
  id?: number;                // 自增 ID
  bookId: number;             // 书籍 ID
  chapterId: number;          // 当前章节 ID
  chapterOrder: number;       // 章节顺序
  progress: number;           // 阅读进度 (0-100)
  scrollPosition?: number;    // 滚动位置
  lastReadAt: number;         // 最后阅读时间
}

/**
 * 书源接口定义
 */
export interface BookSource {
  id?: number;                // 自增 ID
  name: string;               // 书源名称
  baseUrl: string;            // 基础 URL
  searchUrl: string;          // 搜索 URL 模板 ({keyword})
  detailUrl: string;          // 详情 URL 模板
  chapterUrl: string;         // 章节列表 URL 模板
  contentUrl: string;         // 内容 URL 模板
  selectors: SourceSelectors; // 选择器配置
  enabled: boolean;           // 是否启用
  createdAt: number;          // 创建时间戳
}

/**
 * 书源选择器配置
 */
export interface SourceSelectors {
  searchResults: string;      // 搜索结果列表选择器
  bookTitle: string;          // 书名选择器
  bookAuthor: string;         // 作者选择器
  bookCover: string;          // 封面选择器
  bookUrl: string;            // 详情页 URL 选择器
  chapters: string;           // 章节列表选择器
  chapterTitle: string;       // 章节标题选择器
  chapterUrl: string;         // 章节 URL 选择器
  content: string;            // 正文内容选择器
}

/**
 * 缓存接口定义
 */
export interface CacheItem {
  id?: number;                // 自增 ID
  url: string;                // 请求 URL
  data: any;                  // 缓存数据
  expiredAt: number;          // 过期时间戳
  createdAt: number;          // 创建时间戳
}

/**
 * 阅读统计接口定义
 */
export interface ReadingStat {
  id?: number;                // 自增 ID
  bookId: number;             // 书籍 ID
  date: string;               // 日期 (YYYY-MM-DD)
  readTime: number;           // 阅读时间（秒）
  chaptersRead: number;       // 阅读章节数
  wordsRead: number;          // 阅读字数
  createdAt: number;          // 创建时间戳
  updatedAt: number;          // 更新时间戳
}

/**
 * 小说阅读器数据库类
 * 
 * 使用方法：
 * ```typescript
 * const db = new NovelReaderDB();
 * await db.open();
 * 
 * // 添加书籍
 * await db.books.add({
 *   title: '示例小说',
 *   author: '作者名',
 *   status: 'reading',
 *   totalChapters: 100,
 *   createdAt: Date.now(),
 *   updatedAt: Date.now()
 * });
 * 
 * // 查询所有书籍
 * const books = await db.books.toArray();
 * ```
 */
export class NovelReaderDB extends Dexie {
  // 定义表
  books!: Table<Book, number>;
  chapters!: Table<Chapter, number>;
  progress!: Table<ReadingProgress, number>;
  sources!: Table<BookSource, number>;
  cache!: Table<CacheItem, number>;
  stats!: Table<ReadingStat, number>;

  constructor() {
    super('NovelReader');

    // 定义数据库版本和表结构
    this.version(2) // 更新版本号
      .stores({
        books: '++id, title, author, status, *tags, sourceId, createdAt, updatedAt',
        chapters: '++id, bookId, [bookId+order], url',
        progress: '++id, bookId, chapterId, lastReadAt',
        sources: '++id, name, enabled, createdAt',
        cache: '++id, url, expiredAt',
        stats: '++id, bookId, date' // 添加统计表
      });

    // 设置表属性 (类型提示)
    // Note: mapToClass removed for type safety
  }

  /**
   * 初始化数据库
   * 在应用启动时调用
   */
  async initialize(): Promise<void> {
    try {
      await this.open();
      console.log('[DB] 数据库初始化成功');
      
      // 初始化默认书源
      await this.initDefaultSources();
    } catch (error) {
      console.error('[DB] 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化默认书源
   * 首次使用时添加一些公开的书源
   */
  private async initDefaultSources(): Promise<void> {
    const count = await this.sources.count();
    if (count > 0) return; // 已有书源，跳过

    const defaultSources: BookSource[] = [
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
        enabled: false, // 默认禁用，需要用户配置
        createdAt: Date.now()
      }
    ];

    await this.sources.bulkAdd(defaultSources);
    console.log('[DB] 已添加默认书源');
  }

  /**
   * 清理过期缓存
   * 定期调用以释放空间
   */
  async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const expired = await this.cache.filter(item => item.expiredAt < now).toArray();
    
    if (expired.length > 0) {
      await this.cache.bulkDelete(expired.map(item => item.id!));
      console.log(`[DB] 已清理 ${expired.length} 条过期缓存`);
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    bookCount: number;
    chapterCount: number;
    sourceCount: number;
    cacheSize: number;
  }> {
    const [bookCount, chapterCount, sourceCount] = await Promise.all([
      this.books.count(),
      this.chapters.count(),
      this.sources.count()
    ]);

    const cacheItems = await this.cache.toArray();
    const cacheSize = cacheItems.reduce((size, item) => {
      return size + JSON.stringify(item.data).length;
    }, 0);

    return {
      bookCount,
      chapterCount,
      sourceCount,
      cacheSize
    };
  }
}

// 导出单例
export const db = new NovelReaderDB();
