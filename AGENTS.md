# AI Agent 开发规则（规格包 V1.2）

## 任务开始前必须读取
1. `README.md`、`specifications/project.json`、`specifications/open-questions.md`、`specifications/traceability.json`。
2. 任务涉及模块的 `specifications/modules/*.json`，以及其 `dependencies` 指向的模块。
3. 涉及流程时读取 `specifications/workflows/`；数据库读取 `specifications/data-model/`；接口读取 `specifications/api/`；页面任务必须同时读取 `specifications/ui/pages.json`、`transitions.json`、`actions.json`、`components.json` 和 `architecture/ui-design.md`；外部数据读取 `specifications/integration/`。
4. 读取相关 `architecture/` 和 `ai-development/` 文档。

## 工作规则
- 需求文档是业务依据；TBD、冲突或缺少关键规则时先提问，不得猜测。
- 编码前输出需求 ID、影响模块、拟修改文件、数据/API/UI/流程影响和测试计划；除非用户明确要求直接实施，否则等待确认。
- 不一次生成整个系统，按可测试的垂直切片开发。
- 每个需求 ID 必须可追踪到代码、API、页面和测试。
- 每次实施后运行 `python scripts/validate_specs.py`，并运行受影响测试/构建；如未运行必须如实说明。
- 需求变更同步更新需求 JSON、相关规格和测试。
- 后端必须执行授权；前端隐藏按钮/路由不构成安全边界。
- 数据库变更通过版本化 migration；禁止直接修改生产库。
- 不得凭空假设 SuccessFactors OData 实体或字段。

## UI 规格专用规则
- `pageType` 只在页面定义；`openMode` 只在迁移定义。
- 页面迁移的 from/to、actionId、transitionId、apiId、targetPageId 和 componentRefs 必须通过校验。
- 禁止 `NEW_TAB` 打开覆盖层页面；MODAL/DRAWER/INLINE 必须与目标 pageType 匹配。
- `parameterMapping` / `returnMapping` 是受控表达式映射，不得使用 eval 或执行任意代码。
- 页面区域只引用 `components.json` 中已定义的组件。
- API 动作引用 API 规格中存在的 ID，并保持 HTTP 方法一致。
