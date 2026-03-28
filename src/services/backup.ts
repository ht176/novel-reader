/**
 * 数据备份和恢复服务
 * 支持导出/导入所有数据（书籍、阅读进度、设置、书源）
 */

import { db, type Book, type Chapter, type Source } from '@/db';

export interface BackupData {
  version: string; // 备份格式版本
  timestamp: number; // 备份时间
  books: Book[];
  chapters: Chapter[];
  sources: Source[];
  settings: BackupSettings;
}

export interface BackupSettings {
  theme?: string;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  [key: string]: any;
}

export interface ImportResult {
  success: boolean;
  importedBooks: number;
  importedChapters: number;
  importedSources: number;
  skippedBooks: number;
  errors: string[];
}

class BackupService {
  private readonly BACKUP_VERSION = '1.0';

  /**
   * 导出所有数据
   */
  async exportAll(): Promise<BackupData> {
    console.log('[Backup] 开始导出数据...');

    try {
      // 导出书籍
      const books = await db.books.toArray();
      console.log(`[Backup] 导出书籍：${books.length}本`);

      // 导出章节
      const chapters = await db.chapters.toArray();
      console.log(`[Backup] 导出章节：${chapters.length}章`);

      // 导出书源
      const sources = await db.sources.toArray();
      console.log(`[Backup] 导出书源：${sources.length}个`);

      // 导出设置
      const settings: BackupSettings = {
        theme: localStorage.getItem('reader-theme') || undefined,
        fontSize: localStorage.getItem('reader-fontSize') ? 
          parseInt(localStorage.getItem('reader-fontSize')!) : undefined,
        lineHeight: localStorage.getItem('reader-lineHeight') ? 
          parseFloat(localStorage.getItem('reader-lineHeight')!) : undefined,
        fontFamily: localStorage.getItem('reader-fontFamily') || undefined,
      };

      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        books,
        chapters,
        sources,
        settings,
      };

      console.log('[Backup] 导出完成');
      return backup;
    } catch (error) {
      console.error('[Backup] 导出失败:', error);
      throw error;
    }
  }

  /**
   * 导出为 JSON 文件
   */
  async exportToFile(): Promise<void> {
    const backup = await this.exportAll();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[Backup] 文件导出完成');
  }

  /**
   * 导入数据
   */
  async import(backup: BackupData, options?: ImportOptions): Promise<ImportResult> {
    console.log('[Backup] 开始导入数据...', backup);

    const result: ImportResult = {
      success: true,
      importedBooks: 0,
      importedChapters: 0,
      importedSources: 0,
      skippedBooks: 0,
      errors: [],
    };

    try {
      // 验证备份格式
      if (!this.validateBackup(backup)) {
        throw new Error('无效的备份文件格式');
      }

      // 导入书籍
      if (options?.importBooks !== false) {
        for (const book of backup.books) {
          try {
            const exists = await db.books.get(book.id);
            if (exists) {
              if (options?.onDuplicate === 'skip') {
                result.skippedBooks++;
                continue;
              } else if (options?.onDuplicate === 'overwrite') {
                await db.books.update(book.id, book);
              }
            } else {
              await db.books.add(book);
            }
            result.importedBooks++;
          } catch (error) {
            result.errors.push(`导入书籍《${book.title}》失败：${error}`);
            result.success = false;
          }
        }
      }

      // 导入章节
      if (options?.importChapters !== false) {
        for (const chapter of backup.chapters) {
          try {
            const exists = await db.chapters.get(chapter.id);
            if (!exists) {
              await db.chapters.add(chapter);
              result.importedChapters++;
            }
          } catch (error) {
            result.errors.push(`导入章节失败：${error}`);
          }
        }
      }

      // 导入书源
      if (options?.importSources !== false) {
        for (const source of backup.sources) {
          try {
            const exists = await db.sources.get(source.id);
            if (!exists) {
              await db.sources.add(source);
              result.importedSources++;
            }
          } catch (error) {
            result.errors.push(`导入书源失败：${error}`);
          }
        }
      }

      // 导入设置
      if (options?.importSettings !== false && backup.settings) {
        if (backup.settings.theme) {
          localStorage.setItem('reader-theme', backup.settings.theme);
        }
        if (backup.settings.fontSize) {
          localStorage.setItem('reader-fontSize', String(backup.settings.fontSize));
        }
        if (backup.settings.lineHeight) {
          localStorage.setItem('reader-lineHeight', String(backup.settings.lineHeight));
        }
        if (backup.settings.fontFamily) {
          localStorage.setItem('reader-fontFamily', backup.settings.fontFamily);
        }
      }

      console.log('[Backup] 导入完成:', result);
      return result;
    } catch (error) {
      console.error('[Backup] 导入失败:', error);
      result.success = false;
      result.errors.push(String(error));
      return result;
    }
  }

  /**
   * 从文件导入
   */
  async importFromFile(file: File, options?: ImportOptions): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const json = event.target?.result as string;
          const backup: BackupData = JSON.parse(json);
          const result = await this.import(backup, options);
          resolve(result);
        } catch (error) {
          reject(new Error(`文件解析失败：${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * 验证备份格式
   */
  private validateBackup(backup: BackupData): boolean {
    return (
      backup.version !== undefined &&
      backup.timestamp !== undefined &&
      Array.isArray(backup.books) &&
      Array.isArray(backup.chapters) &&
      Array.isArray(backup.sources)
    );
  }

  /**
   * 生成备份文件名
   */
  private generateFilename(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `novel-backup-${year}${month}${day}-${hours}${minutes}.json`;
  }

  /**
   * 获取备份统计信息
   */
  async getBackupStats(): Promise<BackupStats> {
    const books = await db.books.count();
    const chapters = await db.chapters.count();
    const sources = await db.sources.count();
    
    // 估算大小
    const allBooks = await db.books.toArray();
    const allChapters = await db.chapters.toArray();
    const allSources = await db.sources.toArray();
    
    const size = new Blob([JSON.stringify({
      books: allBooks,
      chapters: allChapters,
      sources: allSources
    })]).size;

    return {
      books,
      chapters,
      sources,
      sizeBytes: size,
      sizeFormatted: this.formatSize(size),
    };
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
  }

  /**
   * 创建自动备份
   */
  async createAutoBackup(): Promise<void> {
    const backup = await this.exportAll();
    const key = `auto-backup-${new Date().toDateString()}`;
    localStorage.setItem(key, JSON.stringify(backup));
    console.log('[Backup] 自动备份已创建');
  }

  /**
   * 恢复最近的自动备份
   */
  async restoreAutoBackup(): Promise<BackupData | null> {
    const today = new Date().toDateString();
    const key = `auto-backup-${today}`;
    const json = localStorage.getItem(key);
    
    if (json) {
      try {
        const backup: BackupData = JSON.parse(json);
        console.log('[Backup] 找到今日自动备份');
        return backup;
      } catch (error) {
        console.error('[Backup] 恢复自动备份失败:', error);
      }
    }
    
    return null;
  }

  /**
   * 清理旧备份
   */
  cleanupOldBackups(days: number = 7): void {
    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auto-backup-')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const backup: BackupData = JSON.parse(value);
            if (now - backup.timestamp > maxAge) {
              localStorage.removeItem(key);
              console.log(`[Backup] 清理旧备份：${key}`);
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
}

export interface ImportOptions {
  importBooks?: boolean;
  importChapters?: boolean;
  importSources?: boolean;
  importSettings?: boolean;
  onDuplicate?: 'skip' | 'overwrite';
}

export interface BackupStats {
  books: number;
  chapters: number;
  sources: number;
  sizeBytes: number;
  sizeFormatted: string;
}

// 导出单例
export const backupService = new BackupService();
