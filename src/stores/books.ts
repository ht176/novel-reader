/**
 * 书籍状态管理
 * 
 * 功能：
 * 1. 管理书架上的所有书籍
 * 2. 书籍的增删改查
 * 3. 书籍搜索和过滤
 * 
 * 使用示例：
 * ```typescript
 * const bookStore = useBookStore();
 * 
 * // 加载所有书籍
 * await bookStore.loadBooks();
 * 
 * // 添加书籍
 * await bookStore.addBook(bookData);
 * 
 * // 删除书籍
 * await bookStore.deleteBook(bookId);
 * ```
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db, type Book } from '@/db';
import { parser, type ParsedBook } from '@/services/parser';

/**
 * 书籍商店
 */
export const useBookStore = defineStore('books', () => {
  // ============ 状态 ============
  
  /**
   * 所有书籍列表
   */
  const books = ref<Book[]>([]);
  
  /**
   * 加载状态
   */
  const isLoading = ref(false);
  
  /**
   * 错误信息
   */
  const error = ref<string | null>(null);
  
  // ============ 计算属性 ============
  
  /**
   * 阅读中的书籍
   */
  const readingBooks = computed(() => {
    return books.value.filter(book => book.status === 'reading');
  });
  
  /**
   * 已完成的书籍
   */
  const completedBooks = computed(() => {
    return books.value.filter(book => book.status === 'completed');
  });
  
  /**
   * 暂停的书籍
   */
  const pausedBooks = computed(() => {
    return books.value.filter(book => book.status === 'paused');
  });
  
  /**
   * 书籍总数
   */
  const totalCount = computed(() => books.value.length);
  
  // ============ 方法 ============
  
  /**
   * 从数据库加载所有书籍
   * 
   * @returns 书籍列表
   */
  async function loadBooks(): Promise<Book[]> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const allBooks = await db.books.toArray();
      books.value = allBooks.sort((a, b) => b.updatedAt - a.updatedAt);
      console.log(`[BookStore] 已加载 ${books.value.length} 本书籍`);
      return books.value;
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载书籍失败';
      error.value = message;
      console.error('[BookStore] 加载书籍失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 添加书籍（本地导入）
   * 
   * @param file - 文件对象 (TXT/EPUB)
   * @returns 添加的书籍
   */
  async function importBook(file: File): Promise<Book> {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 解析文件
      let parsed: ParsedBook;
      const fileType = file.name.toLowerCase();
      
      if (fileType.endsWith('.txt')) {
        parsed = await parser.parseTxt(file);
      } else if (fileType.endsWith('.epub')) {
        parsed = await parser.parseEpub(file);
      } else {
        throw new Error('不支持的文件格式，仅支持 TXT 和 EPUB');
      }
      
      // 保存到数据库
      const bookId = await db.books.add(parsed.book as Book);
      
      // 保存章节
      const chapters = parsed.chapters.map(chapter => ({
        ...chapter,
        bookId: bookId!
      }));
      await db.chapters.bulkAdd(chapters);
      
      // 更新本地状态
      const newBook = { ...parsed.book, id: bookId } as Book;
      books.value.unshift(newBook);
      
      console.log(`[BookStore] 导入书籍：${newBook.title}`);
      return newBook;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入书籍失败';
      error.value = message;
      console.error('[BookStore] 导入书籍失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 添加书籍（从书源）
   * 
   * @param bookData - 书籍数据
   * @param chapters - 章节列表
   * @returns 添加的书籍
   */
  async function addBook(bookData: Partial<Book>, chapters: any[]): Promise<Book> {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 保存书籍
      const book: Book = {
        ...bookData as Book,
        status: bookData.status || 'reading',
        totalChapters: chapters.length,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const bookId = await db.books.add(book);
      
      // 保存章节
      const chapterList = chapters.map((chapter, index) => ({
        ...chapter,
        bookId: bookId!,
        order: index,
        createdAt: Date.now()
      }));
      await db.chapters.bulkAdd(chapterList);
      
      // 更新本地状态
      const newBook = { ...book, id: bookId };
      books.value.unshift(newBook);
      
      console.log(`[BookStore] 添加书籍：${newBook.title}`);
      return newBook;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加书籍失败';
      error.value = message;
      console.error('[BookStore] 添加书籍失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 更新书籍信息
   * 
   * @param bookId - 书籍 ID
   * @param updates - 更新的数据
   */
  async function updateBook(bookId: number, updates: Partial<Book>): Promise<void> {
    try {
      await db.books.update(bookId, {
        ...updates,
        updatedAt: Date.now()
      });
      
      // 更新本地状态
      const index = books.value.findIndex(b => b.id === bookId);
      if (index !== -1) {
        books.value[index] = { 
          ...books.value[index], 
          ...updates as Book, 
          updatedAt: Date.now() 
        };
      }
      
      console.log(`[BookStore] 更新书籍：${bookId}`);
    } catch (err) {
      console.error('[BookStore] 更新书籍失败:', err);
      throw err;
    }
  }
  
  /**
   * 删除书籍
   * 
   * 逻辑说明：
   * 1. 删除书籍记录
   * 2. 删除相关章节
   * 3. 删除阅读进度
   * 4. 更新本地状态
   * 
   * @param bookId - 书籍 ID
   */
  async function deleteBook(bookId: number): Promise<void> {
    try {
      // 删除书籍
      await db.books.delete(bookId);
      
      // 删除章节
      const chapters = await db.chapters.where('bookId').equals(bookId).toArray();
      await db.chapters.bulkDelete(chapters.map(c => c.id!));
      
      // 删除进度
      await db.progress.where('bookId').equals(bookId).delete();
      
      // 更新本地状态
      books.value = books.value.filter(b => b.id !== bookId);
      
      console.log(`[BookStore] 删除书籍：${bookId}`);
    } catch (err) {
      console.error('[BookStore] 删除书籍失败:', err);
      throw err;
    }
  }
  
  /**
   * 根据 ID 获取书籍
   * 
   * @param bookId - 书籍 ID
   * @returns 书籍信息
   */
  function getBookById(bookId: number): Book | undefined {
    return books.value.find(b => b.id === bookId);
  }
  
  /**
   * 搜索书籍
   * 
   * @param keyword - 搜索关键词
   * @returns 匹配的书籍列表
   */
  function searchBooks(keyword: string): Book[] {
    if (!keyword.trim()) return books.value;
    
    const lowerKeyword = keyword.toLowerCase();
    return books.value.filter(book => 
      book.title.toLowerCase().includes(lowerKeyword) ||
      book.author.toLowerCase().includes(lowerKeyword) ||
      book.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
  }
  
  /**
   * 更新书籍状态
   * 
   * @param bookId - 书籍 ID
   * @param status - 新状态
   */
  function updateBookStatus(bookId: number, status: 'reading' | 'completed' | 'paused'): void {
    updateBook(bookId, { status });
  }
  
  /**
   * 清空错误
   */
  function clearError(): void {
    error.value = null;
  }
  
  return {
    // 状态
    books,
    isLoading,
    error,
    
    // 计算属性
    readingBooks,
    completedBooks,
    pausedBooks,
    totalCount,
    
    // 方法
    loadBooks,
    importBook,
    addBook,
    updateBook,
    deleteBook,
    getBookById,
    searchBooks,
    updateBookStatus,
    clearError
  };
});
