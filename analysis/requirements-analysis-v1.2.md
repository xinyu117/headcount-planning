# 人力预算与编制计划管理系统需求分析（V1.2）

## 0. 阅读范围与结论口径

本报告基于以下文档：

- 项目索引：[README.md](../README.md)、[project.json](../specifications/project.json)
- 待确认事项与追踪：[open-questions.md](../specifications/open-questions.md)、[traceability.json](../specifications/traceability.json)
- 模块：[plan.json](../specifications/modules/plan.json)、[organization.json](../specifications/modules/organization.json)、[person.json](../specifications/modules/person.json)、[position.json](../specifications/modules/position.json)、[account.json](../specifications/modules/account.json)、[security.json](../specifications/modules/security.json)
- 流程、数据、API、UI、集成：[headcount-approval.json](../specifications/workflows/headcount-approval.json)、[entities.json](../specifications/data-model/entities.json)、[api-spec.json](../specifications/api/api-spec.json)、[pages.json](../specifications/ui/pages.json)、[transitions.json](../specifications/ui/transitions.json)、[actions.json](../specifications/ui/actions.json)、[components.json](../specifications/ui/components.json)、[successfactors.json](../specifications/integration/successfactors.json)
- 架构与 AI 开发约束：[system-architecture.md](../architecture/system-architecture.md)、[database-design.md](../architecture/database-design.md)、[authorization-design.md](../architecture/authorization-design.md)、[ui-design.md](../architecture/ui-design.md)、[development-rules.md](../ai-development/development-rules.md)、[coding-standards.md](../ai-development/coding-standards.md)、[generation-workflow.md](../ai-development/generation-workflow.md)

结论标识：

- **已定义**：文档中存在明确字段、状态、动作、权限或关系。
- **推断**：为实现已定义功能所必需的衍生结论，但文档没有直接定义。
- **TBD**：文档明确未决，不能作为已确认业务规则。

当前 `node scripts/validate_specs.mjs` 通过，识别结果为 6 个项目模块、10 个 UI 页面、11 个迁移、15 个动作、18 个组件和 8 个 API。该校验只检查 Schema 与静态引用，不证明业务规则完整。

## 1. 系统功能模块清单

| 模块 | 已定义功能 | 需求编号 | 页面/API 覆盖 | 成熟度与说明 |
|---|---|---|---|---|
| 计划管理 `plan` | 创建计划、按组织和职位填报人数/预算/说明、提交审批、驳回后修改并重提、批准 | PLAN-001、PLAN-002、PLAN-003、PLAN-004、PLAN-005 | 计划工作台、新建、详情、审批工作台、审批详情；8 个计划 API | 唯一具有较完整需求、UI 和 API 链路的模块。预算、FTE、计划组织范围及审计/版本模型仍缺失。来源：[plan.json](../specifications/modules/plan.json)、[pages.json](../specifications/ui/pages.json)、[api-spec.json](../specifications/api/api-spec.json) |
| 组织管理 `organization` | 维护多层级组织；组织编码唯一；禁止父子循环；维护有效期并支持按日期还原结构 | ORG-001、ORG-002 | 组织维护页和组织选择对话框；无组织 API | 页面和需求存在，但实体缺有效期字段，且目前只能查看、无保存动作。来源：[organization.json](../specifications/modules/organization.json)、[entities.json](../specifications/data-model/entities.json)、[pages.json](../specifications/ui/pages.json) |
| 人员管理 `person` | 维护人员基础信息及组织归属；从 SuccessFactors 同步约定人事数据 | PER-001、PER-002 | 人员快速查看抽屉；无人员 API | PER-001 已确认；PER-002 为 TBD，实体仅有人员编码、组织等少量字段。来源：[person.json](../specifications/modules/person.json)、[components.json](../specifications/ui/components.json) |
| 职务与职位管理 `position` | 维护职位编码、名称、所属组织和有效期；职位关联计划编制数据 | POS-001、POS-002 | 无独立页面、无职位 API | 需求存在，实体只有编码和组织；名称、有效期及职位管理能力尚未落到数据/API/UI。来源：[position.json](../specifications/modules/position.json)、[entities.json](../specifications/data-model/entities.json) |
| 账号管理 `account` | 管理员创建、停用、启用账号；账号唯一关联人员 | ACC-001、ACC-002 | 无账号页面、无账号 API | 需求存在，实体只有用户名和可空人员引用，缺启用状态、唯一约束及会话失效规则。来源：[account.json](../specifications/modules/account.json)、[entities.json](../specifications/data-model/entities.json) |
| 权限与角色管理 `security` | 维护角色与功能权限；按组织范围限制数据访问；越权 API 必须拒绝 | SEC-001、SEC-002 | 角色权限管理页；无角色/授权 API | 只有页面级 `ROLE_ADMIN` 和权限矩阵组件；没有角色、权限、用户角色、数据范围实体或保存动作。来源：[security.json](../specifications/modules/security.json)、[pages.json](../specifications/ui/pages.json)、[authorization-design.md](../architecture/authorization-design.md) |
| SuccessFactors 集成（支持能力） | 通过 OData 同步人员及组织相关主数据 | PER-002；不是项目 `modules` 中的独立模块 | 仅定义 `SF-PERSON-SYNC` 数据流 | 目标系统、方向和用途明确；实体、字段、认证、分页、增量机制均未确认。来源：[successfactors.json](../specifications/integration/successfactors.json)、[project.json](../specifications/project.json) |

