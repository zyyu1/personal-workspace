# PERSONAL WORKSPACE — 增量执行指令 007

## Study Workspace — Course Overview V1.0 + Course Materials ZIP / Folder Import

**实施授权：已批准 / READY FOR DEVELOPMENT**  
**设计状态：APPROVED / DESIGN FROZEN（2026-11-21）**  
**产品基线：** Personal Workspace Design Handoff V0.8  
**视觉基线：** Research Overview V1.1 warm Beige  
**权威设计文档：** `Study_Course_Overview_UIUX_Design_V1.0_APPROVED.md`（随本交接包提供）  
**开发基线：** `main` commit `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237`  
**门禁状态：** A01-1、A01-2、A01-3 均经独立 QA ACCEPTED；A01 Final Integration Gate **READY FOR MODULE 007**。  
**任务边界：** 本次只实现模块 007，不自动开始 Course Exercises / Exams / Labs 完整模块。

> **生效说明：** 配套 APPROVED 设计稿是 2026-11-21 在 A01 尚未完成时冻结的历史文件，其中“ON HOLD / AWAITING AUDIT A01 / 暂不生成执行指令”的语句是当时的实施限制。该限制已被**之后**的正式 Final Integration Gate（基线如上）解除。保留冻结设计稿原文不做无声改写；本执行指令构成明确的**开发授权和交接补充**，但不修改产品功能范围、设计身份或安全约束。

---

## 0. 执行目标与预期交付

在现有 React + TypeScript + Vite 个人 Web 工作台内，实现 **Study Course Overview V1.0** 的可运行、可持久化、响应式版本，包含：

1. Study Course List 最小入口：`/study/courses`。
2. Course Overview：`/study/courses/:courseOfferingId/overview`。
3. Course Materials：`/study/courses/:courseOfferingId/materials`。
4. 区分 `Course`（课程本体）和 `CourseOffering`（具体学期），保留课程状态及资料归属。
5. **Link Extracted Folder**：用户选择并授权**已解压文件夹**，预览、分类、确认建立只读索引，原件保持原位。
6. **Import ZIP**：用户手工选取 ZIP，经过安全预检、目录树和分类预览后确认 **Index only**；若没有真实 Managed Storage，不显示可用的“托管上传成功”行为。
7. **Add Existing Resources**：直接关联模块 005 的全局 Resource，不创建重复文件实体。
8. CourseResource Inspector：复用 A01-3 已统一的 `InspectorShell`，展示来源、可用性、关联、学习动作。
9. Course Overview 使用 A01-1/2/3 已实现的 canonical Task / Calendar / Timer / TimeEntry / Resource / ResumeContext 能力。
10. 完整错误/权限/空状态及 1440px、1024px、390px 适配，真实命令测试与独立 QA 交接。

**成功定义：** 用户可以创建某一学期课程，把完整课程资料（目录或 ZIP 的安全清单）**一次性建立索引**、核对分类、按原始目录寻找资料，并从课程首页继续学习。**不要求**把全部课程资料上传到本服务，亦不要求自动解压到用户硬盘或启动 Typora、MATLAB、VS Code。

## 1. 编码前：核对 Git 基线与现有能力

