# LUMINA LabType（LBTI）内容笔记

写作依据与事实核查记录。供编辑发布前复核，不随文章发布。

## 仓库摘要

LBTI（Laboratory Behaviour Type Indicator）是一个公开自称"虚构作品"的科研人格测试：36 道五点量表题（实验室场景），确定性计分为 15 维分数（5 组），加权欧氏最近原型分类到 21 种虚构人格（18 可见 + 3 隐藏），并用真实计算的 PCA、k-means、层次聚类、熵、种子化 bootstrap（默认 300 次）解释结果。纯前端（React 18 + Vite + TypeScript + Tailwind + D3 + framer-motion + zustand），无后端；可选的匿名"群体图谱"与"意见信箱"用 Supabase（RLS，insert-only）。三语（en / zh-CN / zh-TW）。GitHub Actions 部署到 GitHub Pages。全项目不使用任何 LLM/生成式 AI；结果文字为手写模板 + 确定性插值。

## 关键证据路径

| 主张 | 证据 |
|---|---|
| 虚构定位、免责声明 | `README.md`；`src/data/translations/zh-CN.json` 的 `disclaimer`、`methodology` |
| 36 题 / 15 维 / 5 组 | 翻译文件 `questions` 键计数（36）；`src/data/dimensions/dimensions.json` |
| 21 人格（18+3 隐藏）、原型向量为手工设计 | `src/data/archetypes/archetypes.json`（`hidden` 字段）；文件内 comment |
| 确定性计分、平局规则（加权距离→余弦→字母序） | `src/features/scoring/engine.ts`（classify） |
| 匹配强度 / 分类间隔 / 归一化熵（softmax over top-K） | `engine.ts` scoreAnswers |
| 隐藏人格由显式规则触发、"从不指控学术不端" | `src/data/configuration/hidden-rules.json`；disclaimer 翻译 |
| 种子化 bootstrap，默认 300 次，"非临床信度" | `src/features/scoring/bootstrap.ts`；`scoring-config.json`（seed: lumina-bootstrap, defaultReplicates: 300） |
| bootstrap 在 Web Worker 中运行 | `src/workers/bootstrap.worker.ts` |
| PCA/k-means/层次聚类/熵为浏览器内实现 | `src/lib/mathematics/`（pca.ts, clustering.ts, statistics.ts）+ 各自测试 |
| 结果文字非生成式 AI，模板守卫防未填充占位符 | `src/lib/templates/templates.ts`（注释 "never generative AI"）+ templates.test.ts |
| 内容校验：Zod schema + 跨文件引用 + 三语翻译完整性，进 CI | `scripts/validateContent.ts`；`src/data/schemas.ts`；`.github/workflows/deploy.yml` |
| 隐私：答案仅存 localStorage，可删除 | README；`src/lib/storage/storage.ts`；privacy 翻译 |
| 群体图谱：匿名 insert-only，无 UPDATE/DELETE 策略，DB 层逐元素校验向量 0–100 | `supabase/migrations/0001_cohort_records.sql` |
| 意见信箱：insert-only、公众不可读、7 种审核状态、内容哈希去重 | `supabase/migrations/0002_letterbox_suggestions.sql`；`src/features/letterbox/` |
| Supabase 未配置时优雅降级 | `src/lib/supabase.ts`；cohort/letterbox 的 unconfigured 文案 |
| CI：内容校验→lint→类型检查→单测→Playwright e2e→构建→Pages 部署 | `.github/workflows/deploy.yml` |
| 分享卡 PNG 导出 + 二维码 | `src/features/sharing/ShareCard.tsx`（html-to-image, qrcode） |
| ML 实验室教学内容（学术/大白话双表述 + Python 模式） | `src/pages/MLLab.tsx`；mllab 翻译 |
| MIT 声明 | `package.json` license 字段 + README（但见下文"待确认"） |

## 不确定 / 待人工确认的主张