结论：当前可形成端到端业务切片的只有计划管理与审批。组织、人员、职位、账号和权限主要是能力性需求，尚不具备完整的 API/UI/数据模型实现依据。依据：[project.json](../specifications/project.json) 的 `modules`、各模块 `requirements`、[api-spec.json](../specifications/api/api-spec.json)、[pages.json](../specifications/ui/pages.json)。

## 2. 模块依赖关系

以下依赖直接来自各模块文件的 `dependencies`，不是根据模块名称推测：

| 模块 | 依存模块 | 证据 |
|---|---|---|
| 计划 `plan` | 组织、职位、人员、权限 | [plan.json](../specifications/modules/plan.json) 的 `dependencies`；对应 PLAN-001、PLAN-002、PLAN-003、PLAN-005 |
| 组织 `organization` | 无 | [organization.json](../specifications/modules/organization.json) 的 `dependencies`；对应 ORG-001、ORG-002 |
| 人员 `person` | 组织、账号 | [person.json](../specifications/modules/person.json) 的 `dependencies`；对应 PER-001、PER-002 |
| 职位 `position` | 组织 | [position.json](../specifications/modules/position.json) 的 `dependencies`；对应 POS-001、POS-002 |
| 账号 `account` | 人员、权限 | [account.json](../specifications/modules/account.json) 的 `dependencies`；对应 ACC-001、ACC-002 |
| 权限 `security` | 组织、账号 | [security.json](../specifications/modules/security.json) 的 `dependencies`；对应 SEC-001、SEC-002 |

声明依赖图：

```text
plan ────────────> organization
  ├──────────────> position ──────> organization
  ├──────────────> person <──────> account
  │                    │             │
  │                    └──> account  │
  │                                  ├──> person
  │                                  └──> security
  └──────────────> security ────────> organization
                               └─────> account
```

存在两个相互依赖环：

1. `person -> account -> person`。
2. `account <-> security`，且两者都依赖组织/账号/人员。

这表示模块边界不能按单向层次直接编译为独立模块。建议在模块化单体内部通过领域接口和依赖倒置切断环，例如账号认证适配器、授权策略端口，而不是形成双向实体仓储调用。该建议是对 [system-architecture.md](../architecture/system-architecture.md) 中“模块化单体 + 分层”的实现约束，涉及 ACC-001、ACC-002、SEC-001、SEC-002。

## 3. 数据库实体及关系

### 3.1 已定义实体