1. 在现有仓库检查 `git branch --show-current`、`git rev-parse HEAD`、`git status --short`、`package.json` 和实际目录。目标稳定基线为 `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237`；若 HEAD 已前进，记录差异、确认是已批准的提交，**不得强制 reset 或覆盖未提交改动**。
2. 找到 A01-1 的版本化 Repository、IndexedDB/Memory Adapters、MutationResult、Migration/Backup 规则；找到 A01-2 的 Calendar、TimeEntry、Timer 和 ResumeContext；找到 A01-3 的 InspectorShell、Global Tasks、路由懒加载、主题与 ESLint。按**实际代码**命名做映射，不猜测不存在的 API。
3. 在开始新逻辑之前列出已有 `Resource` / `ResourceLocation` / `ResourceLink` / `Task` / `TimeEntry` / `CalendarItem` / `InspectorShell` 的复用点，指出哪些是可直接调用的现有接口，哪些只需最小扩展。
4. 阅读 `Study_Course_Overview_UIUX_Design_V1.0_APPROVED.md` 全文。设计稿具有 UI/UX、业务语义和 24 条验收标准的权威性；如与既有代码存在硬冲突，先报告映射与风险，不自行变更冻结的产品规则。
5. 完成开源方案复核：重新查看 zip.js、fflate、JSZip 的 Star、最后维护时间、许可证、技术栈、部署难度和可复用性，选择至多**一个**压缩库，说明原因、改造成本及潜在风险。不要用设计时的星数冒充当前实时数据；避免重复引入同类依赖。最终是否引入库以安全能力和当前依赖情况为准。
6. 列明浏览器本地目录访问、Local Connector、Managed Storage 三项能力的真实可用状态；任何尚不存在的功能只显示降级提示或接口边界，不伪造成功。

### 三个开源参考（设计时快照，不是最新事实）

| 项目 | GitHub | 设计时 Stars / 最近推送 | 许可证 / 技术栈 | 可复用/成本/风险 |
| --- | --- | --- | --- | --- |
| zip.js | https://github.com/gildas-lormeau/zip.js | 3,915 / 2026-11-17 | BSD-3-Clause / JavaScript streams | 适合大型文件及流式枚举；集成中等，必须额外处理 ZIP 安全、资源限制和权限 |
| fflate | https://github.com/101arrowz/fflate | 3,096 / 2026-05-16 | MIT / TypeScript | 轻量、易集成；大 ZIP/内存占用、输入安全由本项目自己控制 |
| JSZip | https://github.com/Stuk/jszip | 10,400 / 2026-09-09 | JavaScript；引入前核实 LICENSE | 适合普通 ZIP 目录展示；大文件内存消耗与许可证核验是注意点 |

不整体 Fork 第三方文件管理器；ZIP 库**只负责读取格式**，不能替代防 Zip Slip、Zip Bomb、恶意内容和权限的安全设计。

## 2. 路由、页面层级与 UI

### 2.1 Course Library（最小入口）

`/study/courses`

- 列出已保存 CourseOffering（课程名称、学期、状态、资料索引状态、下个明确考核）；无数据时有创建课程入口。
- 支持创建/选择 Course 及某一学期 Offering；允许相同 Course 具有多个 Offering，不得按课程名合并不同学期。
- 课程录入字段至少：title、code（可选）、term、status；ECTS、讲师、学校课程平台 URL 均只在已知时展示；外部 URL 复用 `safeExternalUrl`。
- 提供进入 Overview 和 Materials 的真实导航；不新建独立 Study Dashboard。

### 2.2 Course Overview

`/study/courses/:courseOfferingId/overview`

- Course Header：名称、学期、代码、状态、来源权限/可用性；可访问的操作 `Continue Studying`、`Open Course Folder`（仅当前能力真实支持时）、`Add / Refresh Materials`。
- 首屏按顺序展示 `Continue Studying`、`Next Actions`、`Upcoming Assessments`、`Materials Snapshot`、`Learning Progress`、`Study Time`、`Recent Materials & Notes`。
- Next Actions 来自 GlobalTaskService，按 CourseOffering 关系筛选；不要新建 StudyTask 列表或重复计数。
- Study Time 来自 canonical TimeEntry；计划和实际独立。点击继续学习只导航到已验证的 Workspace 页面/资源，不自动启动 Timer。
- 章节/习题进度来自用户明确保存的学习进度；不能根据 ZIP 里有几个 PDF、打开文件次数或任务规划时长臆造完成率。
- 考试/Testat/报告/作业只有在用户确认或可信信息存在时显示日期；**Past Paper PDF 不等于真实 Exam Event**。
- 近期资源入口要有真实 stable resourceId；若为空，展示空状态而非演示数据伪装真实记录。

### 2.3 Course Materials

`/study/courses/:courseOfferingId/materials`

