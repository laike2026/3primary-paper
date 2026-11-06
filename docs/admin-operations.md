# 中文管理后台运维手册

## 入口与首位管理员

访问 `/admin/setup`。首次开通须使用项目 `ADMIN_BOOTSTRAP_TOKEN`、登录账号及高强度密码；邮箱可在账号管理中核实后绑定。创建后初始化入口自动关闭。不要通过代码仓库传递密码。后台支持超级管理员、管理员、编辑、营销、销售、分析及只读角色。所有 API 在服务端检查登录和权限；角色授权见 `lib/admin/auth.ts`。

管理员忘记密码可走 `/admin/forgot-password`。发送重置邮件前，须在 Vercel 配置已验证域名的 `RESEND_API_KEY`、`INQUIRY_FROM_EMAIL`。邮件服务未配置时，旧会话仍有效，但自助重置邮件不会发出。可由超级管理员在用户管理中停用账号或重设角色。

## 模块

- 内容：分类、产品、新闻、新闻分类；支持四语言文本、草稿、待审核、发布、下架、归档、回收站、版本快照和筛选。新闻只能在后台逐篇新建草稿，并由有发布权限的人员逐篇手动发布；新闻不支持定时发布、批量导入或批量发布。其他内容仍支持 CSV/JSON 导入导出，批量导入先运行校验，单次最多 200 条。产品 URL 别名改变时自动生成旧链接重定向。
- 媒体：JPG/PNG/WebP/SVG、PDF 与 Office 文件，单文件 4 MB；图片转 WebP 并生成缩略图；SHA-256 去重；内容使用中的文件不允许移入回收站。媒体库文件公开可访问，请勿上传私人材料。
- 询盘工作台显示待跟进、待分配和通知失败。询盘先入库，同一个提交编号重复发送时返回原记录。邮件状态分为等待、失败和发信服务已受理。待分配与日期筛选同样适用于 CSV 导出。
- 数据追踪记录地址和 WhatsApp 点击、表单进度及提交结果。只采集已同意的行为事件，表单进度只记录字段名。访客可从页脚的隐私设置撤回同意。成功询盘数以服务端入库为准。
- SEO：页面内容的标题、描述、canonical、OG 图、noindex；站点地图只输出公开内容。Search Console 以服务端账号拉取数据，统计通常存在 Google 的处理延迟。
- 同步由 Vercel Cron 定期处理。数据同步页分别显示 API 接受、Google 读取及抽样 URL 收录状态，任务失败可查看重试时间或重新排队。发信服务配置前，待通知询盘保留在后台。
- 审计：登录、内容、询盘、账号与设置操作可检索、导出。后台设置中的详细地址与地图链接只有在两者均核实并保存后才在前台显示和计数。

## 数据库与文件

`pnpm db:migrate` 应使用 `DATABASE_URL_UNPOOLED`；`pnpm db:seed` 只为初次导入产品分类、产品和默认新闻分类运行一次，不会创建或发布新闻。更新前先创建数据库恢复点或加密备份。生产使用 Vercel 连接的 Neon 与 Blob；预览使用独立的 Preview 数据库分支，避免编辑测试影响生产。

加密备份：

```bash
node --env-file=.env.local scripts/backup-data.mjs create output/admin.backup
node --env-file=.env.local scripts/backup-data.mjs verify output/admin.backup
```

恢复须使用已经迁移、完全空白的**另一个**数据库，并设置 `RESTORE_DATABASE_URL` 与 `RESTORE_ALLOW_DISPOSABLE=yes`：

```bash
node --env-file=.env.local scripts/backup-data.mjs restore output/admin.backup
node --env-file=.env.local scripts/backup-data.mjs restore-media output/admin.backup output/recovered-media
```

备份使用 AES-256-GCM 加密，口令由 `BACKUP_PASSPHRASE` 提供。数据库在一致性快照中读取，随后收集该快照引用的公开 Blob 文件和缩略图。验证会逐个核对大小和 SHA‑256。旧版数据库备份仍可恢复。媒体恢复命令将文件及原 URL 清单写入新的本地目录，供恢复同一路径或迁移时核对。恢复数据库后，管理员需重新登录。应用级归档适合小型站点，正式灾备仍需用 Neon 恢复点和 Blob 保留策略，并在隔离环境先演练。

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
