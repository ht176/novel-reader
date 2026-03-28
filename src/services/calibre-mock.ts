/**
 * Calibre 模拟服务
 * 用于在没有真实 Calibre 服务器的情况下测试前端功能
 */

import { calibreService, type CalibreBook } from './calibre';

// 模拟书籍数据
const mockBooks: CalibreBook[] = [
  {
    id: 1,
    title: '三体',
    author: '刘慈欣',
    authors: ['刘慈欣'],
    tags: ['科幻', '中国文学', '硬科幻'],
    series: '三体三部曲',
    series_index: 1,
    pubdate: '2008-01-01',
    languages: ['zh'],
    formats: ['EPUB', 'MOBI', 'PDF'],
    comments: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。地球文明向宇宙发出的第一声啼鸣，以太阳为中心，以光速向宇宙深处飞驰...',
  },
  {
    id: 2,
    title: '三体 II：黑暗森林',
    author: '刘慈欣',
    authors: ['刘慈欣'],
    tags: ['科幻', '中国文学', '硬科幻'],
    series: '三体三部曲',
    series_index: 2,
    pubdate: '2008-05-01',
    languages: ['zh'],
    formats: ['EPUB', 'MOBI', 'AZW3'],
    comments: '三体问题暂时解决了，但人类发现宇宙中存在着无数的文明。每个文明都是带枪的猎人，在黑暗中潜行。这就是宇宙的黑暗森林法则。',
  },
  {
    id: 3,
    title: '三体 III：死神永生',
    author: '刘慈欣',
    authors: ['刘慈欣'],
    tags: ['科幻', '中国文学', '硬科幻'],
    series: '三体三部曲',
    series_index: 3,
    pubdate: '2010-11-01',
    languages: ['zh'],
    formats: ['EPUB', 'MOBI', 'PDF'],
    comments: '与三体文明的战争使人类第一次看到了宇宙黑暗的真相，地球文明像一个恐惧的孩子，熄灭了寻友的篝火，在暗夜中发抖。',
  },
  {
    id: 4,
    title: '活着',
    author: '余华',
    authors: ['余华'],
    tags: ['文学', '中国文学', '小说'],
    pubdate: '1993-06-01',
    languages: ['zh'],
    formats: ['EPUB', 'PDF'],
    comments: '讲述了农村人福贵悲惨的人生遭遇。福贵曾经是一个阔少爷，家境优越，但他嗜赌如命，最终输光了家产，气死了父亲。',
  },
  {
    id: 5,
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    authors: ['加西亚·马尔克斯'],
    tags: ['文学', '魔幻现实主义', '外国文学'],
    pubdate: '1967-06-01',
    languages: ['zh', 'es'],
    formats: ['EPUB', 'MOBI', 'AZW3'],
    comments: '讲述了布恩迪亚家族在一百年间，六代人因权力与情欲的轮回上演兴衰起落，第一代的老布恩迪亚在晚年被绑在树上过日子，乌尔苏拉是布恩迪亚家的女主人。',
  },
  {
    id: 6,
    title: '1984',
    author: '乔治·奥威尔',
    authors: ['乔治·奥威尔'],
    tags: ['文学', '反乌托邦', '政治小说'],
    pubdate: '1949-06-08',
    languages: ['zh', 'en'],
    formats: ['EPUB', 'MOBI', 'PDF'],
    comments: '讲述了一个处于专制极权统治下的恐怖世界。在这个世界里，老大哥在看着你，思想警察无处不在，个人自由被彻底剥夺。',
  },
  {
    id: 7,
    title: '解忧杂货店',
    author: '东野圭吾',
    authors: ['东野圭吾'],
    tags: ['小说', '日本文学', '治愈'],
    pubdate: '2012-03-01',
    languages: ['zh', 'ja'],
    formats: ['EPUB', 'MOBI'],
    comments: '僻静的街道旁有一家杂货店，只要写下烦恼投进卷帘门的投信口，第二天就会在店后的牛奶箱里得到回答。',
  },
  {
    id: 8,
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    authors: ['尤瓦尔·赫拉利'],
    tags: ['历史', '科普', '人类学'],
    pubdate: '2011-09-01',
    languages: ['zh', 'en'],
    formats: ['EPUB', 'PDF', 'MOBI'],
    comments: '从十万年前有生命迹象开始到 21 世纪资本、科技交织的人类发展史。',
  },
];

/**
 * 启用模拟模式
 * 覆盖 calibreService 的方法以返回模拟数据
 */
export function enableMockMode() {
  console.log('[Calibre Mock] 模拟模式已启用');

  // 覆盖测试连接
  calibreService.testConnection = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  };

  // 覆盖搜索
  calibreService.search = async (query: string, limit: number = 20) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const filtered = mockBooks.filter(book =>
      book.title.includes(query) ||
      book.author.includes(query) ||
      book.tags.some(tag => tag.includes(query))
    );
    
    return {
      total: filtered.length,
      books: filtered.slice(0, limit),
    };
  };

  // 覆盖获取全部书籍
  calibreService.getBooks = async (page: number = 1, limit: number = 50) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      total: mockBooks.length,
      books: mockBooks.slice(start, end),
    };
  };

  // 覆盖获取书籍详情
  calibreService.getBookDetail = async (bookId: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockBooks.find(book => book.id === bookId) || null;
  };

  // 覆盖获取封面 URL
  calibreService.getCoverUrl = (bookId: number) => {
    return `https://via.placeholder.com/300x450?text=Book+${bookId}`;
  };

  // 覆盖下载书籍
  calibreService.downloadBook = async (bookId: number, format: string = 'EPUB') => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const book = mockBooks.find(book => book.id === bookId);
    if (!book) {
      throw new Error('书籍不存在');
    }

    // 创建一个简化的 EPUB 文件（使用 JSZip 生成有效的 ZIP 结构）
    const JSZip = await import('jszip').then(m => m.default);
    const zip = new JSZip();
    
    // EPUB 必需文件
    zip.file('mimetype', 'application/epub+zip');
    zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);
    
    const oebps = zip.folder('OEBPS');
    oebps?.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${book.title}</dc:title>
    <dc:creator>${book.author}</dc:creator>
    <dc:language>zh</dc:language>
    <dc:identifier id="uid">urn:uuid:${book.id}</dc:identifier>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`);
    
    oebps?.file('chapter1.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${book.title}</title></head>
<body>
  <h1>${book.title}</h1>
  <p>作者：${book.author}</p>
  <p>${book.comments || '这是一个测试书籍文件。'}</p>
</body>
</html>`);

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    return blob;
  };

  // 覆盖保存配置
  const originalSaveConfig = calibreService.saveConfig.bind(calibreService);
  calibreService.saveConfig = (config) => {
    originalSaveConfig(config);
    console.log('[Calibre Mock] 配置已保存（模拟）', config);
  };
}

/**
 * 禁用模拟模式
 * 恢复原始方法
 */
export function disableMockMode() {
  console.log('[Calibre Mock] 模拟模式已禁用');
  // 重新加载 calibreService 以恢复原始方法
  window.location.reload();
}
