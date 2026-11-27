# 系统架构

模块化单体：Java 21 + Spring Boot 3、Vue 3 + TypeScript + Element Plus、MySQL 8、Flowable、Spring Security + jCasbin。

业务模块：计划、组织、人员、职位、账号、权限。外部集成：SAP SuccessFactors OData，字段映射以目标租户元数据为准。

分层：Controller -> Application Service -> Domain Service/Repository -> MySQL。Flowable 管理流程实例与任务；业务表保存计划业务状态。jCasbin 判断功能及数据范围授权，Spring Security 负责认证和请求安全链。

Controller 不直接访问 Repository；API 必须后端授权；流程与业务数据需定义事务一致性策略。
