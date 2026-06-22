SET NAMES utf8mb4;
USE `company_test`;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `products`
  ADD COLUMN `spec_file_id` bigint unsigned DEFAULT NULL COMMENT '产品规格书ID' AFTER `default_route_id`,
  ADD KEY `idx_products_spec_file_id` (`spec_file_id`),
  ADD CONSTRAINT `fk_products_spec_file_id` FOREIGN KEY (`spec_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL;

ALTER TABLE `technical_files`
  ADD COLUMN `file_code` varchar(100) DEFAULT NULL COMMENT '文件编号' AFTER `id`;

UPDATE `technical_files`
SET `file_code` = CONCAT('FILE-', LPAD(`id`, 4, '0'))
WHERE `file_code` IS NULL OR `file_code` = '';

ALTER TABLE `technical_files`
  MODIFY COLUMN `file_code` varchar(100) NOT NULL COMMENT '文件编号',
  ADD UNIQUE KEY `uk_technical_files_code_version_deleted` (`file_code`, `version`, `is_deleted`);

ALTER TABLE `process_steps`
  ADD COLUMN `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1启用，0停用' AFTER `sop_file_id`,
  ADD KEY `idx_process_steps_status` (`status`);

UPDATE `process_steps` ps
LEFT JOIN `processes` p ON p.id = ps.id
SET ps.status = COALESCE(p.status, 1),
    ps.remark = COALESCE(ps.remark, p.remark),
    ps.updated_at = NOW();

UPDATE `process_route_steps`
SET `process_step_id` = `process_id`
WHERE `process_step_id` IS NULL AND `process_id` IS NOT NULL;

ALTER TABLE `process_route_steps`
  DROP FOREIGN KEY `fk_process_route_steps_process_id`,
  DROP FOREIGN KEY `fk_process_route_steps_process_step_id`;

ALTER TABLE `process_route_steps`
  DROP INDEX `idx_process_route_steps_process_id`,
  DROP INDEX `uk_process_route_steps_code_deleted`,
  DROP COLUMN `process_id`,
  DROP COLUMN `process_code`,
  DROP COLUMN `process_name`,
  DROP COLUMN `description`,
  DROP COLUMN `sop_file_name`,
  DROP COLUMN `sop_file_url`,
  MODIFY COLUMN `process_step_id` bigint unsigned NOT NULL COMMENT '标准工序ID',
  ADD COLUMN `need_inspection` tinyint NOT NULL DEFAULT '0' COMMENT '是否需要检验：1是，0否' AFTER `sop_file_id`,
  ADD COLUMN `need_record` tinyint NOT NULL DEFAULT '1' COMMENT '是否必须报工：1是，0否' AFTER `need_inspection`,
  ADD KEY `idx_process_route_steps_need_inspection` (`need_inspection`),
  ADD KEY `idx_process_route_steps_need_record` (`need_record`),
  ADD CONSTRAINT `fk_process_route_steps_process_step_id`
    FOREIGN KEY (`process_step_id`) REFERENCES `process_steps` (`id`) ON DELETE RESTRICT;

ALTER TABLE `route_step_materials`
  DROP FOREIGN KEY `fk_route_step_materials_route_step_id`,
  DROP INDEX `uk_route_step_materials_step_material_deleted`,
  DROP INDEX `idx_route_step_materials_route_step_id`,
  CHANGE COLUMN `route_step_id` `process_route_step_id` bigint unsigned NOT NULL COMMENT '工艺路线工序明细ID',
  ADD UNIQUE KEY `uk_route_step_materials_step_material_deleted` (`process_route_step_id`,`product_material_id`,`is_deleted`),
  ADD KEY `idx_route_step_materials_process_route_step_id` (`process_route_step_id`),
  ADD CONSTRAINT `fk_route_step_materials_process_route_step_id`
    FOREIGN KEY (`process_route_step_id`) REFERENCES `process_route_steps` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_materials`
  ADD COLUMN `quantity_per_unit` decimal(12,4) NOT NULL DEFAULT '1.0000' COMMENT '单件用量' AFTER `material_product_id`,
  ADD CONSTRAINT `chk_product_materials_quantity_per_unit` CHECK (`quantity_per_unit` > 0);

ALTER TABLE `work_orders`
  DROP FOREIGN KEY `fk_work_orders_route_id`,
  DROP INDEX `idx_work_orders_route_id`,
  DROP COLUMN `route_id`,
  DROP COLUMN `unit`,
  ADD COLUMN `customer_order_no` varchar(100) DEFAULT NULL COMMENT '客户订单号' AFTER `planned_quantity`,
  ADD COLUMN `customer_name` varchar(255) DEFAULT NULL COMMENT '客户名称' AFTER `customer_order_no`,
  ADD KEY `idx_work_orders_customer_order_no` (`customer_order_no`);

ALTER TABLE `production_batches`
  DROP CHECK `chk_production_batches_status`;

UPDATE `production_batches`
SET `status` = CASE
  WHEN `status` = 'assigned' THEN 'material_assigned'
  ELSE `status`
END;

ALTER TABLE `production_batches`
  DROP FOREIGN KEY `fk_production_batches_product_id`,
  DROP INDEX `idx_production_batches_product_id`,
  DROP CHECK `chk_production_batches_material_status`,
  DROP CHECK `chk_production_batches_dispatch_status`,
  DROP CHECK `chk_production_batches_production_status`,
  DROP CHECK `chk_production_batches_inspection_status`,
  DROP COLUMN `product_id`,
  DROP COLUMN `material_status`,
  DROP COLUMN `dispatch_status`,
  DROP COLUMN `production_status`,
  DROP COLUMN `inspection_status`,
  ADD CONSTRAINT `chk_production_batches_status`
    CHECK (`status` in ('pending','material_pending','material_assigned','doing','completed','cancelled'));

ALTER TABLE `batch_step_records`
  DROP FOREIGN KEY `fk_batch_step_records_route_step_id`,
  DROP FOREIGN KEY `fk_batch_step_records_sop_file_id`,
  DROP INDEX `uk_batch_step_records_batch_step_deleted`,
  DROP INDEX `idx_batch_step_records_route_step_id`,
  DROP INDEX `fk_batch_step_records_sop_file_id`,
  CHANGE COLUMN `route_step_id` `process_route_steps_id` bigint unsigned NOT NULL COMMENT '工艺路线工序ID',
  DROP COLUMN `step_order`,
  DROP COLUMN `step_name`,
  DROP COLUMN `sop_file_id`,
  ADD UNIQUE KEY `uk_batch_step_records_batch_step_deleted` (`batch_id`,`process_route_steps_id`,`is_deleted`),
  ADD KEY `idx_batch_step_records_process_route_steps_id` (`process_route_steps_id`),
  ADD CONSTRAINT `fk_batch_step_records_process_route_steps_id`
    FOREIGN KEY (`process_route_steps_id`) REFERENCES `process_route_steps` (`id`) ON DELETE RESTRICT;

ALTER TABLE `batch_material_usages`
  MODIFY COLUMN `material_batch_id` bigint unsigned DEFAULT NULL COMMENT '物料批次ID',
  ADD COLUMN `product_materials_id` bigint unsigned NOT NULL COMMENT '产品物料清单ID' AFTER `batch_id`,
  ADD COLUMN `plan_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '需求数量' AFTER `material_batch_id`,
  ADD KEY `idx_batch_material_usages_product_materials_id` (`product_materials_id`),
  ADD CONSTRAINT `fk_batch_material_usages_product_materials_id`
    FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `chk_batch_material_usages_plan_quantity` CHECK (`plan_quantity` >= 0);

DROP TABLE IF EXISTS `processes`;

SET FOREIGN_KEY_CHECKS = 1;
