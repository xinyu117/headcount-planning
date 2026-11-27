# 权限设计

Spring Security 负责认证和安全过滤链；jCasbin 负责角色-功能权限与组织数据范围。授权必须在后端执行。策略维度建议 subject、object、action、scope。需明确多角色合并、拒绝优先级、组织继承、跨组织兼任和策略缓存刷新规则。Web 管理角色与功能权限关系，变更必须审计。
