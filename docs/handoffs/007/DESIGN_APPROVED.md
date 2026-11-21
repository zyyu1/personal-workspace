# Personal Workspace — Study Workspace / Course Overview V1.0 (APPROVED)

**Status:** APPROVED / DESIGN FROZEN — 设计已确认，代码实施暂缓  
**Module:** 007  
**Date:** 2026-11-21  
**Baseline:** Personal Workspace V0.8  
**Visual:** Research Overview V1.1 warm Beige tokens  
**Dependencies:** Modules 001–006 shared services; Audit A01 审核结果是执行指令 007 的前置条件

> **签收决定（2026-11-21）：** 用户已确认 Course Overview V1.0 及课程资料 ZIP / Folder 导入设计。**仅冻结 UI/UX 与功能边界，不授权立即开发模块 007。** Audit A01 审核完成、报告经设计窗口审阅后，按真实共享架构和修复决策生成 `Execution_Instruction_007` 与 ZIP Handoff 007。本文不是执行指令。

## 1. 目标与范围

课程资料通常从大学课程平台以完整 ZIP 下载，并解压为层次化课程目录。Course Overview 为每门课集中展示继续学习、下一步任务、教学资料、练习、考试、实验、复习进度和实际学习时长，并以**引用优先**方式建立资料索引，不要求逐份上传，也不擅自改变源目录。

- **Course**：课程本体（名称、代码等较稳定信息）。
- **CourseOffering**：某学期开课版本，承载具体教学资料、活动、考试与学习状态。
- **Material Source**：授权的解压目录、ZIP 源文件或受管理的资源副本。
- **Resource**：沿用全局资源身份与关联；材料不是新建的独立文件数据库。
- **Assessment**：考试/Testat/报告等真实考核事件，与历史考试题（Past Paper Resource）不同。
- **Task / PlannedSession / TimeEntry**：复用全局系统，分别表示待办、计划和实际投入。

## 2. 信息架构与推荐路由

- `/study`：Study Dashboard（独立模块，暂不实现）。
- `/study/courses`：Course Library / Course List（本模块最小入口）。
- `/study/courses/:courseOfferingId/overview`：课程首页。
- `/study/courses/:courseOfferingId/materials`：资料浏览及导入入口（本模块实现资料索引最小可用视图）。
- Future tabs: `tasks`, `exercises`, `exams`, `labs`, `notes`；可在导航展示，但无实现时清楚标记占位，禁止假装完成。

Course Tabs 建议：Overview / Materials / Tasks / Exercises / Exams / Labs / Notes。Labs 对于无实验的课程可隐藏，而不是展示空的强制模块。

### Course Header

- Course Name, Code, Course Offering Semester, ECTS (仅已知时), Enrollment/Study Status。
- Lecturer / Course Platform URL（有可信来源时）。
- `Continue Studying`, `Open Course Folder`, `Add / Refresh Materials`。
- Source connection and permission status；不会凭空宣称本地目录始终在线。

### Overview 卡片优先级

1. **Continue Studying**：最近明确保存的学习任务/文档/题目/章节；没有记录则显示引导。
2. **Next Actions**：全局 Task 筛选该 CourseOffering，不重复任务。
3. **Upcoming Assessments**：已知考试/Testat/报告/作业日期；未知不编造。
4. **Materials Snapshot**：Lecture / Tutorial / Exercises / Past Papers / Labs / Administrative / Other。
5. **Learning Progress**：章节学习与练习完成进度，不能按 ZIP 文件计数冒充学习进度。
6. **Study Time**：全局 TimeEntry 的课程级筛选，计划与实际分离。
7. **Recent Materials & Notes**：最近阅读和引用，按已观测动作排序。

布局：桌面 1440px，主内容和右侧 Next Actions/Deadlines 双栏；平板 1024px 折叠 Sidebar；手机 390px 单栏与可水平滚动 tabs，文件详情全屏。

## 3. ZIP / Folder 资料导入：三条入口

### A — Link Extracted Folder（推荐、引用优先）

**用户流程：** 下载 ZIP → 本地解压 → 在 Workspace 选择课程 → `Add Course Materials` → `Link Extracted Folder` → 授权目录 → 预览结构与分类 → 确认索引 → 展示 Materials。

- 使用已授权目录的**相对路径**和元数据作为索引；源文件原地保留。
- 若 Local Connector 已存在，使用其按设备授权目录扫描、读取和 `Open Original`，并保存可恢复的目录引用。
- 若只有浏览器：可用的目录选择 API 由浏览器、权限和用户操作决定；需标注“当前会话读取 / 索引快照”，不许假装持续监视整个硬盘或永久取得真实路径。
- 未授权、用户取消、权限过期时不抹掉旧索引，显示 `Permission Required / Offline`。
- 不应自动打开 Typora/VS Code 或执行可执行程序。

