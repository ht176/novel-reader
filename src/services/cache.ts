/**
 * 缓存服务 - 优化离线阅读体验
 * 
 * 功能：
 * 1. 章节预加载（前后各 3 章）
 * 2. LRU 缓存清理策略（保留最近 50 章）
 * 3. 缓存状态管理
 * 4. 离线阅读支持
 * 
 * 使用示例：
 * ```typescript
 * const cache = new CacheService();
 * 
 * // 预加载章节
 * await cache.preloadChapters(chapters, currentChapterIndex, bookId);
 * 
 * // 获取缓存的章节内容
 * const content = await cache.getCachedChapter(bookId, chapterId);
 * 
 * // 清理缓存
 * await cache.cleanup(50); // 保留最近 50 章
 * ```
 */

import { db, type Chapter, type CacheItem } from '@/db';

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 预加载范围：前后各几章
  PRELOAD_RANGE: 3,
  // 最大缓存章节数
  MAX_CACHED_CHAPTERS: 50,
  // 缓存过期时间（毫秒）- 7 天
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000,
  // 搜索缓存时间（毫秒）- 5 分钟
  SEARCH_CACHE_EXPIRY: 5 * 60 * 1000
};

/**
 * 缓存键类型
 */
export type CacheKeyType = 
  | 'chapter'      // 章节内容
  | 'search'       // 搜索结果
  | 'bookDetail'   // 书籍详情
  | 'toc';         // 目录列表

/**
 * 缓存服务类
 */
export class CacheService {
  /**
   * 生成缓存键
   * 
   * @param type - 缓存类型
   * @param params - 参数
   * @returns 缓存键字符串
   */
  private generateKey(type: CacheKeyType, ...params: (string | number)[]): string {
    return `${type}:${params.join(':')}`;
  }

  /**
   * 缓存章节内容
   * 
   * @param bookId - 书籍 ID
   * @param chapter - 章节对象
   * @param content - 章节内容
   */
  async cacheChapter(bookId: number, chapter: Chapter, content: string): Promise<void> {
    try {
      const key = this.generateKey('chapter', bookId, chapter.id || chapter.order);
      
      const cacheItem: CacheItem = {
        url: key,
        data: {
          chapterId: chapter.id,
          bookId,
          content,
          title: chapter.title,
          order: chapter.order
        },
        expiredAt: Date.now() + CACHE_CONFIG.CACHE_EXPIRY,
        createdAt: Date.now()
      };
      
      await db.cache.put(cacheItem);
      console.log(`[Cache] 缓存章节：${chapter.title}`);
      
      // 自动清理过期缓存
      this.cleanup();
    } catch (error) {
      console.error('[Cache] 缓存章节失败:', error);
    }
  }

  /**
   * 获取缓存的章节内容
   * 
   * @param bookId - 书籍 ID
   * @param chapterId - 章节 ID
   * @returns 章节内容，如果不存在或已过期则返回 null
   */
  async getCachedChapter(bookId: number, chapterId: number): Promise<string | null> {
    try {
      const key = this.generateKey('chapter', bookId, chapterId);
      const cacheItem = await db.cache.where('url').equals(key).first();
      
      if (!cacheItem) {
        return null;
      }
      
      // 检查是否过期
      if (cacheItem.expiredAt < Date.now()) {
        await db.cache.delete(cacheItem.id!);
        return null;
      }
      
      return cacheItem.data?.content || null;
    } catch (error) {
      console.error('[Cache] 获取缓存章节失败:', error);
      return null;
    }
  }

  /**
   * 检查章节是否已缓存
   * 
   * @param bookId - 书籍 ID
   * @param chapterId - 章节 ID
   * @returns 是否已缓存
   */
  async isChapterCached(bookId: number, chapterId: number): Promise<boolean> {
    const content = await this.getCachedChapter(bookId, chapterId);
    return content !== null;
  }

  /**
   * 预加载章节（前后各 N 章）
   * 
   * @param chapters - 所有章节列表
   * @param currentChapterOrder - 当前章节顺序
   * @param bookId - 书籍 ID
   * @param loadContentFn - 加载章节内容的函数
   */
  async preloadChapters(
    chapters: Chapter[],
    currentChapterOrder: number,
    bookId: number,
    loadContentFn: (chapter: Chapter) => Promise<string>
  ): Promise<void> {
    try {
      // 计算预加载范围
      const startIndex = Math.max(0, currentChapterOrder - CACHE_CONFIG.PRELOAD_RANGE);
      const endIndex = Math.min(chapters.length - 1, currentChapterOrder + CACHE_CONFIG.PRELOAD_RANGE);
      
      // 收集需要预加载的章节
      const chaptersToPreload: Chapter[] = [];
      
      for (let i = startIndex; i <= endIndex; i++) {
        const chapter = chapters[i];
        if (chapter) {
          // 检查是否已缓存
          const isCached = await this.isChapterCached(bookId, chapter.id || i);
          if (!isCached) {
            chaptersToPreload.push(chapter);
          }
        }
      }
      
      // 并发预加载
      if (chaptersToPreload.length > 0) {
        console.log(`[Cache] 预加载 ${chaptersToPreload.length} 个章节`);
        
        await Promise.all(
          chaptersToPreload.map(async (chapter) => {
            try {
              const content = await loadContentFn(chapter);
              await this.cacheChapter(bookId, chapter, content);
            } catch (error) {
              console.warn(`[Cache] 预加载章节 ${chapter.title} 失败:`, error);
            }
          })
        );
        
        console.log(`[Cache] 预加载完成`);
      }
      
      // 清理缓存
      await this.cleanup();
    } catch (error) {
      console.error('[Cache] 预加载章节失败:', error);
    }
  }

