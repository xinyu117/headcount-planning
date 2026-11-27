# UI 设计与实现规范（V1.2）

## 1. 目标与边界
UI 规格是可执行设计输入，不是截图级像素稿。它定义页面身份、布局区域、导航迁移、打开容器、参数/返回值、动作及公共组件契约。具体视觉细节由 Vue 组件实现，不能反向改变业务规则。

## 2. 页面类型与打开方式
页面类型由 `pages.json` 的 `pageType` 唯一决定；一次导航的打开方式由 `transitions.json` 的 `openMode` 决定，避免在页面和迁移两处重复配置。

| pageType | 用途 | 合法 openMode | route |
|---|---|---|---|
| PAGE | 独立路由页面 | SAME_TAB、NEW_TAB | 必须 |
| DIALOG | 模态对话框 | MODAL | 不配置 |
| DRAWER | 抽屉 | DRAWER | 不配置 |
| INLINE_PANEL | 页面内展开面板 | INLINE | 不配置 |

- SAME_TAB：在当前 SPA 标签页内切换路由。
- NEW_TAB：打开独立浏览器标签页，只允许 PAGE。
- MODAL：使用 Element Plus Dialog；必须明确关闭、遮罩和 Escape 行为。
- DRAWER：使用 Element Plus Drawer；必须明确位置、尺寸和模态行为。
- INLINE：在来源页面内展开/折叠，不创建路由。
- 直接 URL 进入仅适用于 PAGE；DIALOG/DRAWER/INLINE_PANEL 必须由迁移打开。

## 3. 页面迁移
每条迁移必须有唯一 ID、来源页、目标页、触发器、打开方式和参数映射。
`parameterMapping` 的 key 是目标页参数名，value 是前端上下文表达式；表达式仅允许在已声明上下文中解析，禁止 eval/Function。
覆盖层页面可定义 `returnMapping` 和 `returnEvent`；用户确认后才将返回值写回来源页面。取消、关闭、遮罩关闭不得伪装成确认返回。

## 4. 页面布局
页面由 `layout.type` 和 `layout.areas` 描述。区域按数组顺序渲染；每个区域通过 `componentRefs` 引用公共组件。复杂布局可由页面专属组件组合，但必须在规格中标识区域和职责。
常见区域：SEARCH_FORM、TOOLBAR、DATA_TABLE、PAGINATION、FORM、TREE、TIMELINE、ACTION_BAR、PROFILE。

## 5. 动作与 API
- API 动作必须引用 `api-spec.json` 中存在的 `apiId`；HTTP 方法必须与 API 定义一致。
- NAVIGATION 动作必须引用存在的 `transitionId`。
- 提交、驳回、删除等不可逆或重要操作应定义确认提示。
- success/failure 分别定义成功和失败行为；不得仅依赖前端提示代替后端结果。
- 权限必须在后端执行；前端按钮隐藏和路由守卫只是体验层控制。

## 6. 公共组件
组件以稳定 `id` 被页面区域引用。props/events 是组件契约；实际 Vue 文件名记录在 implementation.component。公共组件不得绕过模块 API 直接访问数据库或其他模块内部实现。

## 7. Vue 3 实现建议
- 路由页：Vue Router；弹窗/抽屉/内嵌面板通过统一 OverlayHost 或组件状态管理。
- API 调用集中在 typed API client；页面组件不拼接 URL。
- 表单使用 TypeScript 类型、前端校验和服务端校验；服务端校验结果映射到字段。
- 打开覆盖层时创建独立上下文；确认时显式 emit typed result；取消时返回 cancelled 状态。
- 迁移和动作 ID 应可在日志中追踪，便于 UI 行为测试。
- 不得把 `parameterMapping` 字符串当作任意 JavaScript 执行。

## 8. 可访问性与响应式
键盘焦点进入弹窗后应被限制在弹窗内，关闭后返回触发控件；按钮有可读名称；表格支持键盘操作。规格中 responsive 标记不代表移动端布局已自动完成，需单独测试断点。
