# 中文管理后台运维手册

## 入口与首位管理员

访问 `/admin/setup`。首次开通须使用项目 `ADMIN_BOOTSTRAP_TOKEN`、登录账号及高强度密码；邮箱可在账号管理中核实后绑定。创建后初始化入口自动关闭。不要通过代码仓库传递密码。后台支持超级管理员、管理员、编辑、营销、销售、分析及只读角色。所有 API 在服务端检查登录和权限；角色授权见 `lib/admin/auth.ts`。

管理员忘记密码可走 `/admin/forgot-password`。发送重置邮件前，须在 Vercel 配置已验证域名的 `RESEND_API_KEY`、`INQUIRY_FROM_EMAIL`。邮件服务未配置时，旧会话仍有效，但自助重置邮件不会发出。可由超级管理员在用户管理中停用账号或重设角色。

## 模块

- 内容：分类、产品、新闻、新闻分类；支持四语言文本、草稿、待审核、定时、发布、下架、归档、回收站、版本快照、筛选、CSV/JSON 导入导出。批量导入先运行校验，单次最多 200 条。产品 URL 别名改变时自动生成旧链接重定向。
- 媒体：JPG/PNG/WebP/SVG、PDF 与 Office 文件，单文件 4 MB；图片转 WebP 并生成缩略图；SHA-256 去重；内容使用中的文件不允许移入回收站。媒体库文件公开可访问，请勿上传私人材料。
- 询盘：状态、负责人、备注、批量分配、筛选与 CSV 导出；去重提示使用相同邮箱和时间窗口，不自动丢弃有效询盘。入库先于邮件通知，发送失败由任务重试。
- 数据追踪：地址点击、WhatsApp 点击、表单展现、打开、开始填写、字段完成、尝试提交、成功/失败。只记录字段名与事件，不记录未提交的输入值；成功询盘以服务端入库为准。访客同意匿名统计后才采集非必要客户端事件。
- SEO：页面内容的标题、描述、canonical、OG 图、noindex；站点地图只输出公开内容。Search Console 以服务端账号拉取数据，统计通常存在 Google 的处理延迟。
- 同步：Vercel Cron 每 30 分钟运行短任务，数据库任务队列重试。后台可手动启动 GSC 或邮件重试。
- 审计：登录、内容、询盘、账号与设置操作可检索、导出。后台设置中的详细地址与地图链接只有在两者均核实并保存后才在前台显示和计数。

## 数据库与文件

`pnpm db:migrate` 应使用 `DATABASE_URL_UNPOOLED`；`pnpm db:seed` 只为初次导入原有官网内容运行一次。更新前先创建数据库恢复点或加密备份。生产使用 Vercel 连接的 Neon 与 Blob；预览使用独立的 Preview 数据库分支，避免编辑测试影响生产。

加密备份：

```bash
node --env-file=.env.local scripts/backup-data.mjs create output/admin.backup
node --env-file=.env.local scripts/backup-data.mjs verify output/admin.backup
```

恢复须使用已经迁移、完全空白的**另一个**数据库，并设置 `RESTORE_DATABASE_URL` 与 `RESTORE_ALLOW_DISPOSABLE=yes`：

```bash
node --env-file=.env.local scripts/backup-data.mjs restore output/admin.backup
```

备份使用 AES-256-GCM 加密，密钥来自 `BACKUP_PASSPHRASE`，请在受限密码库另存一份。备份包含数据库记录和媒体 URL，不包含 Blob 文件字节。此应用级导出不是并发写入时的严格时间点快照；正式灾备仍应配置 Neon 快照，恢复时先停写并校验表数量与页面。恢复演练已在单独临时数据库执行并核对内容，临时数据库已移除。

## 本地运行与检查

```bash
pnpm install --frozen-lockfile
node --env-file=.env.local scripts/migrate.mjs
pnpm dev
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Docker 可用 `docker build -t 3primary-paper .` 构建，运行时用 `--env-file` 提供服务端变量。健康检查 `/api/health` 仅返回数据库连接状态，不显示凭据。

## 发布与回滚

先在 Vercel Preview 验证后台、四语言公开页面、询盘入库和事件追踪。确认无误后再把已审查提交并入生产分支。回滚使用上一成功 Vercel 部署；若发生数据库结构变更，优先前向修复或在隔离数据库验证备份恢复，不能只回滚网页代码。开启 `INDEXING_ENABLED=true` 前确认域名、证书、robots、sitemap、canonical 和正式内容。

当前外部依赖：已验证发信域名与 Resend 密钥、管理员恢复邮箱、正式英文地址与地图链接。未配置的功能在后台应显示待配置，不得模拟成功。
