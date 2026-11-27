# 实验测试数据说明

本目录用于需求分析实验，不是生产种子数据，也不包含数据库迁移脚本。

## 文件

- `headcount-planning-fixtures.json`：组织、职位、人员、账号、计划、计划明细，以及 API/工作流/权限/负向场景。

## 使用边界

1. `masterData` 与 `plans` 的业务字段只包含 `specifications/data-model/entities.json` 已声明的持久化字段；`requirementIds` 是实验追踪元数据，不是实体字段。
2. 计划覆盖 `DRAFT`、`IN_REVIEW`、`RETURNED`、`APPROVED` 四个流程状态，关联需求 PLAN-001 至 PLAN-005。
3. `authorizationScenarios` 中的 `PLAN_APPLICANT`、`ORG_ADMIN`、`SECURITY_ADMIN`、`ACCOUNT_ADMIN` 是基于页面/API 权限推导的实验角色；只有 `PLAN_APPROVER` 是流程文档明确给出的角色代码。
4. `tbdInputs` 中的字段没有进入概念实体，标记为 `NOT_LOADABLE_TBD`，不得据此生成 migration 或修改生产数据。
5. SuccessFactors 数据源只保留为集成占位场景；在目标租户 `$metadata` 确认前，不存在可用的字段映射。

## 已知不能直接导入的原因

- 当前 `entities.json` 是概念模型，没有生产 DDL、唯一约束、审计字段或外键定义。
- `Plan` 没有组织/部门字段，`PlanItem` 没有预算、FTE、说明或人员字段。
- `Organization`、`Position` 没有有效期；`Position` 没有名称。
- `Account` 没有启用/停用状态。
- 没有角色、权限、用户角色、数据范围、审批历史和同步日志实体。

因此，本数据集适合用于页面原型、接口契约讨论、状态机测试和字段缺口验证，不应直接作为数据库初始化数据。

## 需求覆盖

| 数据/场景 | 需求 |
|---|---|
| `HC-2026-001` 及 `TC-PLAN-001-001` | PLAN-001 |
| `HC-2026-001` 明细和 `TC-PLAN-002-001` | PLAN-002 |
| `HC-2026-001` 的提交场景 | PLAN-003 |
| `HC-2026-003` 的驳回/重提场景 | PLAN-004 |
| `HC-2026-002` 的批准场景 | PLAN-005 |
| 组织树、组织编码唯一、防循环负例 | ORG-001、ORG-002 |
| 职位唯一编码和有效组织负例 | POS-001、POS-002 |
| 人员唯一标识 | PER-001 |
| 账号人员唯一关联 | ACC-002 |
| 越权审批和跨组织访问 | SEC-002 |
| SuccessFactors 同步占位 | PER-002 |