### B — Import ZIP

**用户流程：** `Import ZIP` → 选择 ZIP → 安全预检 → 目录结构/文件类型预览 → 选择 `Index only` / `Managed Import`（仅实际支持时） → 课程分类映射 → 确认 → 索引或托管导入。

- **Index only:** 只保存安全的元数据、条目路径和来源标识；若以后原始 ZIP 丢失或访问权限过期，需要重新选择 ZIP 才能打开文件内容。
- **Managed Import:** 用户明确同意将文件上传到 Workspace 托管存储；仅当真实后端与权限/配额机制已实现，才启用。
- **Extract to chosen local directory:** 仅在获得明确本地写权限且实现安全解压能力时启用；V1.0 不强制实现。
- 不应假设第三方 LMS 登录允许自动下载 ZIP。课程平台的 URL 作为外部链接；自动下载需单独授权与兼容的 Connector。

### C — Add Existing Resources

手动关联已有 PDF/Markdown/URL/GitHub/Zotero，直接复用 `Resource` 与 `ResourceLink`。

## 4. ZIP 安全预检与恢复

进行任何实际解压或托管导入前，必须：

- 拒绝绝对路径、`..` 路径穿越、反斜杠变体及跨目标目录解析；不跟随 ZIP 内 symlink / hardlink / 特殊设备文件。
- 限制 ZIP 原文件大小、条目数、总解压上限、单文件上限、解压比率、递归嵌套，防止 ZIP Bomb。
- 检测损坏、加密/口令、不可用编码、不支持格式；失败时明确提示并允许重新选择。
- 生成**预览清单**、重复项及预计存储用量，用户确认后才写入。
- 同名冲突采用 Skip / Keep Both / Replace（仅 Managed 且明示后允许）策略；默认禁止覆盖原文件。
- 发生部分失败保留完整错误报告、成功/失败统计及可恢复的导入状态；不能将部分失败显示为成功。
- 任何 ZIP 内可执行文件或脚本均作为静态资源，不执行代码。
- 来源不可信时不自动提取 PDF/Office 宏内容、脚本或执行程序。

技术规范参考：OWASP Path Traversal Prevention 和 OWASP Upload of Malicious Files。

## 5. 分类与目录保留

默认建议分类（可用户调整）：

- Lectures / Skript
- Exercises / Aufgaben
- Tutorials / KGÜ / Tutorium / Lösungen
- Past Papers / Altklausuren / Probeklausur
- Labs / Praktikum / Versuch / Testat
- Notes / Markdown
- Administrative / Organization
- Other

分类仅是**虚拟标签和视图**；保留真实相对路径和树形目录。不能因名称中含 `Exam` 就创建未来的 Exam Assessment，也不能因为路径包含 `Solution` 就标记用户已经完成习题。

建议解析文件名作为低置信度提示（如 `Vorlesung_03.pdf`, `Uebung_05.pdf`, `WS24_Klausur.pdf`），但用户始终能够修改、合并、忽略映射。

展示两个 Materials 视图：

- **By Type**（默认）：Lectures、Exercises、Tutorials、Past Papers、Labs、Notes。
- **Original Folder Tree**：完整保留来源目录层级。

Materials Table 字段：Name、Type、Source、Folder、Last Modified（存在时）、Availability、Linked Notes/Tasks。可搜索文件名、路径、标签；不虚构全文 PDF 检索。

## 6. 课程导入更新与去重

- 一门课程可关联多个资料来源（期中更新 ZIP、补充讲义文件夹等），每个来源有稳定 Source ID。
- 同一 `CourseOffering` 下多次扫描同一来源尽量增量更新，而非每次复制新 `Resource`。
- 匹配顺序建议：已知来源+规范化相对路径+可用文件标识，必要时辅以内容哈希；**文件名相同不代表文件相同**。
- 更新/重新扫描不能静默删除旧学习笔记、Task 关系或资源记录；标记 Missing / Moved / Superseded 并允许修复位置。
- 使用来源快照、变更摘要（Added/Changed/Missing/Unchanged）供用户确认。
- 不同学期的课程资料不默认合并；允许手动跨 Offering 关联复用。
- 本地路径属于设备上下文，不应跨设备当作可直接访问的 URL。

## 7. Course Resource Inspector

沿用模块 002/004/005 的统一 Inspector shell；不重造独立 Drawer。