1. **线上地址**：README 写 `https://sthsci.github.io/academic_personality/`，但 git remote 是 `sthsci/lumina-labtype`，部署工作流用仓库名作 base path → 实际地址应为 `.../lumina-labtype/`。文章刻意未写具体 URL，只说"代码在 GitHub（sthsci/lumina-labtype）"。**发布前请确认线上地址并更新 README。**
2. **是否已部署且可访问**：仓库有完整部署工作流，README 声称有 live site，但本次未验证 URL 可达。文章未做"已上线且稳定运行"的强主张。
3. **开源状态**：package.json 与 README 声明 MIT，但根目录**没有 LICENSE 文件**；GitHub 仓库是否公开也未验证。文章据此只说"仓库声明 MIT 协议，但还没有 LICENSE 文件"。
4. **意见信箱（Letterbox）未合入**：`src/features/letterbox/`、`src/pages/Letterbox.tsx`、迁移 0002 均为未提交的工作区新文件。文章将其描述为"还未合入主分支、进行中"。**若发布时已上线，可改措辞；若未上线，小红书文末"站内意见信箱"一句需要斟酌。**
5. **群体图谱是否已有真实数据/用户**：无证据，文章未声称有任何用户量。
6. **"没有防灌水机制"**：基于对迁移文件的分析（cohort 表无速率限制/去重；letterbox 有 content_hash 去重）。属合理技术判断而非文档声明。

## 已实现 vs 计划中

- **已实现（已提交）**：测试全流程、计分引擎、全部可视化、ML 实验室、群体图谱（Supabase）、三语、分享卡、CI/CD、内容校验、e2e 测试。
- **已实现但未提交**：意见信箱（前端 + 迁移 0002 + 三语文案 + 测试文件均在工作区）。
- **仅有模式、无工具**：意见信箱的审核流程——枚举了 7 种状态并建了 review 视图，但没有任何审核界面，需维护者手动操作。
- **未发现**：任何 AI/LLM 集成、账号系统、分析埋点、监控告警（均为刻意不做或尚无）。

## 推荐截图（仓库内无现成截图文件，需运行应用截取）

- `/atlas` 人格图鉴（21 卡片网格）——微信配图 2、小红书 slide 2/3
- `/test` 答题页——小红书 slide 4
- `/pipeline` 分析动画页——小红书 slide 5，微信配图 1 的对照
- `/result` 结果页（雷达 + 匹配强度 + bootstrap 稳定性）——微信配图 5、小红书 slide 6
- `/methodology` 方法页——微信配图 3 备选
- 现成资产：`public/lbti-logo.png`（Logo）、`public/favicon.svg`

## 缺失资产

- 无任何应用截图（需本地 `npm run dev` 或线上站点截取；注意选定语言为 zh-CN 后截图）
- 微信配图 1（流水线图）、配图 4（隐私架构图）、小红书 slide 7（诚实两栏）需新绘
- 小红书封面需设计

## 需人工确认的事实问题 / 建议修正的仓库表述

1. **README 的 live site URL 过期**（仓库改名后未更新）——建议改为 `https://sthsci.github.io/lumina-labtype/` 并验证可达。
2. **deploy.yml 中 e2e 步骤硬编码 `VITE_BASE: /academic_personality/`**，与实际仓库名不一致；e2e 因此没有在真实部署子路径下测试。建议改用 `${{ github.event.repository.name }}`。
3. **缺 LICENSE 文件**——README 与 package.json 声明 MIT，应补文件。
4. **deploy.yml 明文包含 Supabase URL 与 publishable key**。publishable/anon key 本就设计为客户端公开，且 RLS 已按此假设设计，但建议开发者确认（a）该 key 确为 publishable 而非 service key；（b）愿意让它出现在公开工作流中（也可改用 GitHub Secrets 以便轮换）。**两篇文章均未包含该 URL 或 key。**
5. 本地 `.env.local` 存在——未读取、未引用，发布内容不涉及。

## 写作口径备忘

- 全文避免："准确率、效度、用户数、已验证、心理测量学上可靠"等无证据表述。
- 熵/匹配强度/稳定性一律解释为"内部一致性/清晰度"，不是"准"。
- 隐藏人格表述沿用项目自己的口径："善意的漫画化，不指控学术不端"。
- "富集"必须带引号并说明无 p 值（方法页原文如此）。
- 不称其为"产品"或"平台"，称"项目/玩具/网页应用"。