| 实体/表 | 已定义字段 | 需求关联 | 备注 |
|---|---|---|---|
| `Plan` / `hc_plan` | `id`、`plan_code`、`period`、`status` | PLAN-001、PLAN-002、PLAN-003、PLAN-004、PLAN-005 | 概念主表；没有组织/部门、版本、审批实例、审计字段。来源：[entities.json](../specifications/data-model/entities.json) |
| `PlanItem` / `hc_plan_item` | `id`、`plan_id`、`organization_id`、`position_id`、`planned_headcount` | PLAN-002；POS-002 | 计划明细；只有人数，没有 FTE、预算、说明或人员引用。来源：[entities.json](../specifications/data-model/entities.json) |
| `Organization` / `hc_organization` | `id`、`org_code`、`parent_id` | ORG-001、ORG-002 | `parent_id` 未声明自引用元数据；没有名称和有效期。来源：[entities.json](../specifications/data-model/entities.json) |
| `Position` / `hc_position` | `id`、`position_code`、`organization_id` | POS-001、POS-002 | 没有名称和有效期。来源：[entities.json](../specifications/data-model/entities.json) |
| `Person` / `hc_person` | `id`、`person_code`、`organization_id` | PER-001、PER-002 | 仅基础档案概念；没有姓名、在职状态、入职/离职信息。来源：[entities.json](../specifications/data-model/entities.json) |
| `Account` / `hc_account` | `id`、`username`、`person_id` | ACC-001、ACC-002 | `person_id` 可空且无唯一约束；没有启用状态。来源：[entities.json](../specifications/data-model/entities.json) |

当前数据模型明确是概念模型，不是生产 DDL；表名约定、审计字段、唯一约束、软删除、时间语义和并发控制仅被列为必须明确的事项。来源：[database-design.md](../architecture/database-design.md)。

### 3.2 关系

```text
Organization(parent_id) 1 ── N Organization
Organization 1 ── N Position
Organization 1 ── N Person
Plan 1 ── N PlanItem
PlanItem N ── 1 Organization
PlanItem N ── 0..1 Position
Person 1 ── ? Account
```

- `Plan -> PlanItem -> Organization/Position` 是明确引用。来源：[entities.json](../specifications/data-model/entities.json)、PLAN-002、POS-002。
- `Person -> Organization` 是明确引用。来源：[entities.json](../specifications/data-model/entities.json)、PER-001。
- `Account -> Person` 的字段允许空值，但 ACC-002 要求账号关联人员且关联唯一；因此预期应为 `Person 1 -> 0..1 Account` 或通过唯一约束保证一对一，尚未由模型落实。来源：[account.json](../specifications/modules/account.json)、[entities.json](../specifications/data-model/entities.json)。
- `Plan` 与 `Person`、`Position` 没有直接字段关系；计划通过明细关联组织和职位。来源：[entities.json](../specifications/data-model/entities.json)。
- 角色、权限、策略、用户角色、组织数据范围、审批历史、同步日志均没有实体定义。这直接影响 SEC-001、SEC-002、PLAN-002、PLAN-004、PER-002。来源：[entities.json](../specifications/data-model/entities.json)、[authorization-design.md](../architecture/authorization-design.md)。

## 4. 用户角色和权限矩阵

### 4.1 文档中实际出现的权限

| 权限 ID | 作用点 | 证据 |
|---|---|---|
| `PLAN_VIEW` | 计划工作台、计划详情、计划列表/详情 API | [pages.json](../specifications/ui/pages.json) 的 `PLAN-WORKSPACE`、`PLAN-DETAIL`；[api-spec.json](../specifications/api/api-spec.json) 的 `API-PLAN-LIST`、`API-PLAN-GET`；PLAN-001 至 PLAN-005 |
| `PLAN_CREATE` | 新建计划页、创建 API | [pages.json](../specifications/ui/pages.json) 的 `PLAN-NEW`；[api-spec.json](../specifications/api/api-spec.json) 的 `API-PLAN-CREATE`；PLAN-001 |
| `PLAN_EDIT` | 更新计划草稿 API | [api-spec.json](../specifications/api/api-spec.json) 的 `API-PLAN-UPDATE`；PLAN-002 |
| `PLAN_SUBMIT` | 提交审批 API | [api-spec.json](../specifications/api/api-spec.json) 的 `API-PLAN-SUBMIT`；PLAN-003 |
| `PLAN_APPROVE` | 审批待办/详情页、待办查询、批准、驳回 | [pages.json](../specifications/ui/pages.json) 的 `PLAN-APPROVAL-WORKSPACE`、`PLAN-APPROVAL-DETAIL`；[api-spec.json](../specifications/api/api-spec.json) 的 `API-PLAN-APPROVAL-TASKS`、`API-PLAN-APPROVE`、`API-PLAN-REJECT`；PLAN-004、PLAN-005 |
| `ORG_VIEW` | 组织维护页和组织选择器 | [pages.json](../specifications/ui/pages.json) 的 `ORG-MAINTENANCE`、`ORG-SELECT-DIALOG`；ORG-001、ORG-002 |
| `PERSON_VIEW` | 人员快速查看抽屉 | [pages.json](../specifications/ui/pages.json) 的 `PERSON-QUICK-VIEW`；PER-001 |
| `ROLE_ADMIN` | 角色权限管理页 | [pages.json](../specifications/ui/pages.json) 的 `SECURITY-ROLE`；SEC-001、SEC-002 |