- 默认 `By Type`，可切换 `Original Folder Tree`；树保留全部相对目录、可折叠层级。
- 虚拟分类：Lectures / Skript、Exercises / Aufgaben、Tutorials / KGÜ / Lösungen、Past Papers / Altklausuren / Probeklausur、Labs / Praktikum / Versuch / Testat、Notes / Markdown、Administrative、Other。
- 列表字段：Name、Type、Source、Relative Path、Last Modified（可用时）、Availability、Related Notes / Tasks。
- 支持文件名、相对路径、标签搜索；可按来源、类别、设备可用性过滤；不要虚构 PDF 全文检索。
- 允许人工修改分类；修改虚拟分类不移动或修改原始文件。
- 选中条目用 `InspectorShell` 打开 CourseResource Inspector；手机全屏、平板 drawer、桌面右侧 panel；维护列表滚动、过滤器与选中项深链接。

### 2.4 Study Tabs 与响应式

Header Tab：Overview / Materials / Tasks / Exercises / Exams / Labs / Notes。当前模块实现 Overview、Materials；其他完整领域页尚未实现时应禁用或明确标识未来入口，禁止无功能假页面。无实验课程可隐藏 Labs。

1440px 桌面双栏；1024px 折叠侧栏；390px 单栏、资料卡片和全屏 Inspector。复用 A01-3 共享主题和响应式规范、键盘/焦点/ARIA 状态，不新增另一套 UI Shell。

## 3. Course Material Import Wizard（关键路径）

必须统一经过：**选择来源 → 获取明确授权 → 建立安全 Manifest → 预览目录/分类/重复项 → 用户确认 → 持久化索引 → 报告结果**。

### 3.1 Link Extracted Folder（默认入口）

1. 用户已在 Windows 上从 LMS 下载 ZIP 并解压；在本应用选择相应的 CourseOffering。
2. 点击 `Add Course Materials → Link Extracted Folder`，仅通过**用户主动触发**的受支持本地目录选择 API 或已授权 Local Connector 访问所选目录。
3. 安全枚举（避免无限递归/超大目录），建立目录/文件清单。保留 `sourceId`、可信相对路径、大小/修改时间（可取得时）、条目类型和原始层级；不得把 Windows 绝对路径公开为跨设备可访问 URL。
4. 显示分类候选、无法识别项、潜在重复项、权限与设备可用性，用户在确认前可调整。
5. 用户确认后建立 `CourseMaterialSource`、Entries 和到 **canonical Resource/ResourceLink** 的关系；**只读索引，不复制、重命名、解压或修改源文件**。
6. 如果仓库已有真实 Local Connector，才可以使用其受限目录扫描、重授权、定位和 Open Original 能力。若只有浏览器临时目录选择，可持久化**索引快照**，但不得承诺重启后仍有可用文件句柄或跨设备访问。再次打开原件时按当前能力校验并提示重新选择。
7. 用户拒绝/取消授权、设备离线、权限过期时：保留此前成功索引与用户进度；明确显示 `Permission Required / Offline / Re-select Folder`。

**禁止**：无授权递归扫描磁盘、自动启动本地编辑器/脚本、在浏览器无法证明的情况下把 Open Original 标记为可用。

### 3.2 Import ZIP（V1.0 必须实现安全选择与清单预览）

