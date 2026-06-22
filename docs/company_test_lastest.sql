-- Business seed data only. RBAC/auth data is kept in init_rbac.sql.
SET NAMES utf8mb4;
USE `company_test`;
SET FOREIGN_KEY_CHECKS=0;

INSERT INTO `product_categories` (
  `id`, `product_attribute`, `product_type`, `status`, `remark`,
  `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, '成品', '环形器', 1, '微波器件成品分类', NULL, '2026-06-11 14:24:07', NULL, '2026-06-11 14:24:07', 0, NULL, NULL),
  (2, '成品', 'PCB', 1, 'PCB 成品分类', NULL, '2026-06-11 14:24:07', NULL, '2026-06-11 14:49:25', 0, NULL, NULL),
  (3, '半成品', '腔体', 1, NULL, NULL, '2026-06-11 14:26:27', NULL, '2026-06-11 14:26:27', 0, NULL, NULL);

INSERT INTO `technical_files` (
  `id`, `file_code`, `file_name`, `file_url`, `file_type`, `version`, `status`, `remark`,
  `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 'SOP-GX-001', '装配作业指导书.pdf', '/files/processes/GX-001.pdf', 'sop', 'V1.0', 1, '工序 SOP 样例', NULL, '2026-06-11 15:38:06', NULL, '2026-06-11 15:38:06', 0, NULL, NULL),
  (2, 'SOP-GX-002', '调试规范.pdf', '/files/processes/GX-002.pdf', 'sop', 'V1.0', 1, '工序 SOP 样例', NULL, '2026-06-11 15:38:06', NULL, '2026-06-11 15:38:06', 0, NULL, NULL),
  (3, 'SOP-GX-004', '3- 真空焊接工艺规程.docx', '/uploads/processes/1781166456931-3-_真空焊接工艺规程.docx', 'process_sop', 'V1.0', 1, '生产工序上传文件', NULL, '2026-06-11 16:27:36', NULL, '2026-06-11 17:19:36', 0, NULL, NULL),
  (4, 'SOP-MICRO-001', '1- 微电路制作检验规程.docx', '/uploads/processes/1781169761042-1-_微电路制作检验规程.docx', 'process_sop', 'V1.0', 1, '生产工序上传文件', NULL, '2026-06-11 17:22:41', NULL, '2026-06-11 17:22:41', 0, NULL, NULL);

INSERT INTO `process_steps` (
  `id`, `step_code`, `step_name`, `sop_file_id`, `status`, `remark`,
  `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 'GX-001', '装配', 1, 1, '生产工序主数据样例', NULL, '2026-06-11 16:22:31', NULL, '2026-06-11 16:22:31', 0, NULL, NULL),
  (2, 'GX-002', '调试', 2, 1, '生产工序主数据样例', NULL, '2026-06-11 16:22:31', NULL, '2026-06-11 16:22:31', 0, NULL, NULL),
  (3, 'GX-003', '检验', NULL, 1, '由历史路线步骤迁移生成', NULL, '2026-06-11 16:23:33', NULL, '2026-06-11 16:23:33', 0, NULL, NULL),
  (4, 'GX-004', '焊接', 3, 1, NULL, NULL, '2026-06-11 16:27:06', NULL, '2026-06-11 17:19:36', 0, NULL, NULL),
  (5, 'GX-005', '微电路检验', 4, 1, '测试工序', NULL, '2026-06-11 17:02:39', NULL, '2026-06-11 17:22:41', 0, NULL, NULL);

INSERT INTO `process_routes` (
  `id`, `route_code`, `route_name`, `product_category_id`, `version`, `applicable_product_type`, `status`, `remark`,
  `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 'ROUTE-CIR-STD', '环形器标准工艺路线', 1, 'V1.0', '环形器', 1, '默认工艺路线样例', NULL, '2026-06-11 15:38:06', NULL, '2026-06-16 15:40:09', 0, NULL, NULL);

