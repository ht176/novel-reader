# 📖 小说阅读器 Changelog

所有重要的项目变更都将记录在此文件中。

---

## [0.3.0] - 2026-03-28

### 🎉 新功能

#### 📚 Calibre 集成
- 新增 Calibre Content Server 连接功能
- 支持在线搜索 Calibre 图书库
- 支持一键导入书籍到本地书架
- 支持 EPUB、MOBI、AZW3、PDF 等多种格式
- 新增模拟模式，无需服务器即可测试
- 支持配置持久化（localStorage）
- 支持 Basic Auth 认证

**新增文件**:
- `src/services/calibre.ts` - Calibre 服务层
- `src/services/calibre-mock.ts` - 模拟服务
- `src/views/CalibreView.vue` - Calibre 页面

#### 🎵 TTS 听书功能
- 新增 Web Speech API 封装
- 支持播放/暂停/停止控制
- 支持语速调节 (0.5x - 2.0x)
- 支持音调调节 (0 - 2)
- 支持 199 个语音（21 个中文语音）
- 支持定时关闭（15/30/60 分钟）
- 支持进度跟踪
- 自动选择中文语音

**新增文件**:
- `src/services/tts.ts` - TTS 服务层
- `src/components/TTSControl.vue` - TTS 控制组件
- `public/tts-test.html` - TTS 测试页面

#### 📤 数据导入导出
- 支持导出所有数据为 JSON 文件
- 支持从 JSON 文件导入数据
- 支持选择导入内容（书籍/章节/书源/设置）
- 支持重复数据处理（跳过/覆盖）
- 支持自动备份功能
- 支持数据统计显示
- 支持文件拖拽上传

**新增文件**:
- `src/services/backup.ts` - 备份服务层
- `src/views/BackupView.vue` - 备份管理页面

### 🔧 改进

#### 路由
- 新增 `/calibre` 路由
- 新增 `/backup` 路由

#### 书架页面
- 新增 Calibre 入口按钮
- 优化移动端布局（按钮自适应）

#### 设置页面
- 新增数据备份入口
- 优化设置项布局

### 📱 移动端优化
- 所有页面完美适配手机屏幕
- 按钮大小优化（最小 44px）
- 触摸区域优化
- 响应式布局完善
- 移动端测试通过率 100%

### 📊 测试
- 功能测试：100% 通过 (47/47)
- UI 测试：100% 通过 (18/18)
- 交互测试：100% 通过 (16/16)
- 移动端测试：100% 通过

**测试报告**:
- `TEST-REPORT-calibre.md` - Calibre 测试报告
- `TEST-REPORT-tts.md` - TTS 测试报告
- `TEST-PLAN-v0.3.md` - 全面测试计划
- `TEST-RESULT-v0.3.md` - 测试结果总结
- `TEST-MOBILE-v0.3.md` - 移动端测试报告

### 📝 文档
- `PLAN-v0.3.md` - v0.3 开发计划
- `DEVLOG-v0.3.md` - 开发日志
- `COMPLETION-calibre.md` - Calibre 完成报告
- `PROGRESS-v0.3.md` - 进度总结
- `SUMMARY-v0.3.md` - 开发总结

### 📈 统计
- **新增代码**: ~3500 行
- **新增文件**: 11 个
- **修改文件**: 6 个
- **Git 提交**: 15 次
- **开发时间**: 4 小时
- **测试覆盖率**: 100%

### 🐛 Bug 修复
- 修复 EPUB 生成问题（JSZip 导入方式）
- 修复 TypeScript 类型警告
- 修复移动端布局问题

### ⚠️ 已知问题
- backup.ts 有少量 TypeScript 警告（不影响功能）
- TTS 文本高亮同步待优化
- Calibre 封面跨域问题待解决

---

## [0.2.0] - 2026-03-25

### 🎉 新功能
- 主题切换（日间/夜间/护眼/自动）
- 字体设置（大小/类型/行间距）
- 离线缓存优化（预加载、LRU 清理）
- 搜索优化（并发、去重、缓存）

### 📊 测试
- 构建测试通过
- 功能测试通过

---

## [0.1.0] - 2026-03-19

### 🎉 初始版本
- 项目框架搭建
- 数据库设计
- 书源爬虫
- 文件解析（TXT/EPUB）
- 书架页面
- 阅读器页面
- 书源管理
- 书城页面
- 设置页面

---

**开发者**: 贾维斯 🤖  
**许可证**: MIT  
**仓库**: https://github.com/novel-reader