1. 通过用户主动 `Choose ZIP` 选取压缩包；不自动登录学校 LMS，不自动下载课程材料。
2. **预检阶段**：检查压缩包大小、压缩条目数量、解压后总大小、单文件上限、解压比率、文件类型及命名、损坏、加密/口令、不支持的 ZIP 编码/压缩算法。使用资源限制、可取消/失败提示；不能盲信中央目录申报的大小，需要读取内容时强制实际字节上限。
3. 对 ZIP 条目路径进行标准化与安全校验：拒绝绝对路径、`../`、`..\\`、驱动器路径、UNC、空/非法路径、路径层级穿越及恶意分隔符变体；识别并拒绝 symlink、hardlink 和特殊文件。ZIP 中脚本和可执行文件只能**静态列出**，绝不运行。
4. 显示原始目录树、安全 manifest、建议分类、来源标识、潜在重复项及预计空间；危险输入不得写入索引，更不能被解压。
5. `Index only`：**可执行的 V1.0 方案**，保存元数据及归属，但不隐式存储 ZIP 文件内容或承诺未来可在别的设备读取字节。再次打开 ZIP 内文件时，若源 ZIP 不可用，要求用户重新提供；不要创建“可打开”假链接。
6. `Managed Import`：仅在已有真实、授权、可持久化的托管文件服务时启用，且需单独明确同意及配额/权限处理。否则显示 `Not available / Future capability`，不能用 IndexedDB 存一批大文件假装云端托管。
7. `Extract to chosen local directory`：不属于 V1.0 必须实现范围；除非已有经过审查的、本地写权限明确的 Connector，否则禁用。默认**绝不覆盖原文件**。
8. 用户确认后持久化 `CourseMaterialImport`、Source、Entry、ResourceLink 等；部分条目失败时记录逐项原因、数量、`Partial` 状态，不显示全成功。

**安全实现建议**：配置明确的 ZIP/Folder 限额（可设定合理默认值并在 UI 告知），并分别在元数据解析与实际读取中执行限制；对大型压缩包/目录采用分批、可中止的处理。不要把“成功读取 ZIP 清单”当作“文件已经安全解压或永久保管”。

### 3.3 Add Existing Resources

- 从 Global Resource Library 检索并选择已有 Resource ID，关联当前 CourseOffering。
- 不需要也不允许复制一套 StudyFile/StudyResource 表。
- `Unlink` 只删除当前课程关系，不删除 Resource 本体、其他课程项目关联、笔记或原始文件。

## 4. Canonical Data / Repository Contracts

以仓库中的 A01-1 **Versioned Repository + IndexedDB Adapter** 为唯一业务持久化基础；不要另建 localStorage 业务源或模块级可变数组。

需要实现/映射的逻辑实体：

- `Course(id, title, code?, department?, defaultTags?)`
- `CourseOffering(id, courseId, term, enrollmentStatus?, lecturer?, ects?, courseUrl?, progressStatus?)`
- `CourseMaterialSource(id, courseOfferingId, kind, deviceId?, sourceUri?, archiveHash?, indexedAt?, permissionState?, importMode)`
- `CourseMaterialImport(id, sourceId, status, startedAt, completedAt?, totals, failures[], manifestVersion, initiatedBy)`
- `CourseMaterialEntry(id, sourceId, relativePath, entryType, size?, modifiedAt?, fingerprint?, classification?, resourceId?)`
- `CourseSection(id, offeringId, type, label, order)`
- `CourseMaterialClassification(offeringId, resourceId, sectionId, confirmedByUser?, origin)`
- `CourseResourceLink(offeringId, resourceId, sourceId?, sectionId?, role?)`
- `CourseStudyProgress(offeringId, sectionId?, resourceId?, exerciseId?, state, updatedAt, noteId?)`
- `CourseAssessment(id, offeringId, assessmentType, title, officialDateTime?, originalTimezone?, provenance?, registrationStatus?)`

复用已有的 `Resource`、`ResourceLocation`、`ResourceLink`、`Task`、`PlannedSession`、`TimeEntry`、`CalendarItem`、`ConnectorState`、`ExternalLink` 以及 A01-2 `WorkspaceResumeContext`。实体命名可映射到现存类型，但必须保持语义和一对多关系。

### 4.1 Primary Ownership 与 Stable Identity