  /**
   * LRU 缓存清理策略
   * 保留最近 N 章，删除旧的缓存
   * 
   * @param maxChapters - 最大保留章节数（默认 50）
   */
  async cleanup(maxChapters: number = CACHE_CONFIG.MAX_CACHED_CHAPTERS): Promise<void> {
    try {
      // 获取所有章节缓存
      const chapterCaches = await db.cache
        .filter(item => item.url.startsWith('chapter:'))
        .toArray();
      
      if (chapterCaches.length <= maxChapters) {
        return; // 不需要清理
      }
      
      // 按创建时间排序，保留最新的
      const sorted = chapterCaches.sort((a, b) => b.createdAt - a.createdAt);
      const toDelete = sorted.slice(maxChapters);
      
      // 删除旧缓存
      await db.cache.bulkDelete(toDelete.map(item => item.id!));
      
      console.log(`[Cache] 清理了 ${toDelete.length} 个旧缓存，保留 ${maxChapters} 个`);
    } catch (error) {
      console.error('[Cache] 清理缓存失败:', error);
    }
  }

  /**
   * 清理所有过期缓存
   */
  async cleanExpired(): Promise<void> {
    try {
      const now = Date.now();
      const expired = await db.cache.filter(item => item.expiredAt < now).toArray();
      
      if (expired.length > 0) {
        await db.cache.bulkDelete(expired.map(item => item.id!));
        console.log(`[Cache] 清理了 ${expired.length} 个过期缓存`);
      }
    } catch (error) {
      console.error('[Cache] 清理过期缓存失败:', error);
    }
  }

  /**
   * 清除指定书籍的所有缓存
   * 
   * @param bookId - 书籍 ID
   */
  async clearBookCache(bookId: number): Promise<void> {
    try {
      const bookCaches = await db.cache
        .filter(item => item.url.startsWith(`chapter:${bookId}:`))
        .toArray();
      
      if (bookCaches.length > 0) {
        await db.cache.bulkDelete(bookCaches.map(item => item.id!));
        console.log(`[Cache] 清除了书籍 ${bookId} 的 ${bookCaches.length} 个缓存`);
      }
    } catch (error) {
      console.error('[Cache] 清除书籍缓存失败:', error);
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAll(): Promise<void> {
    try {
      await db.cache.clear();
      console.log('[Cache] 已清除所有缓存');
    } catch (error) {
      console.error('[Cache] 清除所有缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   * 
   * @returns 缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalItems: number;
    chapterCount: number;
    searchCount: number;
    totalSize: number;
  }> {
    try {
      const allCaches = await db.cache.toArray();
      const chapterCount = allCaches.filter(item => item.url.startsWith('chapter:')).length;
      const searchCount = allCaches.filter(item => item.url.startsWith('search:')).length;
      
      const totalSize = allCaches.reduce((size, item) => {
        return size + JSON.stringify(item.data).length;
      }, 0);
      
      return {
        totalItems: allCaches.length,
        chapterCount,
        searchCount,
        totalSize
      };
    } catch (error) {
      console.error('[Cache] 获取缓存统计失败:', error);
      return {
        totalItems: 0,
        chapterCount: 0,
        searchCount: 0,
        totalSize: 0
      };
    }
  }

  /**
   * 检查是否离线
   * 
   * @returns 是否离线
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * 监听网络状态变化
   * 
   * @param callback - 回调函数
   * @returns 取消监听函数
   */
  onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * 缓存搜索结果
   * 
   * @param keyword - 搜索关键词
   * @param results - 搜索结果
   */
  async cacheSearchResults(keyword: string, results: any[]): Promise<void> {
    try {
      const key = this.generateKey('search', keyword.toLowerCase().trim());
      
      const cacheItem: CacheItem = {
        url: key,
        data: results,
        expiredAt: Date.now() + CACHE_CONFIG.SEARCH_CACHE_EXPIRY,
        createdAt: Date.now()
      };
      
      await db.cache.put(cacheItem);
      console.log(`[Cache] 缓存搜索结果：${keyword}`);
    } catch (error) {
      console.error('[Cache] 缓存搜索结果失败:', error);
    }
  }

  /**
   * 获取缓存的搜索结果
   * 
   * @param keyword - 搜索关键词
   * @returns 搜索结果，如果不存在或已过期则返回 null
   */
  async getCachedSearchResults(keyword: string): Promise<any[] | null> {
    try {
      const key = this.generateKey('search', keyword.toLowerCase().trim());
      const cacheItem = await db.cache.where('url').equals(key).first();
      
      if (!cacheItem) {
        return null;
      }
      
      // 检查是否过期
      if (cacheItem.expiredAt < Date.now()) {
        await db.cache.delete(cacheItem.id!);
        return null;
      }
      
      return cacheItem.data || null;
    } catch (error) {
      console.error('[Cache] 获取缓存搜索结果失败:', error);
      return null;
    }
  }
}

// 导出单例
export const cache = new CacheService();