- 文件名、类型、原始相对路径、来源 ZIP/目录、关联 CourseOffering、来源设备、文件大小/修改时间（可用时）。
- `Open Original`：只有经当前设备验证可访问时启用；浏览器不承诺可以直接启动 Typora、MATLAB 或 VS Code。
- `Open Note`、`Create Study Task`：复用全局 Note/Task；创建 Task 时默认关联当前 CourseOffering 和 Resource。
- `Mark Studied` / `Mark Reviewed`：仅更新当前 CourseOffering 的学习进度记录，不改原始文件。
- `Locate / Repair`：重新授权来源及重新定位，不删除旧学习关系。
- `Make Available on Other Devices`：仅在 Managed Storage 和权限实际存在时才启用，必须由用户确认上传。
- 展示 Source Sync 与 Current-Device Availability 两种独立状态。

## 8. 课程任务、考试、实验及学习记录

- `Task` / `PlannedSession` / `TimeEntry` 为全局现有模型；Research 和 Study 共用唯一 Timer。
- Course 的 study session 与实际 TimeEntry 分开；Calendar 更新不会改 Exam Deadline。
- `Assessment` 支持 Exam、Quiz、Testat、Report、Assignment；仅在明确资料或用户确认后创建真实日期。
- `Past Paper Resource` 是学习资料，不等于实际考试活动或已参加考试。
- `ExerciseProgress` 为习题/章节级独立记录；不能按 PDF 打开次数自动视为掌握。
- `Lab` 作为未来独立模块入口，Course Overview 只显示已知进度与待办，不强制新建整个 Lab 业务数据库。

## 9. 数据模型（逻辑）

- `Course`: id, title, code, department?, defaultTags?
- `CourseOffering`: id, courseId, term, enrollmentStatus, lecturer?, ects?, courseUrl?, progressStatus
- `CourseMaterialSource`: id, courseOfferingId, kind(Folder|Archive|Connected|Manual), deviceId?, sourceUri?, archiveHash?, indexedAt?, permissionState?, importMode
- `CourseMaterialImport`: id, sourceId, status, startedAt, completedAt?, totals, failures[], manifestVersion, initiatedBy
- `CourseMaterialEntry`: id, sourceId, relativePath, entryType, size?, modifiedAt?, fingerprint?, classification?, classificationConfidence?, resourceId?
- `CourseMaterialClassification`: offeringId, resourceId, sectionId, confirmedByUser?, origin(Heuristic|Manual)
- `CourseSection`: id, offeringId, type, label, order
- `CourseResourceLink`: offeringId, resourceId, sourceId?, sectionId?, role?
- `CourseStudyProgress`: offeringId, sectionId?, resourceId?, exerciseId?, state, updatedAt, noteId?
- `CourseAssessment`: id, offeringId, assessmentType, title, officialDateTime?, originalTimezone?, provenance?, registrationStatus?

Reuse—not duplicate: `Resource`, `ResourceLocation`, `ResourceLink`, `Task`, `PlannedSession`, `TimeEntry`, `Note`, `CalendarItem`, `ConnectorState`, `ExternalLink`.

所有正式关联必须使用稳定 ID。不同设备实际文件可用性按 Device/Location 判定。不可把课程源 ZIP 的绝对路径误认为跨设备可用。

## 10. 学习流程示例

1. 为 `Systemtheorie 1`（**演示名称**）创建相应学期的 CourseOffering。
2. 用户从课程平台下载 `course_materials.zip` 并在 Windows 解压。
3. `Link Extracted Folder` → 同意所选目录只读索引 → 预览文件夹。
4. 系统建议将 `Skript/` 映射 Lectures、`Uebung/` 映射 Exercises、`Altklausuren/` 映射 Past Papers。
5. 用户确认映射 → 创建 ResourceLink，不改变硬盘文件。
6. 在 Overview 点击 `Continue Studying` 打开已确认的讲义入口。
7. 在 Resource Inspector 创建 `KGÜ 4` 学习任务；全局 Tasks 和日历复用该 Task ID。
8. 记录 TimeEntry 为学习时间；打开 PDF 并不自动产生实际学习时长。

## 11. UI 样式与可访问性

复用 Research Overview V1.1 warm Beige CSS Variables：Background `#F7F3ED`、Card `#FFFDF9`、Secondary Surface `#F1E9DD`、Border `#DED3C4`、Text `#30281F`、Secondary `#6E6154`、Accent `#77573B`、Hover `#68482F`。Status colors 仅用于语义状态。Responsive target 1440/1024/390。目录树可折叠；手机用卡片与抽屉；确保键盘、状态文字、错误反馈、ARIA/焦点。

## 12. 3 个候选开源复用点（2026-11-21 快照）

