# Vercel 部署指南

## 已迁移到 Vercel Serverless Functions

本项目已从 Express 服务器迁移到 Vercel 的 Serverless Functions（API Routes），使其完全兼容 Vercel 平台部署。

### 主要变更

✅ **创建的新文件：**
- `api/generate-text.ts` - 医疗文档生成 API
- `api/generate-image.ts` - 图片生成 API  
- `vercel.json` - Vercel 配置文件
- `package.json` - 添加 @vercel/node 依赖

✅ **移除的文件：**
- `server.ts` 现在仅用于本地开发（保留向后兼容性）

### 本地测试

本地仍然可以使用原有的开发方式：

```bash
npm run dev       # 启动开发服务器（Express + Vite）
npm run build     # 生产构建
```

### 在 Vercel 上部署

#### 第一步：推送到 GitHub

```bash
git push origin main
```

#### 第二步：连接 Vercel

1. 访问 https://vercel.com/dashboard
2. 点击 **"Add New"** → **"Project"**
3. 选择 GitHub 仓库 `wangjk8281/wangyh`
4. 点击 **"Import"**

#### 第三步：配置环境变量

在 **Settings** → **Environment Variables** 中添加：

| 变量名 | 值 |
|-------|-----|
| `AIHUBMIX_API_KEY` | 你的 AIHUBMIX API Key |

#### 第四步：部署

点击 **"Deploy"** 按钮。

### 部署后的 API 端点

部署成功后，API 将自动可用：

- 医疗文档生成：`https://你的域名.vercel.app/api/generate-text`
- 图片生成：`https://你的域名.vercel.app/api/generate-image`

前端代码会自动使用这些端点（因为使用了相对路径 `/api/...`）。

### 常见问题

**Q: 为什么要迁移到 Serverless Functions？**
A: Vercel 不支持长期运行的 Express 服务器。Serverless Functions 是 Vercel 的最佳实践，按需执行，自动扩展。

**Q: 本地开发会受到影响吗？**
A: 不会。本地仍然使用 Express 服务器，开发体验不变。

**Q: 可以切换回 Express 服务器吗？**
A: 可以，编辑 `package.json` 中的 `"dev"` 脚本改回使用 `server.ts`。但在 Vercel 上需要使用 Serverless Functions。

**Q: 部署后 API 不工作怎么办？**
A: 
1. 检查环境变量是否设置正确
2. 在 Vercel 仪表盘查看 **Functions** 日志
3. 检查是否有错误触发（通常在 **Logs** 标签中）

### 架构图

```
本地开发:
Frontend (React) ↔ Express Server (server.ts) ↔ AIHUBMIX API

Vercel 生产环境:
Frontend (React) → Vercel (CDN) 
API Routes (Serverless) → AIHUBMIX API
```

### 文件结构

```
.
├── api/
│   ├── generate-text.ts      # 文本生成 Serverless Function
│   └── generate-image.ts     # 图片生成 Serverless Function
├── src/
│   ├── App.tsx
│   ├── services/
│   │   └── geminiService.ts
│   └── ...
├── server.ts                 # Express 服务器（本地开发）
├── vercel.json              # Vercel 配置
├── vite.config.ts           # Vite 配置
├── package.json
└── ...
```

### 更新项目后重新部署

每次推送到 GitHub 时，Vercel 会自动检测更改并重新部署。

```bash
git add .
git commit -m "你的提交信息"
git push origin main
# Vercel 会自动开始部署
```

---

需要帮助？查看 Vercel 官方文档：https://vercel.com/docs/serverless-functions/introduction