- `Course` ≠ `CourseOffering`；不同学期独立维持资料、学习进度、考核和任务关系。同一资源可被用户明确关联多个 Offering，但不会自动合并。
- Resource 的全局身份和设备可用性由 GlobalResourceService 维护；课程特有的是 CourseOffering–Resource 的**关系和学习进度**。
- 同一来源重扫基于 `sourceId + normalized relativePath + 已知文件标识` 检查；文件名相同不等于同一文件；散列匹配只提示疑似重复，不自动消除独立来源。
- 导入/重扫必须以稳定 Source ID 进行增量更新；不能因为重复点击 Import 而产生全量 Resource 副本。
- 需要关联外部服务时记录来源可信度、权限和 Last Checked；不可把同步成功与**当前设备字节可用**混淆。
- 若 A01-1 Repository 需要增加 Study domain，请遵循既有 schemaVersion、seedVersion、迁移与备份策略；每次写入使用类型化结果和失败提示；禁止静默覆写存量记录。

### 4.2 扫描与重扫的保护

- 预览变更摘要：Added / Changed / Missing / Unchanged。
- 分类人工覆盖不得在重扫时被启发式建议覆盖。
- Missing/Moved/Superseded 资源保留原 ID、笔记、任务关联、进度；若修复位置，要求用户确认。
- 异步写操作失败时不能给出 Import completed；在非跨 Repository 原子系统下，应明确实施可恢复的导入状态/幂等逻辑，避免部分提交后 UI 伪成功。
- 多标签页与多设备同步仍是已知限制；不要承诺自动远程同步。

## 5. Course Resource Inspector / Actions

沿用 A01-3 `InspectorShell`，内容区展示：Resource title/type、source kind、relativePath、current device capability、source sync/index state、mtime/size（若真实可得）、CourseOffering 关系、相关笔记/任务。

- `Open Original`：只在当前设备与权限下**真正可访问**时启用；按当前可用的 URL/Connector/Browser capability 选择操作；不可把本地路径塞入外部 http(s) 链接。
- `Open Note`：使用已存在的 Note/Resource 引用能力；不存在时给出清楚的未连接提示，不假装创建成功。
- `Create Study Task`：通过 canonical GlobalTaskService 创建 Task，Area = Study、CourseOffering ID 与 Resource ID 有稳定关系。添加后 `/tasks` 显示同一 ID；若 schema 仅支持 Research Project，需做最小兼容扩展和迁移，不要再建 StudyTask。
- `Plan / Start Timer`：只复用 A01-2 Calendar、Global Timer 和 TimeEntry，真实上下文应含 Study / CourseOffering；未接线时明确不可用，不启动第二个 timer。
- `Mark Studied` / `Mark Reviewed`：只更新 CourseStudyProgress，不修改文件字节；定义清楚手动标注/自动产生动作，**打开文件不代表学会**。
- `Locate / Repair`：获得授权后的来源重定位；保留 resourceId 和关系。
- `Make Available on Other Devices`：只有 Managed Storage 与授权真正存在才启用；本地 IndexedDB 索引不代表云文件同步。

## 6. Course Assessments / Tasks / Progress / Study Time

- Assessment 有 Exam / Quiz / Testat / Report / Assignment 等类型；仅经用户创建或可信已确认日期产生正式 Calendar Deadline。
- PastPaper、Probeklausur 仅是 Material Resource，绝不能从文件名自动导出未来考试、已考试或成绩。
- Upcoming Assessments 不知道时间时显示 `Date unknown`，不推断学校考试日期。
- Continue Studying 复用 A01-2 `WorkspaceResumeContext`：恢复确实存在的 Task/Resource/Section/Offering；失效时回退到 Course Overview；点击 Continue 不自动 Start Timer。
- Course Planning 与实际 TimeEntry、Task Due Date 和 Assessment Deadline 相互独立；Study Time 从统一时间库过滤，不将下载/解压/扫描时长算作个人学习时间。
- 不需要本次实现完整 Exercises、Exams、Labs、Notes 页面：Overview 可以显示已知摘要与真实链接，未实现入口必须有清晰状态。

## 7. 视觉、交互、错误与安全