| Project | Stars | Latest push | License | Stack | Complexity | Use |
| --- | ---: | --- | --- | --- | --- | --- |
| [zip.js](https://github.com/gildas-lormeau/zip.js) | 3,915 | 2026-11-17 | BSD-3-Clause | JS / web streams | Medium | ZIP 枚举、流式读取、可选解压；需要自身安全策略、大小限制、UX |
| [fflate](https://github.com/101arrowz/fflate) | 3,096 | 2026-05-16 | MIT | TypeScript / JS | Low–Medium | 轻量 ZIP 解析/解压候选；压缩包限制和内存控制仍要自行落实 |
| [JSZip](https://github.com/Stuk/jszip) | 10,400 | 2026-09-09 | 查看仓库 LICENSE（GitHub API 未确认 SPDX） | JS | Low–Medium | 简单 ZIP 目录预览候选；大型压缩包需注意内存与性能 |

**建议：** 若进入实施阶段，先审核当前仓库依赖及许可证，再择一采用，不要三者全部引入。ZIP 库只处理压缩格式，不代替安全导入策略。V1.0 不需要重造完整文件管理器。

## 13. 状态与失败场景

- First-use / No course materials / No source connected。
- ZIP corrupt / Encrypted / Unsupported encoding / Too large / Too many entries / Unsafe path。
- No permission / Browser API unsupported / Local Connector absent。
- Import pending approval / In progress / Partial success / Failed / Cancelled。
- File moved / Missing / Offline on device / Source folder detached。
- Duplicate file and modified new semester version。
- No valid assessment date / Old paper mistaken as real exam。
- Mock-only data must be unmistakably identified; never claim file accessible when not verified。

## 14. 验收标准（设计 V1.0）

1. Course 与 CourseOffering 为不同实体，学期资料不串档。
2. 课程首页正确显示 Continue Studying、Next Actions、Assessments、Materials、Progress、Study Time。
3. 未知 ECTS/Exam/Progress 不生成虚假数值。
4. 可以通过有权限的 `Link Extracted Folder` 建立资源索引。
5. 浏览器或 Connector 不可用时提供明示降级，而非假装扫描成功。
6. 支持 ZIP 选择、目录清单预览与危险条目拦截（如实施 ZIP 功能）。
7. Import 前需要明确用户确认；默认不覆盖原始文件。
8. ZIP 爆炸、路径穿越、Symlink 等危险输入被防护。
9. 保留原始相对路径、文件夹结构和来源身份。
10. 自动分类仅是候选映射，允许手动改动。
11. `Altklausur` 资源不会自动创建未来考试 Deadline。
12. 复用全局 Resource ID；不会按每个课程复制资源本体。
13. 重复扫描不应静默复制同一来源的所有条目。
14. 重扫或文件移动不会删除相关笔记、Tasks 与进度。
15. Sync Status 与当前设备的 File Availability 分离。
16. `Open Original` 仅在有权限且确实可用时启用。
17. Create Study Task 复用全局 Task ID 和当前课程上下文。
18. Course Planning / TimeEntry / Exam Deadline 互相独立。
19. Continue Studying 使用真实最近活动或清楚显示未记录。
20. 不执行 ZIP 中任何脚本或可执行文件。
21. 导入过程存在 Partial/Failed 可诊断状态。
22. 在 1440px、1024px、390px 下可正常浏览。
23. Typecheck / Build / Tests 有真实执行结果，不得把未运行写成 PASS。
24. 不突破模块 007 范围；未来 Exercises/Exams/Labs 的完整功能只保留接口。

## 15. 设计签收与下一步

**设计状态：APPROVED / DESIGN FROZEN（2026-11-21）。** 已批准以下范围：Course Overview、CourseOffering 上下文、课程资料源管理、解压文件夹链接、ZIP 安全预检与索引、虚拟分类、来源树、Resource Inspector、全局任务/日历/时间关联、异常/离线状态、响应式界面；不得擅自扩张至完整 Exercises / Exams / Labs 业务模块。

**实施状态：ON HOLD — AWAITING AUDIT A01。** 用户明确要求在 Audit A01 完成前不开始模块 007 的代码实现，也**暂不生成**增量执行指令 007 或 ZIP Handoff 007。

**后续交付门槛：**

1. 执行窗口交付 Audit A01 的模块实况、跨模块集成问题、测试证据及优先级修复计划。
2. 设计窗口审阅审核报告，确认模块 005 的 Resource/Connector/Inspector、全局 Task/Calendar/Timer 等共享契约以及必须先修复的阻断项。
3. 依据实际代码状态编写 `Execution_Instruction_007_Study_Course_Overview_V1.0.md`，明确适配/复用策略和前置修复依赖；如审核揭示需变更产品设计，则先另行批准修订，不得悄悄修改此冻结版本。
4. 再打包本 `APPROVED` 文件与执行指令为 `Study_Course_Overview_Handoff_007.zip`，经用户交付执行窗口后才开始模块 007 的开发。

**审批边界：设计确认 ≠ 实施授权；不得以本文件作为立即编码的依据。**