文档没有定义角色实体或角色到权限的正式映射。唯一出现的角色代码是流程分配的 `PLAN_APPROVER`。来源：[headcount-approval.json](../specifications/workflows/headcount-approval.json) 的 `AR-APPROVER`。

### 4.2 实验用角色矩阵

下表是**根据权限作用点和需求推导的实验矩阵**，不是已确认的生产角色设计。问号表示文档没有足够规则决定。

| 实验角色 | 角色依据 | 计划查看 | 创建/编辑/提交 | 审批 | 组织查看 | 人员查看 | 角色管理 | 数据范围 |
|---|---|---|---|---|---|---|---|---|
| 计划申请人 `PLAN_APPLICANT`（推断） | PLAN-001 至 PLAN-004 的“计划制定者/申请人” | 是 | 是 | 否 | 选择组织需要 | 按是否允许查看人员决定 | 否 | 自身的组织范围；继承规则 TBD |
| 计划审批人 `PLAN_APPROVER`（流程已给角色代码） | `AR-APPROVER`、PLAN-004、PLAN-005 | **必须**，因为审批详情调用 `API-PLAN-GET` 授权为 `PLAN_VIEW` | 否 | 是 | 审批查看所需范围 TBD | 审批查看所需范围 TBD | 否 | 部门角色；部门赋值和下级范围 TBD |
| 组织管理员 `ORG_ADMIN`（推断） | ORG-001、ORG-002 | 否 | 否 | 否 | 是 | 否 | 否 | 组织维护范围 TBD；当前无编辑权限 ID |
| 安全管理员 `SECURITY_ADMIN`（推断） | SEC-001、SEC-002 | 否 | 否 | 否 | 组织范围配置需要 | 否 | 是 | 跨组织策略配置范围 TBD |
| 账号管理员 `ACCOUNT_ADMIN`（推断） | ACC-001、ACC-002 | 否 | 否 | 否 | 否 | 关联人员需要 | 否 | 当前无对应权限 ID、页面或 API |
| 只读查看者 `PLAN_VIEWER`（可选） | `PLAN_VIEW` 的存在 | 是 | 否 | 否 | 否 | 否 | 否 | 组织数据范围；SEC-002 |

安全边界必须由后端执行，页面隐藏按钮不构成授权。来源：[ui-design.md](../architecture/ui-design.md) 第 5 节、[authorization-design.md](../architecture/authorization-design.md)、SEC-002。

## 5. 工作流执行过程

流程定义：[headcount-approval.json](../specifications/workflows/headcount-approval.json) 的 `WF-HEADCOUNT-APPROVAL`。

