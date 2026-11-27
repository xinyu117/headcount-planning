# Headcount Planning Specification — V1.2

本规格包用于指导 AI/Codex/Claude Code 分阶段生成「人力预算与编制计划管理系统」。

## 技术栈
- Backend: Java 21 + Spring Boot 3
- Frontend: Vue 3 + TypeScript + Element Plus
- Database: MySQL 8
- Workflow: Flowable
- Authentication/Authorization: Spring Security + jCasbin
- Architecture: Modular Monolith

## V1.2 更新
V1.2 在 V1.1 业务规格基础上，重点将 UI 规格拆分为四个相互引用的文档：
- `specifications/ui/pages.json`：页面类型、路由、权限、参数、布局区域、返回值。
- `specifications/ui/transitions.json`：来源/目标页面、触发器、打开方式、参数和返回值映射。
- `specifications/ui/actions.json`：API/导航/本地/工作流动作，以及确认、成功、失败行为。
- `specifications/ui/components.json`：公共组件、props、events 和 Vue 实现映射。

对应 JSON Schema 位于 `schemas/ui-*.schema.json`。原 `schemas/ui.schema.json` 保留为 UI 文档索引 Schema。
页面打开方式只在 transition 定义，页面类型只在 page 定义，避免重复配置冲突。

## 目录
- `schemas/`：JSON Schema
- `specifications/`：项目、模块、工作流、数据模型、API、UI、外部集成规格
- `architecture/`：架构设计
- `ai-development/`：AI 开发规范
- `scripts/validate_specs.mjs`：Schema 与跨文件引用校验（Node.js，无第三方依赖）

## 校验
需要 Node.js 18+：
```bash
node scripts/validate_specs.mjs
```

## 重要约束
- SuccessFactors OData 实体和字段必须以目标租户 `$metadata`、API 权限和实际响应为准，不得猜测。
- `specifications/open-questions.md` 中未决事项不得由 AI 擅自补全。
- 本包版本为 1.2；未修改的模块、工作流、数据模型等文档仍使用其各自 schemaVersion 1.1。项目索引和 UI 文档为 1.2。