- 使用 Research Overview V1.1 tokens：canvas `#F7F3ED`、card `#FFFDF9`、secondary `#F1E9DD`、border `#DED3C4`、text `#30281F`、muted `#6E6154`、accent `#77573B`、hover `#68482F`。使用已有 CSS 变量，不增加新主题。
- 使用 A01-3 的统一 AppShell、InspectorShell、路由级 lazy loading，确保 `/study/courses`、Overview、Materials 和深链接正常运行。
- 导入 Wizard 的按钮、状态、进度、取消、确认必须有真实操作，不允许“扫描成功”“导入成功”装饰性消息。
- Loading、Empty、Permission Required、ZIP Corrupt、Unsafe Entry、Too Large、Partial、Failed、Offline、Moved/Missing、Unsupported Browser、Demo 等状态清晰可见。
- 可访问性：键盘进入向导、Esc 关闭（适用时）、焦点管理、适当 aria-label、清楚的字段与错误反馈。避免用纯颜色表示操作状态。
- 不运行来源文件夹或 ZIP 内脚本，不执行宏，不静默上传/删除/覆盖原件；对外链使用已审查的 `safeExternalUrl`。

## 8. 实施次序（建议）

1. **Inventory**：对当前仓库建立 git baseline、共享模型映射、ZIP 库三选一评估，列出 Local Connector / Managed Storage 的可用性。
2. **Model / Repository**：建立 Course/Offering/Source/Import/Entry/Progress/Assessment 的类型与 canonical Repository，迁移及错误处理，准备显式演示数据隔离。
3. **Course Library & Overview**：最小课程入口、课程学期切换、Overview 卡片与空状态，复用 Tasks/TimeEntries/Resume。
4. **Materials**：来源分类与原始树、Resource Inspector、Add Existing Resource、跨模块链接与深链接。
5. **Folder Linking**：用户主动授权、只读清单预览、确认导入、重扫差异、权限降级。
6. **ZIP**：安全预检、清单/分类预览、Index only、危险路径与限额测试；如果真实 Managed Storage 缺失则仅留禁用入口。
7. **Integration**：Task/Calendar/Timer/Resource/Resume 的 Study Context 联通、路由、主题和响应式。
8. **Tests & QA Handoff**：现有 001–006 全回归、007 新增单测/浏览器测试、完整逐条报告。

## 9. 验收矩阵（24 项，逐条 PASS / PARTIAL / FAIL / NOT VERIFIED）

1. Course 与 CourseOffering 身份分离，学期资料不串档。
2. Overview：Continue、Next Actions、Assessments、Materials、Progress、Study Time 正确展示且来源可靠。
3. 未知 ECTS/考试/进度不展示虚假数字。
4. 已授权解压文件夹可建立索引；原件不移动。
5. 浏览器/Connector 不支持时有明确降级，不伪造扫描结果。
6. ZIP 选择与预检、目录预览、安全条目筛选实现；若环境无法读取要明确 NOT VERIFIED。
7. 导入前有人工确认；默认不覆盖文件。
8. 对路径穿越、绝对路径、链接类型及过大/高压缩比 ZIP 有防护。
9. 原始相对路径、树形层级与来源 ID 保留。
10. 自动分类只给建议、用户可修改且持久化。
11. Past Paper 不会自动生成 Exam Deadline。
12. Global Resource ID 复用，不引入课程专属资源实体副本。
13. 重复 Import/重扫具有幂等性，不无声复制全量条目。
14. 文件移动/重扫不丢笔记、任务、课程进度。
15. Metadata Sync 与当前设备 Byte Availability 分离。
16. Open Original 在权限与可用性不满足时禁止或降级。
17. Create Study Task 使用 Global Task ID，`/tasks` 与课程视图一致。
18. Task/PlannedSession/TimeEntry/Assessment Deadline 互不混同。
19. Continue Studying 恢复有效上下文，不自动启动计时器。
20. 不执行 ZIP 内脚本或源文件可执行代码。
21. Partial / Failed Import 可诊断、不会伪成功。
22. 1440 / 1024 / 390px 无严重溢出，Inspector 行为符合全局规范。
23. Typecheck / Build / Lint / Tests / git diff --check 提供真实命令结果。
24. 仅实施 007，未来 Exercises/Exams/Labs 只保留明确接口或占位。