| 当前状态 | 动作 | 操作者 | API/动作 | 下一状态 | 业务结果 |
|---|---|---|---|---|---|
| `DRAFT` 草稿 | 保存/修改 | 计划申请人 | `ACT-UPDATE-PLAN` / `API-PLAN-UPDATE` | `DRAFT` | 计划及明细可重新打开；修改应可追踪。PLAN-002 |
| `DRAFT` | 提交 | 计划申请人 | `ACT-SUBMIT-PLAN` / `API-PLAN-SUBMIT`，迁移 `T-SUBMIT` | `IN_REVIEW` | 状态变为审批中并生成待办。PLAN-003 |
| `IN_REVIEW` 审批中 | 查询待办 | `PLAN_APPROVER` | `ACT-LOAD-APPROVAL-TASKS` / `API-PLAN-APPROVAL-TASKS` | `IN_REVIEW` | 返回当前用户的待办计划。PLAN-004、PLAN-005 |
| `IN_REVIEW` | 批准 | `PLAN_APPROVER` | `ACT-APPROVE-PLAN` / `API-PLAN-APPROVE`，迁移 `T-APPROVE` | `APPROVED` | 计划已批准，当前审批任务完成。PLAN-005 |
| `IN_REVIEW` | 驳回 | `PLAN_APPROVER` | `ACT-REJECT-PLAN` / `API-PLAN-REJECT`，迁移 `T-REJECT` | `RETURNED` | 驳回意见必填。PLAN-004 |
| `RETURNED` 已驳回 | 修改 | 申请人 | `ACT-UPDATE-PLAN` / `API-PLAN-UPDATE` | `RETURNED` | 允许修改；修改记录应可追踪。PLAN-004、PLAN-002 |
| `RETURNED` | 再次提交 | 申请人 | `ACT-SUBMIT-PLAN` / `API-PLAN-SUBMIT`，迁移 `T-RESUBMIT` | `IN_REVIEW` | 重新生成审批待办。PLAN-003、PLAN-004 |
| `APPROVED` 已批准 | 无后续迁移 | 无 | 无 | `APPROVED` | 流程结束。PLAN-005 |

审批任务分配规则为：

```text
departmentId = ${plan.departmentId}
roleCode = PLAN_APPROVER
fallback = null
```

依据：[headcount-approval.json](../specifications/workflows/headcount-approval.json) 的 `AR-APPROVER`。但计划实体没有 `departmentId`；找不到审批人时的业务行为也未定义。因此当前只能确认“单级、按部门角色的审批意图”，不能确认可执行的审批路由。

## 6. SuccessFactors 数据集成关系

| 关系 | 当前定义 | 状态 | 证据 |
|---|---|---|---|
| 系统 | SAP SuccessFactors，OData API | 元数据 `TENANT_VALIDATION_REQUIRED` | [successfactors.json](../specifications/integration/successfactors.json) 的 `SUCCESSFACTORS` |
| 数据方向 | SuccessFactors -> Headcount Planning | 已定义 | 同一文件的 `SF-PERSON-SYNC` |
| 同步用途 | 同步人员及组织相关主数据 | 已定义 | `SF-PERSON-SYNC`、PER-002 |
| 目标领域 | 人员档案、组织归属 | 可从用途和实体推断 | [person.json](../specifications/modules/person.json)、[entities.json](../specifications/data-model/entities.json) |
| 字段映射 | 未定义，状态 `TBD` | 禁止猜测 | `SF-PERSON-SYNC.fieldMappingStatus`、PER-002、OQ-09 |
| 增量/分页/认证/限流 | 未定义 | 禁止猜测 | `SF-PERSON-SYNC.notes`、OQ-09 |
| 同步结果记录 | 要求记录成功/失败及时间 | 未建模 | PER-002 验收标准；数据模型无同步日志实体 |
| 职位主数据 | 没有明确由 SuccessFactors 同步 | TBD，不能推断 | `SF-PERSON-SYNC` 只写人员及组织相关主数据；POS-001、POS-002 |

SuccessFactors 不得反向成为未确认字段的“事实来源”。正式映射必须在目标租户 `$metadata`、API 权限和实际响应确认后更新规格。依据：[successfactors.json](../specifications/integration/successfactors.json) 和 [README.md](../README.md) 的“重要约束”。

## 7. 当前需求中的矛盾和不明确事项

### 7.1 明确冲突或实现缺口

