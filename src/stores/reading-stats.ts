import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '@/db';

/**
 * 阅读统计数据接口
 */
export interface ReadingStat {
  id?: number;
  bookId: number;
  date: string; // YYYY-MM-DD
  readTime: number; // 阅读时间（秒）
  chaptersRead: number; // 阅读章节数
  wordsRead: number; // 阅读字数
  createdAt: number;
  updatedAt: number;
}

/**
 * 阅读统计 Store
 * 
 * 功能：
 * 1. 记录每日阅读数据
 * 2. 统计阅读时长
 * 3. 统计阅读章节数
 * 4. 统计阅读字数
 * 5. 生成阅读报告
 */
export const useReadingStatsStore = defineStore('reading-stats', () => {
  // 本地状态
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 记录阅读统计
   * 
   * @param bookId - 书籍 ID
   * @param readTime - 阅读时间（秒）
   * @param chaptersRead - 阅读章节数
   * @param wordsRead - 阅读字数
   */
  async function recordReading(
    bookId: number, 
    readTime: number = 0, 
    chaptersRead: number = 0, 
    wordsRead: number = 0
  ) {
    try {
      loading.value = true;
      error.value = null;
      
      const today = new Date().toISOString().split('T')[0] as string; // YYYY-MM-DD
      
      // 检查是否已有今天的记录
      const todayStat = await db.stats
        .where('bookId')
        .equals(bookId)
        .and(stat => stat.date === today)
        .first();
      
      if (todayStat) {
        // 更新现有记录
        await db.stats.update(todayStat.id!, {
          readTime: todayStat.readTime + readTime,
          chaptersRead: todayStat.chaptersRead + chaptersRead,
          wordsRead: todayStat.wordsRead + wordsRead,
          updatedAt: Date.now()
        });
      } else {
        // 创建新记录
        await db.stats.add({
          bookId,
          date: today,
          readTime,
          chaptersRead,
          wordsRead,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '记录失败';
      console.error('[ReadingStatsStore] 记录阅读统计失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取某本书的阅读统计
   * 
   * @param bookId - 书籍 ID
   * @returns 阅读统计数组
   */
  async function getBookStats(bookId: number): Promise<ReadingStat[]> {
    try {
      return await db.stats
        .where('bookId')
        .equals(bookId)
        .sortBy('date');
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取统计失败';
      console.error('[ReadingStatsStore] 获取书籍统计失败:', err);
      throw err;
    }
  }

  /**
   * 获取阅读报告
   * 
   * @param bookId - 书籍 ID
   * @param days - 天数（默认 7 天）
   * @returns 阅读报告
   */
  async function getReadingReport(bookId: number, days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const stats = await db.stats
        .where('bookId')
        .equals(bookId)
        .and(stat => {
          const statDate = new Date(stat.date);
          return statDate >= startDate && statDate <= endDate;
        })
        .sortBy('date');
      
      // 计算汇总数据
      const totalReadTime = stats.reduce((sum, stat) => sum + stat.readTime, 0);
      const totalChaptersRead = stats.reduce((sum, stat) => sum + stat.chaptersRead, 0);
      const totalWordsRead = stats.reduce((sum, stat) => sum + stat.wordsRead, 0);
      
      return {
        stats,
        summary: {
          totalReadTime,
          totalChaptersRead,
          totalWordsRead,
          avgDailyTime: totalReadTime / days,
          avgDailyChapters: totalChaptersRead / days
        }
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取报告失败';
      console.error('[ReadingStatsStore] 获取阅读报告失败:', err);
      throw err;
    }
  }

  /**
   * 获取总阅读统计
   */
  async function getTotalStats() {
    try {
      const allStats = await db.stats.toArray();
      
      const totalReadTime = allStats.reduce((sum, stat) => sum + stat.readTime, 0);
      const totalChaptersRead = allStats.reduce((sum, stat) => sum + stat.chaptersRead, 0);
      const totalWordsRead = allStats.reduce((sum, stat) => sum + stat.wordsRead, 0);
      
      // 计算阅读天数
      const uniqueDates = new Set(allStats.map(stat => stat.date));
      
      return {
        totalReadTime,
        totalChaptersRead,
        totalWordsRead,
        totalDays: uniqueDates.size
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取总统计失败';
      console.error('[ReadingStatsStore] 获取总统计失败:', err);
      throw err;
    }
  }

  return {
    // State
    loading,
    error,
    
    // Actions
    recordReading,
    getBookStats,
    getReadingReport,
    getTotalStats
  };
});