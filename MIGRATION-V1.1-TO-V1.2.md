# V1.1 → V1.2 迁移说明

- 保留原有模块、工作流、数据模型、API、SuccessFactors 集成和需求追踪内容。
- 项目规格版本升级为 1.2；未变更的模块/工作流/数据模型/API/集成文档继续使用各自的 1.1 schemaVersion。
- UI 从单一 `pages.json` 升级为 pages/transitions/actions/components 四份规格。
- `specifications/project.json` 的 `documentRefs.ui` 指向 `ui/ui-index.json`；各 UI 文档路径由索引统一管理。
- `schemas/ui.schema.json` 保留为 UI 索引 Schema；页面、迁移、动作、组件分别使用 `ui-page.schema.json`、`ui-transition.schema.json`、`ui-action.schema.json`、`ui-component.schema.json`。
- 页面类型和打开方式分离：页面定义 `pageType`；迁移定义 `openMode`。
- 运行 `node scripts/validate_specs.mjs` 执行 JSON Schema 与跨文件引用校验；Node.js 18+，无需额外依赖。