| 编号 | 严重度 | 发现 | 证据 | 影响 |
|---|---|---|---|---|
| GAP-01 | 高 | 计划填报要求维护预算，明细组件还要求 FTE，但 `PlanItem` 只有 `planned_headcount` | PLAN-002；[plan.json](../specifications/modules/plan.json)、[components.json](../specifications/ui/components.json) 的 `HEADCOUNT-LINE-TABLE`、[entities.json](../specifications/data-model/entities.json) 的 `PlanItem` | 无法保存或验证预算/FTE，也无法按金额审批 |
| GAP-02 | 高 | 计划要求指定组织范围，流程使用 `plan.departmentId`，但 `Plan` 实体没有组织或部门字段 | PLAN-001、PLAN-003；[plan.json](../specifications/modules/plan.json)、[headcount-approval.json](../specifications/workflows/headcount-approval.json)、[entities.json](../specifications/data-model/entities.json) | 无法确定计划归属和审批部门；`AR-APPROVER` 无法解析 |
| GAP-03 | 高 | 组织、职位、账号需求包含有效期、名称、启用/停用状态，但这些字段未进入实体 | ORG-001、ORG-002、POS-001、ACC-001；[entities.json](../specifications/data-model/entities.json) | 无法完成按日期还原组织、职位有效期和停用会话约束 |
| GAP-04 | 高 | ACC-002 要求人员关联唯一，实体却把 `person_id` 定义为可空且没有唯一约束 | ACC-002；[account.json](../specifications/modules/account.json)、[entities.json](../specifications/data-model/entities.json) | 可能出现多个账号关联同一人员，或不关联人员的账号 |
| GAP-05 | 高 | 审批详情页只要求 `PLAN_APPROVE`，但加载详情调用需要 `PLAN_VIEW` 的 `API-PLAN-GET` | PLAN-004、PLAN-005；[pages.json](../specifications/ui/pages.json) 的 `PLAN-APPROVAL-DETAIL`、[actions.json](../specifications/ui/actions.json) 的 `ACT-LOAD-PLAN-APPROVAL`、[api-spec.json](../specifications/api/api-spec.json) 的 `API-PLAN-GET` | 仅有 `PLAN_APPROVE` 的用户可能无法加载待审批计划 |
| GAP-06 | 高 | 角色、功能权限、数据范围和用户角色没有数据模型、管理 API 或保存动作 | SEC-001、SEC-002；[security.json](../specifications/modules/security.json)、[entities.json](../specifications/data-model/entities.json)、[actions.json](../specifications/ui/actions.json) | 无法实现权限授予、撤销和 SEC-002 的后端数据范围授权 |
| GAP-07 | 高 | PLAN-002 要求修改可追踪，计划模块还描述版本追踪，但无审计、版本或审批历史实体 | PLAN-002；[plan.json](../specifications/modules/plan.json)、[entities.json](../specifications/data-model/entities.json)、[database-design.md](../architecture/database-design.md) | “修改记录可追踪”和版本管理当前不可验证 |
| GAP-08 | 中 | 人员快速查看事件传入 `personId`，但计划明细没有 `person_id`，无法确定从哪条明细打开人员 | PLAN-002；[components.json](../specifications/ui/components.json) 的 `HEADCOUNT-LINE-TABLE`、[entities.json](../specifications/data-model/entities.json) | 页面动作缺少业务数据来源 |
| GAP-09 | 中 | 组织、职位、账号、权限模块没有完整 REST API；组织的保存事件、角色权限保存事件也没有动作绑定 | ORG-001、ORG-002、POS-001、ACC-001、ACC-002、SEC-001、SEC-002；[api-spec.json](../specifications/api/api-spec.json)、[actions.json](../specifications/ui/actions.json)、[components.json](../specifications/ui/components.json) | 五个非计划模块无法形成可测试垂直切片 |
| GAP-10 | 中 | 审批状态 `RETURNED` 被声明为 `TASK`，但没有分配规则或待办任务 | PLAN-004；[headcount-approval.json](../specifications/workflows/headcount-approval.json) | 无法确定驳回后由谁收到任务、如何通知及如何重新提交 |
| GAP-11 | 中 | `RejectRequest`、`PlanCreateRequest`、`PlanUpdateRequest`、`PlanPage`、`WorkflowTask` 等 Schema 名称被引用，但文档没有字段定义 | PLAN-001 至 PLAN-005；[api-spec.json](../specifications/api/api-spec.json)、[actions.json](../specifications/ui/actions.json) | API 输入输出契约不足以开发 |
| GAP-12 | 中 | 计划详情页面承诺“查看审批记录”，但审批历史区域没有组件引用，也没有查询 API | PLAN-004、PLAN-005；[pages.json](../specifications/ui/pages.json)、[components.json](../specifications/ui/components.json) | 页面功能没有可执行契约 |
| GAP-13 | 中 | 追踪表只覆盖 PLAN-001 至 PLAN-005，未覆盖 ORG、POS、PER、ACC、SEC 需求，且未追踪 `API-PLAN-LIST` | 全项目；[traceability.json](../specifications/traceability.json)、各模块 `requirements` | 不满足“每个需求 ID 可追踪到代码、API、页面和测试”的规则 |
| GAP-14 | 低 | 仓库中的 `validation-result.txt` 是旧统计值，与当前校验输出不一致 | [validation-result.txt](../validation-result.txt)、[validate_specs.mjs](../scripts/validate_specs.mjs) | 容易误判当前规格规模；应以实时校验输出为准 |
| GAP-15 | 中 | 计划编码唯一、状态和期间格式只存在于需求/流程描述，实体没有唯一约束、状态枚举或期间格式约束 | PLAN-001、PLAN-003、PLAN-004、PLAN-005；[plan.json](../specifications/modules/plan.json)、[headcount-approval.json](../specifications/workflows/headcount-approval.json)、[entities.json](../specifications/data-model/entities.json) | 可能产生重复计划编码、非法状态或不可比较的期间值 |
| GAP-16 | 中 | 组织维护页只要求 `ORG_VIEW`，但页面功能包含组织树和有效期维护，且没有组织编辑权限 | ORG-001、ORG-002；[pages.json](../specifications/ui/pages.json) 的 `ORG-MAINTENANCE` | “有权查看”与“有权维护”被混为同一权限 |
| GAP-17 | 中 | 批准和驳回 API 只有计划 ID，没有工作流任务 ID或并发版本；重复提交/重复审批的预期结果未定义 | PLAN-003、PLAN-004、PLAN-005；[api-spec.json](../specifications/api/api-spec.json)、[coding-standards.md](../ai-development/coding-standards.md) | 并发操作可能重复完成任务或处理已失效任务 |

