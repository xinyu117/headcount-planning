# 推荐生成顺序

1. 需求分析与问题澄清（不写代码）。
2. 数据模型与数据库 migration。
3. 后端模块骨架与领域服务。
4. 认证、角色、功能权限和数据范围。
5. Flowable 流程定义、任务分配、驳回重提。
6. REST API 与集成测试。
7. Vue 页面、路由和状态管理。
8. SuccessFactors 连接器（租户元数据确认后）。
9. 端到端测试、权限测试和部署文档。


## UI 页面任务（V1.2）
页面任务必须同时读取 pages.json、transitions.json、actions.json、components.json 与 architecture/ui-design.md；先核对页面迁移、打开方式、参数/返回值和权限，再生成 Vue Router、Dialog、Drawer、组件及测试。完成后运行 `node scripts/validate_specs.mjs`。
