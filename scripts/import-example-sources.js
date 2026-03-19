/**
 * 示例书源导入脚本
 * 
 * 使用方法：
 * 1. 打开浏览器控制台 (F12)
 * 2. 复制粘贴此脚本
 * 3. 运行后会自动添加示例书源到数据库
 * 
 * 注意：这些书源仅供学习参考，实际使用需要自行配置
 */

(async function importExampleSources() {
  console.log('[示例书源] 开始导入...');
  
  // 示例书源列表
  const exampleSources = [
    {
      name: '示例书源 - 笔趣阁',
      baseUrl: 'https://www.biquge.com',
      searchUrl: 'https://www.biquge.com/search?q={keyword}',
      detailUrl: 'https://www.biquge.com/book/{id}',
      chapterUrl: 'https://www.biquge.com/book/{id}/chapters',
      contentUrl: 'https://www.biquge.com/chapter/{id}',
      selectors: {
        searchResults: '.search-result-item',
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
    },
    {
      name: '示例书源 - 起点',
      baseUrl: 'https://www.qidian.com',
      searchUrl: 'https://www.qidian.com/search?kw={keyword}',
      detailUrl: 'https://book.qidian.com/info/{id}',
      chapterUrl: 'https://book.qidian.com/info/{id}#Catalog',
      contentUrl: 'https://vipreader.qidian.com/chapter/{id}',
      selectors: {
        searchResults: '.result-item',
        bookTitle: '.result-title',
        bookAuthor: '.result-author',
        bookCover: '.result-cover img',
        bookUrl: '.result-book-link',
        chapters: '.catalog-list li',
        chapterTitle: '.chapter-title',
        chapterUrl: '.chapter-link',
        content: '.reader-content'
      },
      enabled: false,
      createdAt: Date.now()
    }
  ];
  
  // 检查 Dexie 是否可用
  if (typeof Dexie === 'undefined') {
    console.error('[示例书源] 错误：Dexie 库未加载');
    console.error('请先访问小说阅读器网站，确保数据库已初始化');
    return;
  }
  
  try {
    // 创建数据库连接
    const db = new Dexie('NovelReader');
    db.version(1).stores({
      books: '++id, title, author, status, *tags, sourceId, createdAt, updatedAt',
      chapters: '++id, bookId, [bookId+order], url',
      progress: '++id, bookId, chapterId, lastReadAt',
      sources: '++id, name, enabled, createdAt',
      cache: '++id, url, expiredAt'
    });
    
    await db.open();
    
    // 检查是否已有书源
    const existingCount = await db.sources.count();
    if (existingCount > 0) {
      console.warn(`[示例书源] 警告：已有 ${existingCount} 个书源`);
      const confirm = window.confirm('已有书源存在，是否继续添加示例书源？');
      if (!confirm) {
        console.log('[示例书源] 已取消');
        return;
      }
    }
    
    // 添加书源
    const addedIds = await db.sources.bulkAdd(exampleSources);
    
    console.log('[示例书源] 导入成功！');
    console.log(`添加了 ${exampleSources.length} 个书源`);
    console.log('书源 ID:', addedIds);
    console.log('\n注意：示例书源默认禁用，需要手动配置选择器后启用');
    
    alert(`✅ 成功导入 ${exampleSources.length} 个示例书源！\n\n请到"书源管理"页面配置后启用`);
    
  } catch (error) {
    console.error('[示例书源] 导入失败:', error);
    alert(`❌ 导入失败：${error.message}`);
  }
})();