### 7.2 已明确标记的开放问题

下表给 `open-questions.md` 的 12 项增加分析编号 `OQ-01...OQ-12`；源文档本身没有数值 ID。

| 本报告编号 | 未决事项 | 直接影响需求 | 当前处理要求 |
|---|---|---|---|
| OQ-01 | 金额、人数、FTE 是否并行；币种、汇率、舍入 | PLAN-002 | 不得先写预算或 FTE 断言 |
| OQ-02 | 自然年/财年、月度/季度粒度、跨期调整 | PLAN-001、PLAN-002 | `period` 仅能作为未细化字符串 |
| OQ-03 | 在职、待入职、离职通知期人员的 Headcount 口径 | PLAN-002 | 不得据此计算实际人数 |
| OQ-04 | Onboarding 在哪个节点计入实际人数 | PER-001、PER-002 | 同步状态与人数计算规则待定 |
| OQ-05 | 绩效字段、周期及预算影响 | 当前无独立需求 ID | 不得引入绩效表或算法 |
| OQ-06 | 按部门/金额/人数/组织层级审批；是否多部门会签 | PLAN-003、PLAN-004、PLAN-005 | 当前只能将单级 `AR-APPROVER` 视为待确认草案 |
| OQ-07 | 驳回、撤回、转办、加签、代理审批、超时 | PLAN-003、PLAN-004、PLAN-005 | 当前已定义的只有驳回和重提 |
| OQ-08 | 锁定、版本、复制、冻结、重开、审计 | PLAN-001 至 PLAN-005；plan 模块说明 | 版本与审计模型待确认 |
| OQ-09 | SuccessFactors 元数据、认证、限流、增量 | PER-002 | 不得猜测 OData 对象和字段 |
| OQ-10 | 本地账号、SSO、SuccessFactors 用户同步边界 | ACC-001、ACC-002 | 账号来源与认证方式待定 |
| OQ-11 | 数据权限是否包含下级；跨组织兼任如何处理 | SEC-002 | 当前只能实现“必须拒绝越权”的高层约束 |
| OQ-12 | 删除、保留期、脱敏、审计日志保留 | 全局；尤其 PER-001、PLAN-002 | 不得制定生产删除策略 |

