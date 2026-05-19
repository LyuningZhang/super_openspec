# OpenSpec Custom Workflow Changes

## 目标

将全局 OpenSpec 调整为更适合深入需求分析和 spec-driven development 的流程，使之后执行 `openspec init` 时直接生成新的默认能力。

目标流程：

```text
explore -> propose -> apply -> review -> sync -> archive
```

核心约束：

- 先 `explore` 深入探索，再 `propose` 生成计划和 artifacts。
- 如果用户跳过 `explore` 直接 `propose`，`propose` 内部必须补做 compact explore。
- `explore` 融合 brainstorming 和 grill-me 的深挖、追问、风险暴露能力。
- `apply` 融合 spec-driven-development、test-first、incremental implementation。
- 不再使用 `verify`，改为 `review`。
- `review` 只做实现审查，不自动 archive。
- `archive` 只能由用户显式执行。

## 工作流改动

### 1. Core profile

文件：

- `src/core/profiles.ts`

改动：

```ts
export const CORE_WORKFLOWS = ['explore', 'propose', 'apply', 'review', 'sync', 'archive'] as const;
```

效果：

- `openspec config profile core`
- `openspec init`
- `openspec update --force`

都会使用新的 core workflow 顺序。

### 2. Explore

文件：

- `src/core/templates/workflows/explore.ts`

增强点：

- `explore` 明确成为需求探索阶段，不允许实现。
- 融合 brainstorming：
  - 发散方案
  - 明确用户目标
  - 识别成功标准
  - 收敛到可执行方向
- 融合 grill-me：
  - 追问隐含假设
  - 暴露风险和依赖
  - 检查边界条件
  - 压测方案是否足够具体
- 鼓励读取代码、搜索现有实现、分析真实约束。
- 结束时推荐进入 `/opsx:propose <change-name>`。

### 3. Propose

文件：

- `src/core/templates/workflows/propose.ts`

增强点：

- 默认认定推荐流程是先 `/opsx:explore`，再 `/opsx:propose`。
- 如果用户直接运行 `/opsx:propose`，propose 阶段会先执行 compact explore：
  - 快速补齐需求探索
  - 做关键追问
  - 整理假设、风险、非目标
  - 再生成 proposal/design/specs/tasks
- propose 会生成直到 apply-ready 所需的 artifacts。

### 4. Apply

文件：

- `src/core/templates/workflows/apply-change.ts`

这次已经重写，不再只是简单按 tasks 实现。

新版 apply 规则：

- OpenSpec artifacts 是实现合同。
- 实现前必须读取 `contextFiles`：
  - proposal
  - specs
  - design
  - tasks
- 修改代码前必须建立 `Contract map`：
  - objective
  - requirements
  - design decisions
  - task order
  - acceptance criteria
  - verification commands
- 每个 task 按小切片实现。
- 行为变更和 bugfix 优先 test-first。
- bugfix 必须先写复现测试。
- 没有自动化测试条件时，要说明原因并运行最强可用验证。
- 只有验证通过后才能把 task 从 `- [ ]` 改成 `- [x]`。
- 完成后只建议：

```text
/opsx:review <change-name>
```

- 不自动 sync。
- 不自动 archive。

### 5. Review

文件：

- `src/core/templates/workflows/review-change.ts`

新增 `review` 阶段，替代旧的 `verify`。

review 的职责：

- 对照 OpenSpec artifacts 审查实现。
- 检查 proposal/specs/design/tasks 是否都被满足。
- 检查实现是否越界、漏做、过度实现。
- 检查测试和验证是否足够。
- 输出 review findings、风险和后续建议。

限制：

- 不自动 archive。
- 不自动 sync。
- 不自动 mark tasks complete。
- review 结束后可以建议下一步，但不替用户执行。

### 6. Verify 移除

相关文件：

- 删除 `src/core/templates/workflows/verify-change.ts`
- 在 workflow 映射、生成逻辑、清理逻辑、测试中替换为 `review`

兼容处理：

- 旧项目中已有的 `verify` artifacts 会被 cleanup 逻辑清理。
- 新项目不会再生成 `openspec-verify-change`。

## Init 和 Update 行为

### 新项目

执行：

```powershell
openspec init
```

会直接生成 core workflow：

```text
openspec-explore
openspec-propose
openspec-apply-change
openspec-review-change
openspec-sync-specs
openspec-archive-change
```

不会生成：

```text
openspec-verify-change
```

### 旧项目

执行：

```powershell
openspec update --force
```

会刷新已配置工具的 skills / commands。

当前项目已执行：

```powershell
openspec update --force
```

已更新：

- Claude Code
- Codex

## 一键安装脚本

文件：

- `install-openspec-local.bat`

用途：

从 `G:\git\OpenSpec` 本地源码重新 build，并替换全局安装的 `@fission-ai/openspec`。

执行方式：

```powershell
cd G:\git\OpenSpec
.\install-openspec-local.bat
```

脚本执行内容：

1. 检查 `node` 和 `npm`
2. 执行 `npm install`
3. 执行 `npm run build`
4. 卸载旧的全局 `@fission-ai/openspec`
5. 使用当前源码目录执行全局安装
6. 设置全局 profile 为 `core`
7. 输出 `where openspec`、版本和 npm 全局目录

注意：

- Windows `.bat` 中调用 `npm` / `openspec` 必须使用 `call`，否则可能提前退出。
- `%~dp0` 已规范化为无尾部反斜杠路径，避免 npm 把路径解析错误。

## 当前全局配置

已设置为：

```yaml
profile: core
delivery: both
workflows:
  - explore
  - propose
  - apply
  - review
  - sync
  - archive
```

确认命令：

```powershell
openspec config list
```

## 当前安装结果

全局 `openspec` 来源：

```text
C:\Users\zhanglvning\AppData\Roaming\npm\openspec
C:\Users\zhanglvning\AppData\Roaming\npm\openspec.cmd
```

全局 npm 包指向本地源码：

```text
@fission-ai/openspec@1.3.1 -> G:\git\OpenSpec
```

Codex 全局 prompts 已更新：

```text
C:\Users\zhanglvning\.codex\prompts\opsx-explore.md
C:\Users\zhanglvning\.codex\prompts\opsx-propose.md
C:\Users\zhanglvning\.codex\prompts\opsx-apply.md
C:\Users\zhanglvning\.codex\prompts\opsx-review.md
C:\Users\zhanglvning\.codex\prompts\opsx-sync.md
C:\Users\zhanglvning\.codex\prompts\opsx-archive.md
```

当前项目 Codex skill 已更新：

```text
G:\project\client_oversea_trunk\.codex\skills\openspec-apply-change\SKILL.md
```

## 验证结果

已执行：

```powershell
npm run build
npm test
```

结果：

```text
npm run build passed
npm test passed
74 test files passed
1480 tests passed
9 skipped
```

临时目录 `openspec init --tools codex --force` 验证结果：

- 生成 6 个核心 skills
- 包含 `openspec-review-change`
- 不包含 `openspec-verify-change`
- init 提示从 explore 开始

## 后续使用

新项目：

```powershell
openspec init
```

旧项目：

```powershell
openspec update --force
```

修改 OpenSpec 源码后重新替换全局版本：

```powershell
cd G:\git\OpenSpec
.\install-openspec-local.bat
```

然后重启 IDE / agent 会话，让新的 slash prompts 和 skills 重新加载。
