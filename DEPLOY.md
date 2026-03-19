# 🚀 部署指南

## 1️⃣ 上传到 GitHub

### 登录 GitHub

```bash
gh auth login
```

按提示选择：
- GitHub.com
- HTTPS
- Login with a web browser
- 复制验证码并在浏览器中完成登录

### 创建仓库并推送

```bash
# 创建远程仓库 (替换 <your-username> 为你的 GitHub 用户名)
gh repo create novel-reader --public --source=. --remote=origin

# 或直接推送到你的用户名下
gh repo create <your-username>/novel-reader --public --source=. --remote=origin

# 推送代码
git push -u origin master
```

---

## 2️⃣ GitHub Pages 部署

### 方案 A: 使用 GitHub Actions (推荐)

1. 在 GitHub 仓库中，进入 **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 点击 **Configure** 选择 **Static HTML** 或 **Vue.js**
4. 提交 `.github/workflows/deploy.yml`

项目已包含 GitHub Actions 工作流文件，推送后会自动部署。

### 方案 B: 使用 Vercel (更简单)

1. 访问 https://vercel.com
2. 登录 GitHub 账号
3. Import 你的 `novel-reader` 仓库
4. 自动检测 Vite 配置，点击 Deploy
5. 获得免费域名：`https://novel-reader.vercel.app`

### 方案 C: 使用 Netlify

1. 访问 https://netlify.com
2. 登录 GitHub 账号
3. Add new site → Import an existing project
4. 选择 `novel-reader` 仓库
5. 构建命令：`npm run build`
6. 发布目录：`dist`
7. 点击 Deploy

---

## 3️⃣ 自定义域名 (可选)

### GitHub Pages

1. Settings → Pages → Custom domain
2. 输入你的域名
3. 在 DNS 提供商处添加 CNAME 记录

### Vercel/Netlify

在平台设置中添加自定义域名，按指引配置 DNS。

---

## 4️⃣ 自动化部署

推送代码后自动部署：

```bash
# 日常开发
git add .
git commit -m "feat: 添加新功能"
git push

# GitHub Actions 会自动构建并部署
```

---

## 📊 访问地址

部署成功后，你将获得：

- **GitHub Pages**: `https://<your-username>.github.io/novel-reader/`
- **Vercel**: `https://novel-reader.vercel.app`
- **Netlify**: `https://novel-reader.netlify.app`

---

## 🔧 故障排查

### 构建失败

```bash
# 本地测试构建
npm run build

# 查看错误日志
npm run build -- --debug
```

### GitHub Pages 404

确保 `vite.config.ts` 中配置了正确的 `base`:

```typescript
export default defineConfig({
  base: '/novel-reader/', // GitHub Pages 需要仓库名
  // ...
})
```

---

**最后更新**: 2026-03-19
**由 贾维斯 🤖 创建**