### 9.1 必测补充场景（至少）

- A 学期与 B 学期资料隔离；同名资源不直接合并。
- 用户取消 Folder/ZIP 选择后没有导入副作用。
- 同一来源重新扫描两次无重复 Resource ID。
- 手工分类后再扫描仍保留分类。
- ZIP 包含 `../escape.pdf`、`..\\escape.pdf`、`C:\\evil.exe`、`/etc/passwd` 以及 symlink 条目时拒绝/隔离，并记录明确结果。
- 超大文件/过高解压比/条目数超限被拒绝而非浏览器挂死。
- 文件权限丢失或源 ZIP 不可重新读取时，不能错误启用 Open Original。
- 标记 Studied 不修改 Resource；Unlink 不删除源文件/相关 Task。
- Task 创建后刷新，仍能在 Global Tasks 搜索到相同 ID。
- TimeEntry 的 Study 归属在刷新后保持，Research 时间统计不重复增加。
- 旧模块 001–006 的回归测试、Deep Link、Calendar/Timer/Inspector 仍通过。

测试覆盖需要明确区分：**Memory Adapter contract 单测**、**真实浏览器 IndexedDB reload**、**用户授权目录选择或可复现文件夹 fixture**、**ZIP 恶意 fixture / 安全导入测试**。不要将单测 Mock 通过写成真实本地连接器可用。

## 10. 本轮明确不做

- 完整 Study Dashboard 或 Work Workspace。
- 完整 Course Exercises / Exams / Labs / Notes 工作流。
- 学校 LMS 账号登录、爬取、自动下载或绕过认证。
- 系统级任意磁盘扫描、无授权本地路径访问、自动启动本地程序。
- 自动将 ZIP 解压覆盖 Windows 课程目录。
- 没有真实后端条件下的云端文件托管和跨设备文件同步。
- OCR / PDF 全文搜索、自动批改或 AI 学习进度推断。
- 第二套 Task / Resource / Calendar / Timer / TimeEntry / Inspector。
- 对 Research 001–006 的未经批准重构。

## 11. 执行窗口交付与独立 QA

完成后请先在执行窗口输出：

1. 当前 Branch、起始 Commit、Working Tree 及新提交（如有）。
2. 新增/修改文件列表、技术选型、开源依赖评估结果（5 维：Stars、最近更新、许可证、栈、部署难度）。
3. `Course`/`Offering`/`Material Source`/`Resource`/`Task`/`TimeEntry` 的复用映射图与 Repository 说明。
4. Course Library、Overview、Materials、Folder/ZIP Import Wizard 的真实完成情况及使用步骤。
5. ZIP 防护规则、权限模式、降级行为和真实设备可用性判定方法。
6. 在 1440px、1024px、390px 的界面验证或截图，说明未覆盖项。
7. `npm run typecheck`、`npm run lint`、`npm run build`、`npm test -- --run`、`git diff --check` 的**实际**结果。
8. 24 项验收标准逐条 `PASS / PARTIAL / FAIL / NOT VERIFIED`，与对应测试文件和浏览器证据。
9. 模块 001–006 的回归及新缺陷清单、数据迁移与安全限制说明。
10. 仍然缺少的 Local Connector、Managed Storage、浏览器受限功能和后续依赖。

随后由**执行窗口**直接向独立**测试审校窗口**交付：

- `Module_007_QA_Handoff`（本设计 Approved 文档 + 本执行指令 + 变更文件/仓库基线 + 实测日志 + 数据/安全 fixture）；
- 独立审校要求：**Review Only**，测试窗口不得直接改代码；需要逐条验收 ZIP 导入安全、真实持久化、CourseOffering 隔离、跨模块 Task/Resource/Timer 一致性以及 001–006 回归。
- QA 最终结论使用 `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`，对每个问题记录严重程度、文件位置、证据及最小修复建议。

**本次仅授权 Module 007。完成后停止开发，等待测试窗口独立审核以及设计窗口的正式决策；不得自行启动模块 008。**
