# 🎨 设计系统文档

现代化设计系统，基于 CSS 变量、容器查询和流体排版。

## 📦 核心理念

1. **优雅响应** - 使用容器查询而非媒体查询
2. **流体设计** - 字体和间距自动适应屏幕
3. **暗黑模式** - 自动支持系统主题
4. **无障碍优先** - 减少动画、焦点可见
5. **性能优化** - CSS 变量复用、减少重绘

---

## 🎯 设计令牌

### 颜色系统

```css
/* 主色调 - 蓝色系 */
--color-primary-500: #2196F3;

/* 语义色 */
--color-success: #4CAF50;
--color-warning: #FF9800;
--color-danger: #f44336;

/* 中性色 */
--color-neutral-100 ~ --color-neutral-900;

/* 语义色 (自动适配暗黑模式) */
--color-bg: 背景色
--color-surface: 表面色
--color-text: 文字颜色
```

### 间距系统 (4px 基准)

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px
```

### 流体字体

```css
--text-xs: clamp(0.75rem, 0.6875rem + 0.3125vw, 0.875rem);
--text-sm: clamp(0.875rem, 0.8125rem + 0.3125vw, 1rem);
--text-base: clamp(1rem, 0.9375rem + 0.3125vw, 1.125rem);
--text-lg: clamp(1.125rem, 1.0625rem + 0.3125vw, 1.25rem);
--text-xl: clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem);
--text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
--text-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
```

### 圆角系统

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 24px
--radius-full: 9999px
```

### 阴影系统

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1)
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1)
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.25)
```

---

## 📐 响应式布局

### 方案 1: 自动网格 (推荐)

```css
.book-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill, 
    minmax(min(100%, 180px), 1fr)
  );
  gap: var(--space-4);
}
```

**效果：**
- 小屏幕：1 列
- 中等屏幕：2-3 列
- 大屏幕：4-6 列

### 方案 2: 容器查询 (组件级响应)

```css
.book-card {
  container-type: inline-size;
  container-name: book-card;
}

@container book-card (min-width: 200px) {
  .book-title {
    font-size: var(--text-lg);
  }
}
```

**效果：** 组件根据容器大小自动调整，而非屏幕大小。

### 方案 3: 流体排版

```css
.page-title {
  font-size: var(--text-2xl); /* 自动 1.5rem ~ 2rem */
  padding: clamp(1rem, 0.8rem + 1vw, 2rem);
}
```

**效果：** 字体和间距平滑过渡，无需断点。

---

## 🌗 暗黑模式

自动检测系统主题：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--color-neutral-900);
    --color-surface: var(--color-neutral-800);
    --color-text: var(--color-neutral-50);
  }
}
```

**无需手动切换**，跟随系统设置。

---

## 🎭 动画系统

### 过渡时间

```css
--duration-75: 75ms
--duration-150: 150ms
--duration-200: 200ms
--duration-300: 300ms
```

### 缓动函数

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 使用示例

```css
.button {
  transition: all var(--duration-200) var(--ease-in-out);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### 减少动画 (无障碍)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📱 移动端适配

### 底部导航

```vue
<nav class="bottom-nav mobile-only">
  <router-link to="/" class="nav-item active">
    <span class="nav-icon">📚</span>
    <span class="nav-label">书架</span>
  </router-link>
</nav>
```

### 安全区域 (iPhone)

```css
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav {
  height: var(--bottom-nav-height-safe);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 🧩 通用工具类

### 布局

```css
.container { max-width: var(--container-max); margin: 0 auto; }
.flex { display: flex; }
.grid { display: grid; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
```

### 间距

```css
.p-4 { padding: var(--space-4); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.gap-4 { gap: var(--space-4); }
```

### 文本

```css
.text-center { text-align: center; }
.text-sm { font-size: var(--text-sm); }
.font-semibold { font-weight: var(--font-semibold); }
.text-primary { color: var(--color-text-primary); }
```

### 显示控制

```css
.mobile-only { display: block; } /* 仅移动端显示 */
.mobile-hidden { display: none; } /* 移动端隐藏 */

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .mobile-hidden { display: block; }
}
```

---

## 📝 使用指南

### 1. 导入设计令牌

```vue
<style scoped>
@import '@/assets/design-tokens.css';

.my-component {
  background: var(--color-surface);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}
</style>
```

### 2. 使用容器查询

```vue
<style scoped>
.card {
  container-type: inline-size;
}

@container card (min-width: 200px) {
  .card__title {
    font-size: var(--text-lg);
  }
}
</style>
```

### 3. 响应式网格

```vue
<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: var(--space-4);
}
</style>
```

---

## 🎯 最佳实践

### ✅ 推荐

- 使用 CSS 变量而非硬编码值
- 使用容器查询实现组件响应式
- 使用流体排版减少断点
- 使用通用工具类快速布局
- 考虑暗黑模式适配
- 考虑减少动画偏好

### ❌ 避免

- 硬编码颜色值 (`#333`)
- 硬编码间距值 (`16px`)
- 过度使用媒体查询
- 固定字体大小 (`14px`)
- 忽略暗黑模式
- 忽略无障碍需求

---

## 📊 性能优化

### CSS 体积

- 设计令牌复用，减少重复代码
- 生产环境自动 Purge CSS
- 使用 CSS 变量减少计算

### 渲染性能

- 使用 `transform` 而非 `top/left`
- 使用 `will-change` 提示浏览器
- 避免过度使用 `box-shadow`

### 加载性能

- 图片懒加载 (`loading="lazy"`)
- 关键 CSS 内联
- 非关键 CSS 异步加载

---

## 🔧 扩展设计系统

### 添加新颜色

```css
:root {
  --color-brand-500: #your-color;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-brand-500: #your-dark-color;
  }
}
```

### 添加新断点

```css
/* 在 design-tokens.css 中 */
--breakpoint-2xl: 1536px;
```

### 添加新动画

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideIn var(--duration-300) var(--ease-out);
}
```

---

**最后更新**: 2026-03-19  
**维护者**: 贾维斯 🤖
