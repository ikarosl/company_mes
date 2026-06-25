SET NAMES utf8mb4;
USE `company_test`;

ALTER TABLE `operation_logs`
  ADD COLUMN `operator_username` varchar(100) DEFAULT NULL COMMENT '操作人用户名快照' AFTER `user_id`,
  ADD COLUMN `target_ids` json DEFAULT NULL COMMENT '一个请求涉及的多个业务对象ID' AFTER `target_type`,
  ADD COLUMN `business_key` varchar(128) DEFAULT NULL COMMENT '业务单号或可读业务键' AFTER `target_ids`,
  ADD COLUMN `request_id` varchar(64) DEFAULT NULL COMMENT '请求链路ID' AFTER `result`,
  ADD COLUMN `http_method` varchar(16) DEFAULT NULL COMMENT 'HTTP方法' AFTER `request_id`,
  ADD COLUMN `route` varchar(255) DEFAULT NULL COMMENT '路由模板' AFTER `http_method`,
  ADD COLUMN `http_status` int DEFAULT NULL COMMENT 'HTTP响应状态码' AFTER `route`,
  ADD COLUMN `duration_ms` int DEFAULT NULL COMMENT '请求耗时毫秒' AFTER `http_status`,
  ADD COLUMN `request_data` json DEFAULT NULL COMMENT '脱敏后的路径、查询和请求体参数' AFTER `duration_ms`,
  ADD COLUMN `user_agent` varchar(512) DEFAULT NULL COMMENT '客户端User-Agent' AFTER `ip`,
  ADD COLUMN `error_code` varchar(100) DEFAULT NULL COMMENT '异常类型或错误代码' AFTER `user_agent`,
  ADD KEY `idx_operation_logs_request_id` (`request_id`),
  ADD KEY `idx_operation_logs_target` (`target_type`, `target_id`),
  ADD KEY `idx_operation_logs_business_key` (`business_key`),
  ADD KEY `idx_operation_logs_http_status` (`http_status`);