“确认状态”的粒度也需要说明：PLAN-001、PLAN-002 和 SEC-002 虽标记为 `CONFIRMED`，但其期间、预算口径或组织继承细节仍被开放问题覆盖。更合适的状态是“高层能力已确认、规则细节 TBD”。依据：[plan.json](../specifications/modules/plan.json)、[security.json](../specifications/modules/security.json)、[open-questions.md](../specifications/open-questions.md)。

## 8. 建议的开发顺序

整体顺序遵循 [generation-workflow.md](../ai-development/generation-workflow.md)，但必须先把当前会阻塞数据模型的开放项变成可执行规则。

| 阶段 | 目标 | 覆盖需求 | 完成门槛 |
|---|---|---|---|
| 0. 澄清与规格修正 | 确认预算/FTE、期间、Headcount 口径、计划部门、审批路由、角色与数据范围、审计/版本 | 主要涉及 PLAN-001 至 PLAN-005、ORG-002、ACC-001、SEC-001、SEC-002 | 更新模块 JSON、`open-questions.md`、追踪表；关键规则状态可变更为可执行 |
| 1. 组织与基础主数据 | 组织树、有效期和防循环；职位有效期；人员最小档案 | ORG-001、ORG-002、POS-001、PER-001 | 数据模型、migration、领域校验、基础查询通过 |
| 2. 权限与账号基础 | 角色、权限、用户角色、组织数据范围；账号启停与人员唯一关联 | ACC-001、ACC-002、SEC-001、SEC-002 | 后端授权与越权集成测试通过 |
| 3. 计划创建/填报切片 | 计划主表、明细、预算/FTE 模型、唯一编码、审计/版本 | PLAN-001、PLAN-002；POS-002 | 创建草稿、重新打开、更新和审计测试通过 |
| 4. 审批流程切片 | 提交、待办、驳回、重提、批准和任务分配 | PLAN-003、PLAN-004、PLAN-005 | 状态机、事务一致性和驳回重提集成测试通过 |
| 5. 完整 UI 切片 | 计划工作台、新建/详情、审批待办/详情、组织选择器、权限矩阵 | 对应上述需求及页面动作 | 全部动作有后端 API 和权限测试；不依赖隐藏按钮授权 |
| 6. SuccessFactors 连接器 | 在租户元数据确认后实现人员/组织同步、日志、重试和增量 | PER-002 | 目标租户 `$metadata` 和 API 权限已确认；成功/失败/时间可追踪 |
| 7. 规整与端到端验证 | 补齐追踪、测试、性能和运维文档 | 全部 | `validate_specs`、单元/集成/E2E/权限测试全部通过 |

若本次实验时间有限，最短可验证路径应是“组织最小主数据 + 申请人/审批人权限 + 计划创建/更新 + 单级提交/驳回/重提/批准”。这对应 PLAN-001 至 PLAN-005，但仍必须保留 GAP-01、GAP-02、GAP-05 的待确认状态，不能用样例数据代替业务确认。

## 9. 实验测试数据

配套数据位于：

- [headcount-planning-fixtures.json](../test-data/experiment/headcount-planning-fixtures.json)
- [README.md](../test-data/experiment/README.md)

数据分为：

1. 仅使用已定义实体字段的主数据、计划和计划明细。
2. 覆盖 PLAN-001 至 PLAN-005、ACC-002、ORG-001、POS-001、PER-001、SEC-002 的正向/反向场景。
3. 明确标记为 `NOT_LOADABLE_TBD` 的预算、FTE、计划部门、组织有效期、账号状态和 SuccessFactors 映射样例。

测试数据是实验输入，不是生产规则，也不证明 TBD 事项已经确认。