INSERT INTO `products` (
  `id`, `product_model`, `product_name`, `category_id`, `default_route_id`, `spec_file_id`, `unit`, `acquire_method`,
  `spec_values`, `status`, `remark`, `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 'HMITB60T180G-B2', '宽带微带环形器', 1, 1, NULL, 'pcs', 'self_made', '[{\"key\":\"频率范围\",\"unit\":\"GHz\",\"value\":\"6-18\"},{\"key\":\"插入损耗\",\"unit\":\"dB\",\"value\":\"0.8\"},{\"key\":\"隔离度\",\"unit\":\"dB\",\"value\":\"18\"}]', 1, '产品资料样例', NULL, '2026-06-11 14:49:25', NULL, '2026-06-12 09:44:47', 0, NULL, NULL),
  (2, 'PCB-CIR-001', '环形器控制板', 2, 1, NULL, 'pcs', 'self_made', '[]', 1, 'PCB 产品资料样例', NULL, '2026-06-11 14:49:25', NULL, '2026-06-16 11:26:59', 0, NULL, NULL),
  (3, 'GX-20260615001', '带线腔体', 3, NULL, NULL, 'pcs', 'purchased', '[]', 1, NULL, NULL, '2026-06-15 16:12:40', NULL, '2026-06-15 16:12:40', 0, NULL, NULL),
  (4, 'GX-20260615002', 'PCB板', 2, NULL, NULL, 'pcs', 'purchased', '[]', 1, NULL, NULL, '2026-06-15 16:13:29', NULL, '2026-06-15 16:13:29', 0, NULL, NULL),
  (5, 'GX-20260615003', '粘合剂', 3, NULL, NULL, 'pcs', 'purchased', '[]', 1, NULL, NULL, '2026-06-15 16:14:04', NULL, '2026-06-15 16:14:04', 0, NULL, NULL);

INSERT INTO `process_route_steps` (
  `id`, `route_id`, `process_step_id`, `step_order`, `default_owner_id`, `sop_file_id`,
  `need_inspection`, `need_record`, `status`, `remark`, `created_by`, `created_at`,
  `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (4, 1, 1, 1, 3, 1, 0, 1, 1, '工艺路线工序明细样例', NULL, '2026-06-11 16:30:27', NULL, '2026-06-16 15:40:08', 0, NULL, NULL),
  (5, 1, 2, 2, 2, 2, 0, 1, 1, '工艺路线工序明细样例', NULL, '2026-06-11 16:30:27', NULL, '2026-06-16 15:40:08', 0, NULL, NULL),
  (6, 1, 3, 3, 4, NULL, 1, 1, 1, NULL, NULL, '2026-06-11 16:30:27', NULL, '2026-06-16 15:40:08', 0, NULL, NULL),
  (7, 1, 4, 4, 3, 3, 0, 1, 1, NULL, NULL, '2026-06-11 16:30:27', NULL, '2026-06-16 15:40:08', 0, NULL, NULL);

INSERT INTO `product_materials` (
  `id`, `product_id`, `material_product_id`, `quantity_per_unit`, `unit`, `is_key_material`, `need_batch_record`,
  `remark`, `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 2, 3, 1.0000, 'pcs', 1, 1, NULL, NULL, '2026-06-15 16:14:06', NULL, '2026-06-15 16:14:06', 0, NULL, NULL),
  (2, 2, 4, 1.0000, 'pcs', 1, 1, NULL, NULL, '2026-06-15 16:14:06', NULL, '2026-06-15 16:14:06', 0, NULL, NULL),
  (3, 2, 5, 1.0000, 'pcs', 1, 1, NULL, NULL, '2026-06-15 16:14:06', NULL, '2026-06-15 16:14:06', 0, NULL, NULL);

INSERT INTO `material_batches` (
  `id`, `product_id`, `material_batch_no`, `supplier_name`, `received_date`, `quantity`, `status`,
  `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 2, 'WL-001', 'PCB供应商', '2026-06-12', 100.0000, 'available', NULL, '2026-06-12 13:46:15', NULL, '2026-06-12 13:47:23', 0, NULL, NULL);

INSERT INTO `work_orders` (
  `id`, `order_no`, `product_id`, `planned_quantity`, `customer_order_no`, `customer_name`,
  `owner_id`, `status`, `plan_start_date`, `plan_end_date`, `actual_start_at`, `actual_end_at`,
  `remark`, `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 'GD-001', 1, 100.0000, NULL, NULL, 2, 'released', '2026-06-15', '2026-06-18', NULL, NULL, '需要提供检测报告', NULL, '2026-06-12 14:53:35', NULL, '2026-06-15 11:41:08', 0, NULL, NULL),
  (2, 'gd-002', 1, 100.0000, NULL, NULL, 2, 'released', '2026-06-18', '2026-06-19', NULL, NULL, NULL, NULL, '2026-06-17 10:55:49', NULL, '2026-06-17 11:16:37', 0, NULL, NULL);

INSERT INTO `production_batches` (
  `id`, `work_order_id`, `batch_no`, `route_id`, `planned_quantity`, `status`, `owner_id`,
  `plan_start_date`, `plan_end_date`, `actual_start_at`, `actual_end_at`, `remark`,
  `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 1, 'PB20260615001', 1, 100.0000, 'material_assigned', 2, '2026-06-14', '2026-06-17', NULL, NULL, NULL, NULL, '2026-06-15 11:41:08', NULL, '2026-06-15 14:03:14', 0, NULL, NULL),
  (2, 2, 'SCPC-20260617-001', 1, 80.0000, 'material_assigned', 2, '2026-06-17', '2026-06-18', NULL, NULL, NULL, NULL, '2026-06-17 11:16:37', NULL, '2026-06-17 11:19:07', 0, NULL, NULL);

INSERT INTO `batch_step_records` (
  `id`, `batch_id`, `process_route_steps_id`, `responsible_user_id`, `output_quantity`, `abnormal_quantity`,
  `return_quantity`, `status`, `started_at`, `completed_at`, `remark`, `created_by`, `created_at`,
  `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`
) VALUES
  (1, 2, 4, 1, 90.0000, 0.0000, 0.0000, 'completed', '2026-06-17 11:19:18', '2026-06-17 11:19:35', NULL, NULL, '2026-06-17 11:19:07', NULL, '2026-06-17 11:19:34', 0, NULL, NULL),
  (2, 2, 5, 1, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2026-06-17 11:19:07', NULL, '2026-06-17 11:19:07', 0, NULL, NULL),
  (3, 2, 6, 1, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2026-06-17 11:19:07', NULL, '2026-06-17 11:19:07', 0, NULL, NULL),
  (4, 2, 7, 1, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, '2026-06-17 11:19:07', NULL, '2026-06-17 11:19:07', 0, NULL, NULL);

SET FOREIGN_KEY_CHECKS=1;
