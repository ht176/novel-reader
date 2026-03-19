# 📖 小说阅读器

一个基于 Vue 3 的跨平台小说阅读器，支持书源搜索和本地导入。

## ✨ 特性

- 📚 **多格式支持** - TXT、EPUB 本地导入
- 🔍 **书源搜索** - 支持自定义书源，在线搜索
- 📱 **跨平台** - Web、H5、Android、iOS (Capacitor)
- 💾 **离线阅读** - 数据本地存储，无需联网
- 🎨 **自定义主题** - 日间/夜间模式，字体调整
- 📊 **书架管理** - 分类、标签、搜索
- 🔄 **进度同步** - 自动保存阅读进度

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
cd novel-reader
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建生产版本

```bash
# Web 构建
npm run build

# 预览构建结果
npm run preview
```

### 移动端打包

```bash
# 添加平台
npx cap add android
npx cap add ios

# 同步代码
npx cap sync

# 打开 IDE
npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

## 📁 项目结构

```
novel-reader/
├── src/
│   ├── components/       # 可复用组件
│   ├── views/            # 页面视图
│   ├── stores/           # Pinia 状态管理
│   ├── db/               # 数据库层 (Dexie.js)
│   ├── services/         # 服务层
│   │   ├── crawler.ts    # 书源爬虫
│   │   ├── parser.ts     # 文件解析
│   │   └── calibre.ts    # Calibre 集成 (TODO)
│   └── utils/            # 工具函数
├── public/
├── capacitor.config.ts   # Capacitor 配置
├── vite.config.ts
└── package.json
```

## 📖 使用指南

### 1. 导入本地书籍

支持 TXT 和 EPUB 格式：

```typescript
import { useBookStore } from '@/stores/books';

const bookStore = useBookStore();

// 导入文件
const file = document.querySelector('input[type="file"]').files[0];
const book = await bookStore.importBook(file);
```

### 2. 配置书源

```typescript
import { db } from '@/db';

// 添加书源
await db.sources.add({
  name: '示例书源',
  baseUrl: 'https://example.com',
  searchUrl: 'https://example.com/search?q={keyword}',
  selectors: {
    searchResults: '.book-item',
    bookTitle: '.book-title',
    bookAuthor: '.book-author',
    // ...
  },
  enabled: true
});
```

### 3. 搜索书籍

```typescript
import { crawler } from '@/services/crawler';
import { db } from '@/db';

// 获取启用的书源
const sources = await db.sources.where('enabled').equals(true).toArray();

// 搜索
const results = await Promise.all(
  sources.map(source => crawler.search(source, '诡秘之主'))
);
```

## 🔧 开发规范

详见 [DEVELOPMENT.md](./DEVELOPMENT.md)

### 代码规范要点

1. **命名规范**
   - 组件：PascalCase (`BookCard.vue`)
   - 函数：小驼峰 (`fetchBookDetail`)
   - 类：PascalCase (`CrawlerService`)

2. **注释规范**
   - 所有公共函数必须有 JSDoc 注释
   - 复杂逻辑需要有简要说明
   - 使用中文注释

3. **错误处理**
   - 统一使用 try-catch
   - 提供友好的错误提示
   - 记录详细的错误日志

## 📊 数据存储

使用 IndexedDB 存储数据：

| 表名 | 用途 | 说明 |
|------|------|------|
| `books` | 书籍元数据 | 标题、作者、状态等 |
| `chapters` | 章节内容 | 章节标题、内容 |
| `progress` | 阅读进度 | 当前章节、进度百分比 |
| `sources` | 书源配置 | 书源 URL、选择器 |
| `cache` | 缓存 | 网络请求缓存 |

## 🔌 Calibre 集成

支持接入 Calibre 图书系统（TODO）：

```typescript
import { calibreService } from '@/services/calibre';

// 配置 Calibre 服务器
calibreService.configure({
  baseUrl: 'http://192.168.1.8:8083'
});

// 获取书籍列表
const books = await calibreService.getBooks();

// 下载书籍
const book = await calibreService.downloadBook(bookId);
```

## 📱 移动端支持

使用 Capacitor 实现跨平台：

### Android

1. 安装 Android Studio
2. 配置 SDK
3. `npx cap open android`
4. 构建 APK

### iOS

1. 安装 Xcode
2. 配置开发者证书
3. `npx cap open ios`
4. 构建 IPA

## 🛠️ 技术栈

- **框架**: Vue 3.4 + TypeScript
- **构建工具**: Vite 5
- **状态管理**: Pinia
- **路由**: Vue Router
- **数据库**: Dexie.js (IndexedDB)
- **HTML 解析**: Cheerio
- **EPUB 解析**: JSZip
- **移动端**: Capacitor

## 📝 开发计划

### ✅ v0.1 (已完成)
- [x] 项目框架搭建
- [x] 数据库设计
- [x] 书源爬虫
- [x] 文件解析 (TXT/EPUB)
- [x] 书架页面
- [x] 阅读器页面
- [x] 书源管理
- [x] 书城页面 (在线搜索)
- [x] 设置页面
- [x] 数据导出/导入

### v0.2
- [ ] 主题切换
- [ ] 字体设置
- [ ] 离线缓存
- [ ] 搜索优化

### v0.3
- [ ] Calibre 集成
- [ ] 听书功能 (TTS)
- [ ] 书源市场
- [ ] 数据导出/导入

### v1.0
- [ ] 用户系统
- [ ] 云端同步
- [ ] 多端同步
- [ ] 应用商店发布

## 🤝 贡献

遵循 [开发规范](./DEVELOPMENT.md)，提交前请检查：

- [ ] 代码有完整注释
- [ ] 通过 ESLint 检查
- [ ] 功能测试通过
- [ ] 提交信息规范

## 📄 许可证

MIT License

---

**开发中** 🚧 - 由 贾维斯 🤖 开发
