-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: company_test
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `company_test`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `company_test` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `company_test`;

--
-- Table structure for table `batch_material_requirement`
--

DROP TABLE IF EXISTS `batch_material_requirement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_material_requirement` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '批次物料需求ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `product_materials_id` bigint unsigned NOT NULL COMMENT '产品物料清单ID',
  `material_product_id` bigint unsigned NOT NULL COMMENT '物料ID快照',
  `plan_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '需求数量快照',
  `unit` varchar(50) DEFAULT NULL COMMENT '需求单位快照',
  `demand_type` varchar(50) NOT NULL DEFAULT 'normal' COMMENT '需求类型',
  `parent_require_id` bigint unsigned DEFAULT NULL COMMENT '原需求ID',
  `source_scrap_id` bigint unsigned DEFAULT NULL COMMENT '来源报废ID',
  `status` varchar(50) NOT NULL DEFAULT 'normal' COMMENT '需求状态',
  `remark` text COMMENT '需求备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_material_requirements_batch_material` (`batch_id`,`product_materials_id`),
  KEY `idx_batch_material_requirements_batch_id` (`batch_id`),
  KEY `idx_batch_material_requirements_product_materials_id` (`product_materials_id`),
  KEY `idx_batch_material_requirements_is_deleted` (`is_deleted`),
  KEY `idx_batch_material_requirement_material_product_id` (`material_product_id`),
  KEY `idx_batch_material_requirement_status` (`status`),
  CONSTRAINT `fk_batch_material_requirements_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_requirements_product_materials_id` FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_material_requirements_plan_quantity` CHECK ((`plan_quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料需求快照表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_material_requirement`
--

LOCK TABLES `batch_material_requirement` WRITE;
/*!40000 ALTER TABLE `batch_material_requirement` DISABLE KEYS */;
INSERT INTO `batch_material_requirement` VALUES (1,1,4,5,300.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-07-01 11:03:25',0,NULL,NULL),(2,1,5,4,100.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-07-01 11:03:25',0,NULL,NULL),(3,1,6,3,100.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-07-01 11:03:25',0,NULL,NULL),(4,1,7,2,100.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-07-01 11:03:25',0,NULL,NULL),(5,2,4,5,240.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:32:46',1,'2026-07-01 11:03:25',0,NULL,NULL),(6,2,5,4,80.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:32:46',1,'2026-07-01 11:03:25',0,NULL,NULL),(7,2,6,3,80.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:32:46',1,'2026-07-01 11:03:25',0,NULL,NULL),(8,2,7,2,80.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-06-24 10:32:46',1,'2026-07-01 11:03:25',0,NULL,NULL),(9,3,7,2,20.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-07-02 13:56:26',NULL,'2026-07-02 13:56:26',0,NULL,NULL),(10,3,6,3,20.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-07-02 13:56:26',NULL,'2026-07-02 13:56:26',0,NULL,NULL),(11,3,5,4,20.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-07-02 13:56:26',NULL,'2026-07-02 13:56:26',0,NULL,NULL),(12,3,4,5,60.0000,'pcs','normal',NULL,NULL,'normal',NULL,NULL,'2026-07-02 13:56:26',NULL,'2026-07-02 13:56:26',0,NULL,NULL);
/*!40000 ALTER TABLE `batch_material_requirement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_material_usages`
--

DROP TABLE IF EXISTS `batch_material_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_material_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '物料操作流水ID',
  `batch_id` bigint unsigned NOT NULL COMMENT 'production batch id',
  `require_id` bigint unsigned DEFAULT NULL COMMENT '需求ID',
  `material_batch_id` bigint unsigned NOT NULL COMMENT '物料批次ID',
  `reserved_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次预留数量，仅reserve使用',
  `product_materials_id` bigint unsigned DEFAULT NULL COMMENT 'product material id',
  `operation_type` varchar(50) NOT NULL COMMENT 'reserve/unreserve/issue/return',
  `operation_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次操作数量',
  `used_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次领料或退料数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `related_usage_id` bigint unsigned DEFAULT NULL COMMENT '关联操作ID',
  `recorded_by` bigint unsigned DEFAULT NULL COMMENT '记录人ID',
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_batch_material_usages_batch_material` (`batch_id`,`product_materials_id`),
  KEY `idx_batch_material_usages_material_batch_id` (`material_batch_id`),
  KEY `idx_batch_material_usages_operation_type` (`operation_type`),
  KEY `idx_batch_material_usages_recorded_at` (`recorded_at`),
  KEY `idx_batch_material_usages_is_deleted` (`is_deleted`),
  KEY `fk_batch_material_usage_ops_product_materials_id` (`product_materials_id`),
  KEY `idx_batch_material_usages_batch_require` (`batch_id`,`require_id`),
  KEY `idx_batch_material_usages_related_usage_id` (`related_usage_id`),
  CONSTRAINT `fk_batch_material_usage_ops_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usage_ops_material_batch_id` FOREIGN KEY (`material_batch_id`) REFERENCES `material_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usage_ops_product_materials_id` FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_material_usage_ops_operation_quantity` CHECK ((((`operation_type` = _utf8mb4'reserve') and (`reserved_quantity` > 0) and (`used_quantity` = 0)) or ((`operation_type` = _utf8mb4'unreserve') and (`operation_quantity` > 0) and (`reserved_quantity` = 0) and (`used_quantity` = 0)) or ((`operation_type` in (_utf8mb4'issue',_utf8mb4'return')) and (`reserved_quantity` = 0) and (`used_quantity` > 0)))),
  CONSTRAINT `chk_batch_material_usage_ops_operation_type` CHECK ((`operation_type` in (_utf8mb4'reserve',_utf8mb4'unreserve',_utf8mb4'issue',_utf8mb4'return'))),
  CONSTRAINT `chk_batch_material_usage_ops_reserved_quantity` CHECK ((`reserved_quantity` >= 0)),
  CONSTRAINT `chk_batch_material_usage_ops_used_quantity` CHECK ((`used_quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='production batch material usage records';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_material_usages`
--

LOCK TABLES `batch_material_usages` WRITE;
/*!40000 ALTER TABLE `batch_material_usages` DISABLE KEYS */;
INSERT INTO `batch_material_usages` VALUES (1,2,8,1,80.0000,7,'reserve',80.0000,0.0000,'pcs',NULL,1,'2026-06-24 13:50:16',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:50:16',0,NULL,NULL),(2,2,7,6,80.0000,6,'reserve',80.0000,0.0000,'pcs',NULL,1,'2026-06-24 13:36:07',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:36:07',0,NULL,NULL),(3,2,6,5,80.0000,5,'reserve',80.0000,0.0000,'pcs',NULL,1,'2026-06-24 13:36:14',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:36:14',0,NULL,NULL),(4,2,5,4,240.0000,4,'reserve',240.0000,0.0000,'pcs',NULL,1,'2026-06-24 13:50:12',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:50:12',0,NULL,NULL),(5,1,4,1,20.0000,7,'reserve',20.0000,0.0000,'pcs',NULL,NULL,'2026-06-24 11:29:34',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-06-25 16:52:06',1,NULL,'2026-06-25 16:52:06'),(6,1,2,5,100.0000,5,'reserve',100.0000,0.0000,'pcs',NULL,NULL,'2026-06-24 11:29:24',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-06-24 13:53:56',0,NULL,NULL),(7,1,1,4,160.0000,4,'reserve',160.0000,0.0000,'pcs',NULL,NULL,'2026-06-24 11:29:29',NULL,NULL,'2026-06-24 10:33:00',NULL,'2026-06-24 13:53:56',0,NULL,NULL),(8,2,8,1,0.0000,7,'issue',80.0000,80.0000,'pcs',NULL,1,'2026-06-24 13:50:16',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:50:16',0,NULL,NULL),(9,2,7,6,0.0000,6,'issue',80.0000,80.0000,'pcs',NULL,1,'2026-06-24 13:36:07',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:36:07',0,NULL,NULL),(10,2,6,5,0.0000,5,'issue',80.0000,80.0000,'pcs',NULL,1,'2026-06-24 13:36:14',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:36:14',0,NULL,NULL),(11,2,5,4,0.0000,4,'issue',240.0000,240.0000,'pcs',NULL,1,'2026-06-24 13:50:12',NULL,NULL,'2026-06-24 10:32:46',1,'2026-06-24 13:50:12',0,NULL,NULL),(19,1,1,9,140.0000,4,'reserve',140.0000,0.0000,'pcs',NULL,NULL,'2026-06-26 11:58:32',NULL,NULL,'2026-06-26 11:58:32',NULL,'2026-06-26 11:58:32',0,NULL,NULL);
/*!40000 ALTER TABLE `batch_material_usages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_step_records`
--

DROP TABLE IF EXISTS `batch_step_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_step_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'report record id',
  `batch_id` bigint unsigned NOT NULL COMMENT 'production batch id',
  `process_route_steps_id` bigint unsigned NOT NULL COMMENT '工艺路线工序ID',
  `responsible_user_id` bigint unsigned DEFAULT NULL COMMENT 'responsible user for this step',
  `output_quantity` decimal(12,4) DEFAULT NULL COMMENT '完成数',
  `abnormal_quantity` decimal(12,4) DEFAULT NULL COMMENT '异常数量',
  `return_quantity` decimal(12,4) DEFAULT NULL COMMENT '返工数量',
  `status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT 'pending/doing/completed/abnormal/skipped',
  `started_at` datetime DEFAULT NULL COMMENT 'started time',
  `completed_at` datetime DEFAULT NULL COMMENT 'completed time',
  `remark` text COMMENT 'process remark',
  `created_by` bigint unsigned DEFAULT NULL COMMENT 'created by',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT 'updated by',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT 'soft delete flag',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT 'deleted by',
  `deleted_at` datetime DEFAULT NULL COMMENT 'deleted time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_step_records_batch_step_deleted` (`batch_id`,`process_route_steps_id`,`is_deleted`),
  KEY `idx_batch_step_records_batch_id` (`batch_id`),
  KEY `idx_batch_step_records_responsible_user_id` (`responsible_user_id`),
  KEY `idx_batch_step_records_status` (`status`),
  KEY `idx_batch_step_records_is_deleted` (`is_deleted`),
  KEY `idx_batch_step_records_created_by` (`created_by`),
  KEY `idx_batch_step_records_updated_by` (`updated_by`),
  KEY `idx_batch_step_records_deleted_by` (`deleted_by`),
  KEY `idx_batch_step_records_process_route_steps_id` (`process_route_steps_id`),
  CONSTRAINT `fk_batch_step_records_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_batch_step_records_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_process_route_steps_id` FOREIGN KEY (`process_route_steps_id`) REFERENCES `process_route_steps` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_step_records_responsible_user_id` FOREIGN KEY (`responsible_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_batch_step_records_abnormal_quantity` CHECK (((`return_quantity` is null) or (`return_quantity` >= 0))),
  CONSTRAINT `chk_batch_step_records_input_quantity` CHECK (((`output_quantity` is null) or (`output_quantity` >= 0))),
  CONSTRAINT `chk_batch_step_records_output_quantity` CHECK (((`abnormal_quantity` is null) or (`abnormal_quantity` >= 0))),
  CONSTRAINT `chk_batch_step_records_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'doing',_utf8mb4'completed',_utf8mb4'abnormal',_utf8mb4'skipped')))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='batch step report records';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_step_records`
--

LOCK TABLES `batch_step_records` WRITE;
/*!40000 ALTER TABLE `batch_step_records` DISABLE KEYS */;
INSERT INTO `batch_step_records` VALUES (1,2,4,1,90.0000,90.0000,90.0000,'completed','2026-06-17 11:19:18','2026-06-17 11:19:35',NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-22 16:13:20',1,NULL,'2026-06-22 16:13:20'),(2,2,5,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-22 16:13:20',1,NULL,'2026-06-22 16:13:20'),(3,2,6,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-22 16:13:20',1,NULL,'2026-06-22 16:13:20'),(4,2,7,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-22 16:13:20',1,NULL,'2026-06-22 16:13:20'),(5,2,4,1,NULL,NULL,NULL,'doing','2026-06-25 13:49:26',NULL,NULL,NULL,'2026-06-22 16:13:20',NULL,'2026-06-25 13:49:25',0,NULL,NULL),(6,2,5,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-22 16:13:20',NULL,'2026-06-22 16:13:20',0,NULL,NULL),(7,2,6,4,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-22 16:13:20',NULL,'2026-06-22 16:13:20',0,NULL,NULL),(8,2,7,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-22 16:13:20',NULL,'2026-06-22 16:13:20',0,NULL,NULL),(9,1,4,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-24 13:53:56',NULL,'2026-06-24 13:53:56',0,NULL,NULL),(10,1,5,2,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-24 13:53:56',NULL,'2026-06-24 13:53:56',0,NULL,NULL),(11,1,6,4,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-24 13:53:56',NULL,'2026-06-24 13:53:56',0,NULL,NULL),(12,1,7,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-24 13:53:56',NULL,'2026-06-24 13:53:56',0,NULL,NULL),(13,3,4,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:55:06',NULL,'2026-07-02 13:58:56',1,NULL,'2026-07-02 13:58:56'),(14,3,5,2,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:55:06',NULL,'2026-07-02 13:58:56',1,NULL,'2026-07-02 13:58:56'),(15,3,6,4,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:55:06',NULL,'2026-07-02 13:58:56',1,NULL,'2026-07-02 13:58:56'),(16,3,7,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:55:06',NULL,'2026-07-02 13:58:56',1,NULL,'2026-07-02 13:58:56'),(17,3,4,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:58:56',NULL,'2026-07-02 13:58:56',0,NULL,NULL),(18,3,5,2,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:58:56',NULL,'2026-07-02 13:58:56',0,NULL,NULL),(19,3,6,4,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:58:56',NULL,'2026-07-02 13:58:56',0,NULL,NULL),(20,3,7,3,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-07-02 13:58:56',NULL,'2026-07-02 13:58:56',0,NULL,NULL);
/*!40000 ALTER TABLE `batch_step_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned NOT NULL DEFAULT '0',
  `name` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_departments_code` (`code`),
  KEY `idx_departments_parent_id` (`parent_id`),
  KEY `idx_departments_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,0,'公司总部','company',0,1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(2,1,'生产部','production',10,1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(3,1,'质量部','quality',20,1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_stocktakes`
--

DROP TABLE IF EXISTS `inventory_stocktakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_stocktakes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '盘点ID',
  `stocktake_no` varchar(100) DEFAULT NULL COMMENT '盘点单号',
  `inventory_type` varchar(50) NOT NULL COMMENT '盘点对象类型：material/product',
  `inventory_batch_id` bigint unsigned NOT NULL COMMENT '库存批次ID，根据 inventory_type 指向不同库存表',
  `batch_no_snapshot` varchar(100) DEFAULT NULL COMMENT '盘点时批号快照',
  `product_id_snapshot` bigint unsigned DEFAULT NULL COMMENT '盘点时产品或物料ID快照',
  `before_quantity` decimal(12,4) NOT NULL COMMENT '账面数量',
  `counted_quantity` decimal(12,4) NOT NULL COMMENT '实盘数量',
  `difference_quantity` decimal(12,4) NOT NULL COMMENT '差异数量：实盘 - 账面',
  `difference_type` varchar(50) NOT NULL COMMENT '差异类型：surplus/shortage/equal',
  `reason_type` varchar(255) DEFAULT NULL COMMENT '差异原因',
  `status` varchar(50) NOT NULL DEFAULT 'draft' COMMENT '状态：draft/confirmed/adjusted/voided',
  `after_quantity` decimal(12,4) DEFAULT NULL COMMENT '调整后数量，通常等于实盘数量',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '盘点人ID',
  `operated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '盘点时间',
  `adjusted_by` bigint unsigned DEFAULT NULL COMMENT '调账人ID',
  `adjusted_at` datetime DEFAULT NULL COMMENT '调账时间',
  `file_url` varchar(500) DEFAULT NULL COMMENT '盘点图片或文件',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_stocktakes_no` (`stocktake_no`),
  KEY `idx_inventory_stocktakes_inventory` (`inventory_type`,`inventory_batch_id`),
  KEY `idx_inventory_stocktakes_status` (`status`),
  KEY `idx_inventory_stocktakes_operated_at` (`operated_at`),
  KEY `idx_inventory_stocktakes_is_deleted` (`is_deleted`),
  KEY `idx_inventory_stocktakes_operator_id` (`operator_id`),
  KEY `idx_inventory_stocktakes_adjusted_by` (`adjusted_by`),
  KEY `idx_inventory_stocktakes_created_by` (`created_by`),
  CONSTRAINT `fk_inventory_stocktakes_adjusted_by` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inventory_stocktakes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inventory_stocktakes_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_inventory_stocktakes_difference_type` CHECK ((`difference_type` in (_utf8mb4'surplus',_utf8mb4'shortage',_utf8mb4'equal'))),
  CONSTRAINT `chk_inventory_stocktakes_inventory_type` CHECK ((`inventory_type` in (_utf8mb4'material',_utf8mb4'product'))),
  CONSTRAINT `chk_inventory_stocktakes_quantities` CHECK (((`before_quantity` >= 0) and (`counted_quantity` >= 0))),
  CONSTRAINT `chk_inventory_stocktakes_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'confirmed',_utf8mb4'adjusted',_utf8mb4'voided')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物料、半成品和成品库存盘点台账';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_stocktakes`
--

LOCK TABLES `inventory_stocktakes` WRITE;
/*!40000 ALTER TABLE `inventory_stocktakes` DISABLE KEYS */;
INSERT INTO `inventory_stocktakes` VALUES (1,'PD20260701155718241','material',10,'WL-007',2,200.0000,199.0000,-1.0000,'shortage','漏记了一个','adjusted',199.0000,1,'2026-07-01 15:57:18',1,'2026-07-01 16:00:17',NULL,NULL,1,'2026-07-01 15:57:18',1,'2026-07-01 16:00:17',0,NULL,NULL);
/*!40000 ALTER TABLE `inventory_stocktakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_batches`
--

DROP TABLE IF EXISTS `material_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_id` bigint unsigned NOT NULL COMMENT '物料对应的产品ID，同一种物料允许多个批次',
  `material_batch_no` varchar(100) NOT NULL COMMENT '物料批次号',
  `supplier_name` varchar(255) DEFAULT NULL COMMENT '供应商名称',
  `protocol_code` varchar(50) DEFAULT NULL COMMENT '技术协议编码，作为来料检测依据',
  `received_date` date DEFAULT NULL COMMENT '入库/接收日期',
  `initial_quantity` decimal(12,4) DEFAULT NULL COMMENT '初始入库数量',
  `quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '当前库存台账数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位快照',
  `status` varchar(50) NOT NULL DEFAULT 'available' COMMENT 'available/partial_used/used_up/disabled',
  `location` varchar(100) DEFAULT NULL COMMENT '存放位置',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_batches_no_deleted` (`material_batch_no`,`is_deleted`),
  KEY `idx_material_batches_product_id` (`product_id`),
  KEY `idx_material_batches_supplier_name` (`supplier_name`),
  KEY `idx_material_batches_status` (`status`),
  KEY `idx_material_batches_is_deleted` (`is_deleted`),
  KEY `idx_material_batches_created_by` (`created_by`),
  KEY `idx_material_batches_updated_by` (`updated_by`),
  KEY `idx_material_batches_deleted_by` (`deleted_by`),
  KEY `idx_material_batches_protocol_code` (`protocol_code`),
  CONSTRAINT `fk_material_batches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_material_batches_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_material_batches_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_material_batches_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_material_batches_quantity` CHECK ((`quantity` >= 0)),
  CONSTRAINT `chk_material_batches_status` CHECK ((`status` in (_utf8mb4'available',_utf8mb4'partial_used',_utf8mb4'used_up',_utf8mb4'disabled')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物料批次表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_batches`
--

LOCK TABLES `material_batches` WRITE;
/*!40000 ALTER TABLE `material_batches` DISABLE KEYS */;
INSERT INTO `material_batches` VALUES (1,2,'WL-001','PCB供应商',NULL,'2026-06-12',100.0000,20.0000,NULL,'used_up',NULL,NULL,NULL,'2026-06-12 13:46:15',1,'2026-07-02 09:54:54',0,NULL,NULL),(4,5,'WL-002','材料有限公司','JSXY-001','2026-06-24',400.0000,160.0000,NULL,'used_up',NULL,NULL,1,'2026-06-24 11:22:14',1,'2026-07-02 09:54:54',0,NULL,NULL),(5,4,'WL-003','材料有限公司','JSXY-002','2026-06-24',250.0000,170.0000,NULL,'partial_used',NULL,NULL,1,'2026-06-24 11:24:04',1,'2026-07-02 09:54:54',0,NULL,NULL),(6,3,'WL-004','材料有限公司','JSXY-003','2026-06-24',300.0000,220.0000,NULL,'partial_used',NULL,NULL,1,'2026-06-24 11:28:21',1,'2026-07-02 09:54:54',0,NULL,NULL),(8,3,'WL-005','材料','JSXY-004','2026-06-26',150.0000,150.0000,NULL,'available',NULL,NULL,1,'2026-06-26 11:55:16',NULL,'2026-07-02 09:54:54',0,NULL,NULL),(9,5,'WL-006','材料','JSXY-001','2026-06-26',200.0000,200.0000,NULL,'available',NULL,NULL,1,'2026-06-26 11:57:36',NULL,'2026-07-02 09:54:54',0,NULL,NULL),(10,2,'WL-007','材料','JSXY-000','2026-06-26',200.0000,199.0000,NULL,'available',NULL,NULL,1,'2026-06-26 11:58:07',1,'2026-07-02 09:54:54',0,NULL,NULL);
/*!40000 ALTER TABLE `material_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operation_logs`
--

DROP TABLE IF EXISTS `operation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operation_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `log_type` varchar(32) NOT NULL,
  `module` varchar(64) NOT NULL,
  `action` varchar(128) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `operator_username` varchar(100) DEFAULT NULL COMMENT '操作人用户名快照',
  `target_id` bigint unsigned DEFAULT NULL,
  `target_type` varchar(64) DEFAULT NULL,
  `target_ids` json DEFAULT NULL COMMENT '一个请求涉及的多个业务对象ID',
  `business_key` varchar(128) DEFAULT NULL COMMENT '业务单号或可读业务键',
  `result` varchar(32) NOT NULL DEFAULT 'success',
  `request_id` varchar(64) DEFAULT NULL COMMENT '请求链路ID',
  `http_method` varchar(16) DEFAULT NULL COMMENT 'HTTP方法',
  `route` varchar(255) DEFAULT NULL COMMENT '路由模板',
  `http_status` int DEFAULT NULL COMMENT 'HTTP响应状态码',
  `duration_ms` int DEFAULT NULL COMMENT '请求耗时毫秒',
  `request_data` json DEFAULT NULL COMMENT '脱敏后的路径、查询和请求体参数',
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL COMMENT '客户端User-Agent',
  `error_code` varchar(100) DEFAULT NULL COMMENT '异常类型或错误代码',
  `remark` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_operation_logs_log_type` (`log_type`),
  KEY `idx_operation_logs_module` (`module`),
  KEY `idx_operation_logs_action` (`action`),
  KEY `idx_operation_logs_user_id` (`user_id`),
  KEY `idx_operation_logs_result` (`result`),
  KEY `idx_operation_logs_created_at` (`created_at`),
  KEY `idx_operation_logs_request_id` (`request_id`),
  KEY `idx_operation_logs_target` (`target_type`,`target_id`),
  KEY `idx_operation_logs_business_key` (`business_key`),
  KEY `idx_operation_logs_http_status` (`http_status`),
  CONSTRAINT `fk_operation_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=314 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation_logs`
--

LOCK TABLES `operation_logs` WRITE;
/*!40000 ALTER TABLE `operation_logs` DISABLE KEYS */;
INSERT INTO `operation_logs` VALUES (1,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=4ms','2026-06-11 13:39:25'),(2,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 13:40:11'),(3,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 13:59:47'),(4,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-11 13:59:47'),(5,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 13:59:47'),(6,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 14:16:24'),(7,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=4ms','2026-06-11 14:16:24'),(8,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 14:20:25'),(9,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:48'),(10,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:49'),(11,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:49'),(12,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:56'),(13,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:56'),(14,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:57'),(15,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 14:25:39'),(16,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 14:25:41'),(17,'operation','product-categories','POST /product-categories',1,NULL,NULL,'product-categories',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"3\", \"status\": 1}','::1',NULL,NULL,'duration=11ms','2026-06-11 14:26:27'),(18,'operation','product-categories','PUT /product-categories/2',1,NULL,2,'product-categories',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": 1}','::1',NULL,NULL,'duration=10ms','2026-06-11 14:27:55'),(19,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 14:29:41'),(20,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 14:31:15'),(21,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=2ms','2026-06-11 14:47:50'),(22,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 14:47:50'),(23,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 14:47:50'),(24,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 14:47:50'),(25,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-11 14:47:50'),(26,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 14:47:50'),(27,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 15:05:17'),(28,'operation','products','PUT /products/1',1,NULL,1,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": 1}','::1',NULL,NULL,'duration=13ms','2026-06-11 15:06:38'),(29,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=5ms','2026-06-11 15:20:14'),(30,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 15:20:14'),(31,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 15:24:23'),(32,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=3ms','2026-06-11 15:42:42'),(33,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 15:42:42'),(34,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 15:42:43'),(35,'operation','processes','PUT /processes/1',1,NULL,1,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": 1}','::1',NULL,NULL,'duration=10ms','2026-06-11 15:43:24'),(36,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=5ms','2026-06-11 15:45:58'),(37,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 15:54:17'),(38,'operation','processes','POST /processes',1,NULL,NULL,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"3\", \"status\": 1}','::1',NULL,NULL,'duration=11ms','2026-06-11 15:56:12'),(39,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 16:09:36'),(40,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 16:09:36'),(41,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 16:13:51'),(42,'operation','processes','POST /processes',1,NULL,NULL,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"4\", \"status\": 1}','::1',NULL,NULL,'duration=12ms','2026-06-11 16:27:06'),(43,'operation','processes','POST /processes/4/sop',1,NULL,4,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"4\", \"status\": 1}','::1',NULL,NULL,'duration=26ms','2026-06-11 16:27:36'),(44,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 16:30:07'),(45,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-11 16:30:07'),(46,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 16:30:08'),(47,'operation','routes','PUT /routes/1/processes',1,NULL,1,'routes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": 1}','::1',NULL,NULL,'duration=24ms','2026-06-11 16:30:27'),(48,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 16:47:14'),(49,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 17:01:49'),(50,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 17:01:53'),(51,'operation','processes','POST /processes',1,NULL,NULL,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"5\", \"status\": 1}','::1',NULL,NULL,'duration=10ms','2026-06-11 17:02:39'),(52,'operation','processes','PUT /processes/5/disable',1,NULL,5,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"5\", \"status\": 0}','::1',NULL,NULL,'duration=10ms','2026-06-11 17:06:03'),(53,'operation','processes','PUT /processes/5/enable',1,NULL,5,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"5\", \"status\": 1}','::1',NULL,NULL,'duration=8ms','2026-06-11 17:06:17'),(54,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=2ms','2026-06-11 17:18:02'),(55,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-11 17:18:02'),(56,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-11 17:18:02'),(57,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-11 17:18:02'),(58,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-11 17:20:42'),(59,'operation','processes','POST /processes/5/sop',1,NULL,5,'processes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"5\", \"status\": 1}','::1',NULL,NULL,'duration=27ms','2026-06-11 17:22:41'),(60,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 09:28:06'),(61,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 09:44:21'),(62,'operation','routes','PUT /routes/1/products',1,NULL,1,'routes',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": 1}','::1',NULL,NULL,'duration=16ms','2026-06-12 09:44:47'),(63,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-12 10:06:33'),(64,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 10:06:33'),(65,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 10:06:34'),(66,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-12 10:06:34'),(67,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 10:24:10'),(68,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=2ms','2026-06-12 10:43:57'),(69,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 10:43:57'),(70,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 10:43:58'),(71,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 11:16:55'),(72,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 11:32:33'),(73,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-12 11:49:10'),(74,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 11:49:10'),(75,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 13:43:07'),(76,'operation','warehouse','POST /warehouse/inventory',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"available\"}','::1',NULL,NULL,'duration=12ms','2026-06-12 13:46:15'),(77,'operation','warehouse','PUT /warehouse/inventory/1/disable',1,NULL,1,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"disabled\"}','::1',NULL,NULL,'duration=8ms','2026-06-12 13:47:20'),(78,'operation','warehouse','PUT /warehouse/inventory/1/enable',1,NULL,1,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"available\"}','::1',NULL,NULL,'duration=10ms','2026-06-12 13:47:23'),(79,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 13:59:47'),(80,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 13:59:47'),(81,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 13:59:49'),(82,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 14:20:30'),(83,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 14:20:30'),(84,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 14:21:41'),(85,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 14:27:26'),(86,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 14:27:34'),(87,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=3ms','2026-06-12 14:48:34'),(88,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-12 14:48:34'),(89,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 14:51:25'),(90,'operation','orders','POST /orders',1,NULL,NULL,'orders',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"draft\"}','::1',NULL,NULL,'duration=41ms','2026-06-12 14:53:35'),(91,'operation','orders','PUT /orders/1/release',1,NULL,1,'orders',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"released\"}','::1',NULL,NULL,'duration=11ms','2026-06-12 14:54:04'),(92,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 15:07:05'),(93,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 15:07:05'),(94,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 15:07:06'),(95,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 15:39:11'),(96,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 15:39:11'),(97,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-12 15:39:12'),(98,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=3ms','2026-06-12 17:10:24'),(99,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=0ms','2026-06-12 17:10:24'),(100,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-15 09:18:38'),(101,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-15 09:28:50'),(102,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=4ms','2026-06-15 10:07:22'),(103,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=1ms','2026-06-15 10:07:22'),(104,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-15 10:07:23'),(105,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=4ms','2026-06-15 10:42:01'),(106,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=2ms','2026-06-15 10:42:01'),(107,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=41ms','2026-06-15 11:09:08'),(108,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-15 11:37:00'),(109,'operation','tasks','POST /tasks',1,NULL,NULL,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"pending\"}','::1',NULL,NULL,'duration=37ms','2026-06-15 11:41:08'),(110,'operation','tasks','POST /tasks/1/dispatch',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"assigned\"}','::1',NULL,NULL,'duration=22ms','2026-06-15 11:41:34'),(111,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=11ms','2026-06-15 11:41:36'),(112,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=20ms','2026-06-15 13:37:27'),(113,'operation','tasks','POST /tasks/1/dispatch',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"assigned\"}','::1',NULL,NULL,'duration=20ms','2026-06-15 14:03:14'),(114,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=42ms','2026-06-15 15:53:06'),(115,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-15 15:53:57'),(116,'operation','products','POST /products',1,NULL,NULL,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"3\", \"status\": 1}','::1',NULL,NULL,'duration=19ms','2026-06-15 16:12:40'),(117,'operation','products','POST /products',1,NULL,NULL,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"4\", \"status\": 1}','::1',NULL,NULL,'duration=8ms','2026-06-15 16:13:29'),(118,'operation','products','POST /products',1,NULL,NULL,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"5\", \"status\": 1}','::1',NULL,NULL,'duration=9ms','2026-06-15 16:14:04'),(119,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=23ms','2026-06-15 16:14:06'),(120,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-16 11:26:34'),(121,'operation','products','PUT /products/2',1,NULL,2,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": 1}','::1',NULL,NULL,'duration=13ms','2026-06-16 11:26:59'),(122,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-16 11:27:20'),(123,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=7ms','2026-06-16 13:46:08'),(124,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=2ms','2026-06-16 13:46:08'),(125,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-16 13:46:11'),(126,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-16 15:13:06'),(127,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-16 15:13:08'),(128,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-16 15:13:17'),(129,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=7ms','2026-06-16 15:26:24'),(130,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=15ms','2026-06-16 15:26:24'),(131,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-16 15:57:03'),(132,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-17 10:47:34'),(133,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-17 10:48:15'),(134,'operation','tasks','POST /tasks',1,NULL,NULL,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Task quantity exceeds work order planned quantity','2026-06-17 10:54:36'),(135,'operation','tasks','POST /tasks',1,NULL,NULL,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Task quantity exceeds work order planned quantity','2026-06-17 10:54:44'),(136,'operation','orders','POST /orders',1,NULL,NULL,'orders',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"draft\"}','::1',NULL,NULL,'duration=13ms','2026-06-17 10:55:49'),(137,'operation','tasks','POST /tasks',1,NULL,NULL,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Task quantity exceeds work order planned quantity','2026-06-17 10:56:32'),(138,'operation','tasks','POST /tasks',1,NULL,NULL,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Task quantity exceeds work order planned quantity','2026-06-17 10:56:45'),(139,'operation','tasks','POST /tasks',1,NULL,NULL,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Task quantity exceeds work order planned quantity','2026-06-17 10:58:17'),(140,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=6ms','2026-06-17 11:08:32'),(141,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=5ms','2026-06-17 11:08:32'),(142,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-17 11:08:33'),(143,'operation','orders','PUT /orders/2/release',1,NULL,2,'orders',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"released\"}','::1',NULL,NULL,'duration=13ms','2026-06-17 11:10:16'),(144,'operation','orders','POST /orders/2/tasks',1,NULL,2,'orders',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"pending\"}','::1',NULL,NULL,'duration=22ms','2026-06-17 11:16:37'),(145,'operation','orders','POST /orders/1/tasks',1,NULL,1,'orders',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Batch quantity exceeds work order planned quantity','2026-06-17 11:16:48'),(146,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-17 11:18:33'),(147,'operation','tasks','POST /tasks/2/dispatch',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"assigned\"}','::1',NULL,NULL,'duration=15ms','2026-06-17 11:19:07'),(148,'operation','worker','PUT /worker/tasks/2/steps/1',1,NULL,1,'worker',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"assigned\"}','::1',NULL,NULL,'duration=16ms','2026-06-17 11:19:18'),(149,'operation','worker','PUT /worker/tasks/2/steps/1',1,NULL,1,'worker',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"assigned\"}','::1',NULL,NULL,'duration=16ms','2026-06-17 11:19:34'),(150,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-22 09:52:41'),(151,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-22 14:34:40'),(152,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求','2026-06-22 14:35:37'),(153,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-22 14:42:37'),(154,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=10ms','2026-06-22 14:46:39'),(155,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=7ms','2026-06-22 14:46:49'),(156,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=8ms','2026-06-22 14:48:29'),(157,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=7ms','2026-06-22 14:48:31'),(158,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=6ms','2026-06-22 14:48:32'),(159,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-22 14:48:42'),(160,'operation','products','PUT /products/1/materials',1,NULL,1,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=17ms','2026-06-22 14:52:56'),(161,'operation','products','PUT /products/1/materials',1,NULL,1,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=21ms','2026-06-22 14:53:08'),(162,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=24ms','2026-06-22 14:53:12'),(163,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=12ms','2026-06-22 14:53:42'),(164,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=13ms','2026-06-22 14:53:47'),(165,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-22 15:01:47'),(166,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=17ms','2026-06-22 15:02:20'),(167,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=18ms','2026-06-22 15:02:27'),(168,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=15ms','2026-06-22 15:02:38'),(169,'operation','tasks','PUT /tasks/2',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=29ms','2026-06-22 16:13:20'),(170,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=28ms','2026-06-22 16:55:36'),(171,'operation','products','PUT /products/1/materials',1,NULL,1,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=25ms','2026-06-22 16:55:56'),(172,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=16ms','2026-06-22 16:56:15'),(173,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=66ms','2026-06-22 17:18:07'),(174,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=62ms','2026-06-22 17:18:07'),(175,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=24ms','2026-06-23 13:40:23'),(176,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=14ms','2026-06-23 13:40:32'),(177,'operation','tasks','PUT /tasks/2',1,NULL,2,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Duplicate entry \'2-4-1\' for key \'batch_step_records.uk_batch_step_records_batch_step_deleted\'','2026-06-23 14:08:07'),(178,'operation','tasks','PUT /tasks/2',1,NULL,2,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Duplicate entry \'2-4-1\' for key \'batch_step_records.uk_batch_step_records_batch_step_deleted\'','2026-06-23 14:08:08'),(179,'operation','tasks','PUT /tasks/2',1,NULL,2,'tasks',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'Duplicate entry \'2-4-1\' for key \'batch_step_records.uk_batch_step_records_batch_step_deleted\'','2026-06-23 14:08:08'),(180,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=23ms','2026-06-23 14:08:20'),(181,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=70ms','2026-06-23 14:58:11'),(182,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=46ms','2026-06-23 17:27:18'),(183,'operation','orders','PUT /orders/2',1,NULL,2,'orders',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"released\"}','::1',NULL,NULL,'duration=17ms','2026-06-24 10:17:44'),(184,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=25ms','2026-06-24 10:22:58'),(185,'operation','tasks','POST /tasks/2/material-demand',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=27ms','2026-06-24 10:32:46'),(186,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=21ms','2026-06-24 10:33:00'),(187,'operation','tasks','POST /tasks/1/material-demand',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=20ms','2026-06-24 10:33:12'),(188,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'generated\n            WHERE generated.batch_id = b.id\n              AND generate\' at line 29','2026-06-24 10:37:10'),(189,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'generated\n            WHERE generated.batch_id = b.id\n              AND generate\' at line 29','2026-06-24 10:37:11'),(190,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'generated\n            WHERE generated.batch_id = b.id\n              AND generate\' at line 29','2026-06-24 10:37:11'),(191,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'generated\n            WHERE generated.batch_id = b.id\n              AND generate\' at line 29','2026-06-24 10:37:14'),(192,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'generated\n            WHERE generated.batch_id = b.id\n              AND generate\' at line 29','2026-06-24 10:37:14'),(193,'operation','products','PUT /products/2/materials',1,NULL,2,'products',NULL,NULL,'failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'generated\n            WHERE generated.batch_id = b.id\n              AND generate\' at line 29','2026-06-24 10:37:15'),(194,'operation','warehouse','POST /warehouse/material-transactions/inbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=10ms','2026-06-24 11:22:14'),(195,'operation','warehouse','POST /warehouse/material-transactions/inbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=7ms','2026-06-24 11:24:04'),(196,'operation','warehouse','POST /warehouse/material-transactions/inbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}','::1',NULL,NULL,'duration=9ms','2026-06-24 11:28:21'),(197,'operation','material-allocation','POST /material-allocation/batches/2/allocate',1,NULL,2,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=23ms','2026-06-24 11:28:34'),(198,'operation','material-allocation','POST /material-allocation/batches/2/allocate',1,NULL,2,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=21ms','2026-06-24 11:28:47'),(199,'operation','material-allocation','POST /material-allocation/batches/2/allocate',1,NULL,2,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=18ms','2026-06-24 11:28:52'),(200,'operation','material-allocation','POST /material-allocation/batches/2/allocate',1,NULL,2,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"material_assigned\"}','::1',NULL,NULL,'duration=19ms','2026-06-24 11:28:56'),(201,'operation','material-allocation','POST /material-allocation/batches/1/allocate',1,NULL,1,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=16ms','2026-06-24 11:29:19'),(202,'operation','material-allocation','POST /material-allocation/batches/1/allocate',1,NULL,1,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=17ms','2026-06-24 11:29:24'),(203,'operation','material-allocation','POST /material-allocation/batches/1/allocate',1,NULL,1,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=19ms','2026-06-24 11:29:29'),(204,'operation','material-allocation','POST /material-allocation/batches/1/allocate',1,NULL,1,'material-allocation',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"material_pending\"}','::1',NULL,NULL,'duration=17ms','2026-06-24 11:29:34'),(205,'operation','warehouse','POST /warehouse/material-transactions/outbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=15ms','2026-06-24 13:36:07'),(206,'operation','warehouse','POST /warehouse/material-transactions/outbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=8ms','2026-06-24 13:36:14'),(207,'operation','tasks','PUT /tasks/2/start',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"doing\"}','::1',NULL,NULL,'duration=17ms','2026-06-24 13:37:14'),(208,'operation','warehouse','POST /warehouse/material-transactions/outbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=10ms','2026-06-24 13:50:12'),(209,'operation','warehouse','POST /warehouse/material-transactions/outbound',1,NULL,NULL,'warehouse',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=11ms','2026-06-24 13:50:16'),(210,'operation','tasks','PUT /tasks/2/start',1,NULL,2,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": \"doing\"}','::1',NULL,NULL,'duration=13ms','2026-06-24 13:50:54'),(211,'operation','tasks','PUT /tasks/1/start',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"doing\"}','::1',NULL,NULL,'duration=11ms','2026-06-24 13:50:58'),(212,'operation','tasks','PUT /tasks/1',1,NULL,1,'tasks',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"1\", \"status\": \"doing\"}','::1',NULL,NULL,'duration=40ms','2026-06-24 13:53:56'),(213,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=65ms','2026-06-24 14:15:43'),(214,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=73ms','2026-06-24 14:17:59'),(215,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"success\": true}','::1',NULL,NULL,'duration=83ms','2026-06-24 14:30:02'),(216,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-24 16:04:42'),(217,'operation','products','PUT /products/2',1,NULL,2,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": 1}','::1',NULL,NULL,'duration=17ms','2026-06-24 16:12:53'),(218,'operation','products','PUT /products/2',1,NULL,2,'products',NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"id\": \"2\", \"status\": 1}','::1',NULL,NULL,'duration=14ms','2026-06-24 16:17:57'),(219,'operation','material-allocation','清除物料分配',1,'admin',1,'production_batch_material','{\"productMaterialId\": \"6\", \"productionBatchId\": \"1\"}',NULL,'success','aed97870-066c-4e02-bbda-fe689ad18a3a','DELETE','/material-allocation/batches/:batchId/product-materials/:productMaterialId',200,27,'{\"body\": {}, \"query\": {}, \"params\": {\"batchId\": \"1\", \"productMaterialId\": \"6\"}}','{\"id\": 42, \"unit\": \"pcs\", \"remark\": null, \"status\": \"reserved\", \"batch_id\": 1, \"usage_id\": 42, \"material_name\": \"带线腔体\", \"plan_quantity\": \"100.0000\", \"used_quantity\": \"0.0000\", \"material_model\": \"GX-20260615001\", \"is_key_material\": 1, \"material_batch_id\": 6, \"material_batch_no\": \"WL-004\", \"need_batch_record\": 1, \"quantity_per_unit\": \"1.0000\", \"reserved_quantity\": \"100.0000\", \"material_product_id\": 3, \"product_material_id\": 6}','{\"id\": 42, \"unit\": \"pcs\", \"remark\": null, \"status\": \"reserved\", \"batch_id\": 1, \"usage_id\": 42, \"material_name\": \"带线腔体\", \"plan_quantity\": \"100.0000\", \"used_quantity\": \"0.0000\", \"material_model\": \"GX-20260615001\", \"is_key_material\": 1, \"material_batch_id\": null, \"material_batch_no\": null, \"need_batch_record\": 1, \"quantity_per_unit\": \"1.0000\", \"reserved_quantity\": \"0.0000\", \"material_product_id\": 3, \"product_material_id\": 6}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=27ms','2026-06-25 15:29:53'),(220,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-06-25 16:51:12'),(221,'operation','material-allocation','分配生产物料',1,'admin',1,'production_batch','{\"productionBatchId\": \"1\"}',NULL,'success','73ec8214-f5a4-431b-950e-2e6f8920e26c','POST','/material-allocation/batches/:batchId/allocate',201,31,'{\"body\": {\"remark\": null, \"materialBatchId\": \"1\", \"reservedQuantity\": 20, \"productMaterialId\": \"7\"}, \"query\": {}, \"params\": {\"batchId\": \"1\"}}','{\"id\": 4, \"unit\": \"pcs\", \"remark\": null, \"status\": \"partial_allocated\", \"batch_id\": 1, \"usage_id\": 4, \"material_name\": \"环形器控制板\", \"plan_quantity\": \"100.0000\", \"used_quantity\": \"0.0000\", \"material_model\": \"PCB-CIR-001\", \"is_key_material\": 1, \"material_batch_id\": 1, \"material_batch_no\": \"WL-001\", \"need_batch_record\": 1, \"quantity_per_unit\": \"1.0000\", \"reserved_quantity\": \"20.0000\", \"material_product_id\": 2, \"product_material_id\": 7}','{\"id\": 4, \"unit\": \"pcs\", \"remark\": null, \"status\": \"partial_allocated\", \"batch_id\": 1, \"usage_id\": 4, \"material_name\": \"环形器控制板\", \"plan_quantity\": \"100.0000\", \"used_quantity\": \"0.0000\", \"material_model\": \"PCB-CIR-001\", \"is_key_material\": 1, \"material_batch_id\": 1, \"material_batch_no\": \"WL-001\", \"need_batch_record\": 1, \"quantity_per_unit\": \"1.0000\", \"reserved_quantity\": \"20.0000\", \"material_product_id\": 2, \"product_material_id\": 7}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=31ms','2026-06-25 16:52:06'),(222,'operation','warehouse','物料入库',1,'admin',NULL,'material_transaction',NULL,'WL-005','success','4d699d6b-e552-4d9b-b3f6-c49e1b206bf3','POST','/warehouse/material-transactions/inbound',201,19,'{\"body\": {\"remark\": \"\", \"quantity\": 150, \"productId\": \"3\", \"protocolCode\": \"JSXY-004\", \"receivedDate\": \"2026-06-26\", \"supplierName\": \"材料\", \"materialBatchNo\": \"WL-005\"}, \"query\": {}, \"params\": {}}',NULL,'{\"id\": 8, \"remark\": null, \"status\": \"available\", \"quantity\": \"150.0000\", \"product_id\": 3, \"updated_at\": \"2026-06-26T03:55:16.000Z\", \"updated_by\": null, \"protocol_code\": \"JSXY-004\", \"received_date\": \"2026-06-25T16:00:00.000Z\", \"supplier_name\": \"材料\", \"material_batch_no\": \"WL-005\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=19ms','2026-06-26 11:55:16'),(223,'operation','warehouse','物料入库',1,'admin',NULL,'material_transaction',NULL,'WL-006','success','ea94714a-b1fe-49a5-97d4-8c830a6404eb','POST','/warehouse/material-transactions/inbound',201,9,'{\"body\": {\"remark\": \"\", \"quantity\": 200, \"productId\": \"5\", \"protocolCode\": \"JSXY-001\", \"receivedDate\": \"2026-06-26\", \"supplierName\": \"材料\", \"materialBatchNo\": \"WL-006\"}, \"query\": {}, \"params\": {}}',NULL,'{\"id\": 9, \"remark\": null, \"status\": \"available\", \"quantity\": \"200.0000\", \"product_id\": 5, \"updated_at\": \"2026-06-26T03:57:36.000Z\", \"updated_by\": null, \"protocol_code\": \"JSXY-001\", \"received_date\": \"2026-06-25T16:00:00.000Z\", \"supplier_name\": \"材料\", \"material_batch_no\": \"WL-006\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=9ms','2026-06-26 11:57:36'),(224,'operation','warehouse','物料入库',1,'admin',NULL,'material_transaction',NULL,'WL-007','success','7cdc3993-e977-4167-800b-13633aab3231','POST','/warehouse/material-transactions/inbound',201,9,'{\"body\": {\"remark\": \"\", \"quantity\": 200, \"productId\": \"2\", \"protocolCode\": \"JSXY-000\", \"receivedDate\": \"2026-06-26\", \"supplierName\": \"材料\", \"materialBatchNo\": \"WL-007\"}, \"query\": {}, \"params\": {}}',NULL,'{\"id\": 10, \"remark\": null, \"status\": \"available\", \"quantity\": \"200.0000\", \"product_id\": 2, \"updated_at\": \"2026-06-26T03:58:07.000Z\", \"updated_by\": null, \"protocol_code\": \"JSXY-000\", \"received_date\": \"2026-06-25T16:00:00.000Z\", \"supplier_name\": \"材料\", \"material_batch_no\": \"WL-007\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=9ms','2026-06-26 11:58:07'),(225,'operation','material-allocation','分配生产物料',1,'admin',1,'production_batch','{\"productionBatchId\": \"1\"}',NULL,'success','24e8c7f2-4bde-4f59-ad9c-dcc303eec498','POST','/material-allocation/batches/:batchId/allocate',201,24,'{\"body\": {\"remark\": null, \"materialBatchId\": \"9\", \"reservedQuantity\": 140, \"productMaterialId\": \"4\"}, \"query\": {}, \"params\": {\"batchId\": \"1\"}}','{\"id\": 1, \"unit\": \"pcs\", \"remark\": null, \"status\": \"partial_allocated\", \"batch_id\": 1, \"usage_id\": 1, \"material_name\": \"粘合剂\", \"plan_quantity\": \"300.0000\", \"used_quantity\": \"0.0000\", \"material_model\": \"GX-20260615003\", \"is_key_material\": 1, \"material_batch_id\": 4, \"material_batch_no\": \"WL-002\", \"need_batch_record\": 1, \"quantity_per_unit\": \"3.0000\", \"reserved_quantity\": \"160.0000\", \"material_product_id\": 5, \"product_material_id\": 4}','{\"id\": 1, \"unit\": \"pcs\", \"remark\": null, \"status\": \"allocated\", \"batch_id\": 1, \"usage_id\": 1, \"material_name\": \"粘合剂\", \"plan_quantity\": \"300.0000\", \"used_quantity\": \"0.0000\", \"material_model\": \"GX-20260615003\", \"is_key_material\": 1, \"material_batch_id\": null, \"material_batch_no\": \"WL-002、WL-006\", \"need_batch_record\": 1, \"quantity_per_unit\": \"3.0000\", \"reserved_quantity\": \"300.0000\", \"material_product_id\": 5, \"product_material_id\": 4}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=24ms','2026-06-26 11:58:32'),(226,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','0392a76f-cc09-4ee8-ad1d-5c16fed9986c','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:53:08'),(227,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','23b5285c-da2f-487a-8850-41691eec516c','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:53:09'),(228,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','d1bca47f-852e-4342-a7ac-10fbc343561f','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:53:10'),(229,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','72b21c67-0411-4373-acd0-36068bf26004','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:54:22'),(230,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','3f36a008-5d30-4d29-a9dc-811d5ed57185','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:54:23'),(231,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','8ee81434-350d-4930-b268-87d062ce377f','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:54:24'),(232,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','d991e18a-2d08-48c6-9caf-94d35f18c7c9','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:39'),(233,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','a27e6dc4-af7f-400c-b8a7-a09914609eac','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:40'),(234,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','6b9d292e-1a82-4a50-8379-44a4c5740e57','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:40'),(235,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','06f7f744-c8b3-463a-9b93-7fd10413adf7','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:45'),(236,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','5555e587-deed-4b13-9f00-dd255a9fb99a','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:45'),(237,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','0408f7f9-6d93-45c3-b433-45d40f7b1604','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:46'),(238,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','39073e99-6840-4c14-bf17-ae4f07314f2e','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:58'),(239,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','b34261db-576a-442c-b850-791f7f354ba7','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:58:59'),(240,'security','tasks','GET /tasks',1,'admin',NULL,NULL,NULL,NULL,'failed','3850f2ba-c66b-4edd-82c9-04238c77e479','GET','/tasks',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"ownerId\": \"\", \"pageSize\": \"10\", \"productId\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.batch_material_requirement\' doesn\'t exist','2026-07-01 10:59:00'),(241,'security','auth','POST /auth/refresh',NULL,NULL,NULL,NULL,NULL,NULL,'failed','15b7b6c2-ac28-4148-83bc-9a02b2f56472','POST','/auth/refresh',401,NULL,'{\"query\": {}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','UnauthorizedException','Missing refresh token','2026-07-01 11:06:52'),(242,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 11:06:54'),(243,'security','warehouse','GET /warehouse/stocktakes',1,'admin',NULL,NULL,NULL,NULL,'failed','e809c3b5-38ac-4c88-9b5d-077baa74dc10','GET','/warehouse/stocktakes',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"pageSize\": \"10\", \"inventoryType\": \"\", \"differenceType\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:51'),(244,'security','warehouse','GET /warehouse/stocktakes',1,'admin',NULL,NULL,NULL,NULL,'failed','05467a96-1429-4f89-aed9-044e4c7969cf','GET','/warehouse/stocktakes',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"pageSize\": \"10\", \"inventoryType\": \"\", \"differenceType\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:52'),(245,'security','warehouse','GET /warehouse/stocktakes',1,'admin',NULL,NULL,NULL,NULL,'failed','055d42b5-0166-4795-9fd6-501fa879d991','GET','/warehouse/stocktakes',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"pageSize\": \"10\", \"inventoryType\": \"\", \"differenceType\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:52'),(246,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','00927cf2-4694-4144-a061-d3c35bcd5736','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:56'),(247,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','71c30b42-ba88-4ec0-bd1d-ad4c18237c08','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:56'),(248,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','0ff330ad-7d24-4d6a-91d9-552949daa545','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:57'),(249,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','f9bbef0f-ad9d-426e-8147-da5984a0e6f2','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:58'),(250,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','71fab393-1eac-447c-a0e2-257ef5201f70','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:59'),(251,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','88e0237a-5a22-4bde-96bb-666a169db56f','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:11:59'),(252,'security','warehouse','GET /warehouse/stocktakes',1,'admin',NULL,NULL,NULL,NULL,'failed','b0707278-0075-43dc-a3d2-360b89e46834','GET','/warehouse/stocktakes',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"pageSize\": \"10\", \"inventoryType\": \"\", \"differenceType\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:05'),(253,'security','warehouse','GET /warehouse/stocktakes',1,'admin',NULL,NULL,NULL,NULL,'failed','ba9f2248-f9b7-4c47-8eaa-ac4374197fac','GET','/warehouse/stocktakes',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"pageSize\": \"10\", \"inventoryType\": \"\", \"differenceType\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:05'),(254,'security','warehouse','GET /warehouse/stocktakes',1,'admin',NULL,NULL,NULL,NULL,'failed','14293af5-e746-4de5-baac-8906a07177ea','GET','/warehouse/stocktakes',500,NULL,'{\"query\": {\"page\": \"1\", \"status\": \"\", \"keyword\": \"\", \"pageSize\": \"10\", \"inventoryType\": \"\", \"differenceType\": \"\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:06'),(255,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','61842856-42cd-4d18-8655-e8054670e6f2','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:08'),(256,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','8fb888b4-ff43-482a-8f02-53420a1bb9d5','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:08'),(257,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','6c6dcdbf-6fa3-4d54-ae89-c2ff391a1007','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:09'),(258,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','d36d8805-80a1-4e73-ba46-44f559d9fa69','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:19'),(259,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','c9302512-827b-48b6-a216-8c62ae72ad97','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:20'),(260,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','002d6acb-3d5f-4c6c-a07c-982a9ff38e22','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:20'),(261,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','d9a77731-bd10-4415-b84b-6eae2c082c19','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:20'),(262,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','ca4a088b-bb8c-411b-b24d-a3cd697ed0c8','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(263,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','a890733d-29e0-481b-ba24-75fec77cfcb1','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(264,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','47341545-922e-4a64-b35d-094abda35c31','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(265,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','a65145ae-c662-4aa0-aa8b-8c8fce7e0519','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(266,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','ad7a4fc3-a8cd-48eb-887c-d55c86e09898','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(267,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','34f31091-c14a-4469-bebb-6502ecb29c8b','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(268,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','41eb8f01-e27d-4d5e-8032-7639f889a88b','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(269,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','182e62dd-8e90-488b-b31d-359577828f39','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(270,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','156b6490-b5ff-456e-860e-f1b6a449c3de','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(271,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','efdf7644-1341-4679-9038-f7f2b6cb00bb','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(272,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','f73124fd-094b-4586-a7bc-dc8f082acb6a','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(273,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','c6bb7a82-aa70-4d45-85a6-51e9a9308262','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:21'),(274,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','c3b06f1f-4347-48c7-90f6-4111af2b188d','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(275,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','43104c38-fcaf-45cb-8147-01c9d9fc0786','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(276,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','fa7d7398-8e3e-40d6-a9f1-3f8f10cdd167','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(277,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','e8a866b5-4426-44d0-98ad-9127ea6de50e','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(278,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','f383b10e-b7b3-4488-8899-f353c3892e71','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(279,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','33fb0233-9b33-4903-afdd-766fa503f6c8','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(280,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','7f044108-2f4e-4246-b5d0-c9b0d8d313f4','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(281,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','e028e951-af56-4587-9044-90ebe10ae46b','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(282,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','2f04e0b2-2791-438a-8274-4eae49e07ca0','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(283,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','92321d24-b048-4727-aecf-9f372717cca3','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(284,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','1c782cc1-de8f-4be2-8bc4-7d4c2006f489','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(285,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','1160f39b-4c3c-406c-bef3-a5aeba38ac8c','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:22'),(286,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','7a23d74c-3d0c-42c3-8676-273719b74ccf','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:23'),(287,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','6872b650-8319-4353-92d5-39d494e69f02','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:12:23'),(288,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','083ad869-506d-40d5-b962-5454ad4a80aa','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:45:06'),(289,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','2de153b0-2c5c-4995-9ab1-aa10371d786b','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:45:06'),(290,'security','warehouse','GET /warehouse/stocktakes/targets',1,'admin',NULL,NULL,NULL,NULL,'failed','3735f8e5-ed3f-439a-974b-12f8be3136e6','GET','/warehouse/stocktakes/targets',500,NULL,'{\"query\": {\"keyword\": \"\", \"inventoryType\": \"material\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','ER_NO_SUCH_TABLE','Table \'company_test.product_inventory_batches\' doesn\'t exist','2026-07-01 15:45:07'),(291,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 15:50:11'),(292,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 15:50:28'),(293,'operation','warehouse','库存盘点登记',1,'admin',NULL,'inventory_stocktake',NULL,'10','success','1f6dbd87-6949-4752-b865-1f956bf66cd7','POST','/warehouse/stocktakes',201,21,'{\"body\": {\"remark\": null, \"operatedAt\": null, \"reasonType\": \"漏记了一个\", \"inventoryType\": \"material\", \"countedQuantity\": 199, \"inventoryBatchId\": \"10\"}, \"query\": {}, \"params\": {}}',NULL,'{\"id\": \"1\", \"remark\": null, \"status\": \"confirmed\", \"fileUrl\": null, \"createdAt\": \"2026-07-01T07:57:18.000Z\", \"updatedAt\": \"2026-07-01T07:57:18.000Z\", \"adjustedAt\": null, \"objectType\": \"PCB\", \"operatedAt\": \"2026-07-01T07:57:18.000Z\", \"reasonType\": \"漏记了一个\", \"productName\": \"环形器控制板\", \"stocktakeNo\": \"PD20260701155718241\", \"operatorName\": \"系统管理员\", \"productModel\": \"PCB-CIR-001\", \"afterQuantity\": null, \"inventoryType\": \"material\", \"adjustedByName\": null, \"beforeQuantity\": \"200.0000\", \"differenceType\": \"shortage\", \"batchNoSnapshot\": \"WL-007\", \"countedQuantity\": \"199.0000\", \"inventoryBatchId\": \"10\", \"productIdSnapshot\": \"2\", \"differenceQuantity\": \"-1.0000\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=21ms','2026-07-01 15:57:18'),(294,'security','auth','POST /auth/refresh',NULL,NULL,NULL,NULL,NULL,NULL,'failed','ceea7d96-966f-4b18-bd3f-95f239ccc8d3','POST','/auth/refresh',401,NULL,'{\"query\": {}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','UnauthorizedException','Refresh token is no longer valid','2026-07-01 15:59:49'),(295,'auth','auth','POST /auth/logout',NULL,NULL,NULL,'auth',NULL,NULL,'success','f2adb5eb-275a-4e4f-8970-a184ab35be6d','POST','/auth/logout',201,2,'{\"body\": {}, \"query\": {}, \"params\": {}}',NULL,'{\"success\": true}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=2ms','2026-07-01 15:59:55'),(296,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 15:59:56'),(297,'operation','warehouse','库存盘点调账',1,'admin',1,'inventory_stocktake','{\"id\": \"1\"}',NULL,'success','1ed7b92a-432d-4b2a-b40c-665e24822186','POST','/warehouse/stocktakes/:id/adjust',201,15,'{\"body\": {\"remark\": null}, \"query\": {}, \"params\": {\"id\": \"1\"}}','{\"id\": 1, \"remark\": null, \"status\": \"confirmed\", \"file_url\": null, \"created_at\": \"2026-07-01T07:57:18.000Z\", \"updated_at\": \"2026-07-01T07:57:18.000Z\", \"adjusted_at\": null, \"object_type\": null, \"operated_at\": \"2026-07-01T07:57:18.000Z\", \"reason_type\": \"漏记了一个\", \"product_name\": null, \"stocktake_no\": \"PD20260701155718241\", \"operator_name\": null, \"product_model\": null, \"after_quantity\": null, \"inventory_type\": \"material\", \"before_quantity\": \"200.0000\", \"difference_type\": \"shortage\", \"adjusted_by_name\": null, \"counted_quantity\": \"199.0000\", \"batch_no_snapshot\": \"WL-007\", \"inventory_batch_id\": 10, \"difference_quantity\": \"-1.0000\", \"product_id_snapshot\": 2}','{\"id\": \"1\", \"remark\": null, \"status\": \"adjusted\", \"fileUrl\": null, \"createdAt\": \"2026-07-01T07:57:18.000Z\", \"updatedAt\": \"2026-07-01T08:00:17.000Z\", \"adjustedAt\": \"2026-07-01T08:00:17.000Z\", \"objectType\": \"PCB\", \"operatedAt\": \"2026-07-01T07:57:18.000Z\", \"reasonType\": \"漏记了一个\", \"productName\": \"环形器控制板\", \"stocktakeNo\": \"PD20260701155718241\", \"operatorName\": \"系统管理员\", \"productModel\": \"PCB-CIR-001\", \"afterQuantity\": \"199.0000\", \"inventoryType\": \"material\", \"adjustedByName\": \"系统管理员\", \"beforeQuantity\": \"200.0000\", \"differenceType\": \"shortage\", \"batchNoSnapshot\": \"WL-007\", \"countedQuantity\": \"199.0000\", \"inventoryBatchId\": \"10\", \"productIdSnapshot\": \"2\", \"differenceQuantity\": \"-1.0000\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=15ms','2026-07-01 16:00:17'),(298,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 16:15:32'),(299,'security','warehouse','GET /warehouse/stocktakes',NULL,NULL,NULL,NULL,NULL,NULL,'failed','3d62f392-a2e1-4490-b6d7-48949a800c46','GET','/warehouse/stocktakes',401,NULL,'{\"query\": {\"page\": \"1\", \"pageSize\": \"50\", \"inventoryType\": \"material\", \"inventoryBatchId\": \"1\"}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8737','UnauthorizedException','Missing bearer token','2026-07-01 16:15:32'),(300,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 16:15:54'),(301,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 16:16:11'),(302,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 16:16:34'),(303,'security','auth','POST /auth/refresh',NULL,NULL,NULL,NULL,NULL,NULL,'failed','12ec5493-e7f2-4a82-8189-568f9b35d5ec','POST','/auth/refresh',401,NULL,'{\"query\": {}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','UnauthorizedException','Refresh token is no longer valid','2026-07-01 16:52:28'),(304,'security','auth','POST /auth/refresh',NULL,NULL,NULL,NULL,NULL,NULL,'failed','5f9be818-7932-4be4-a1de-9e91ec7dfac0','POST','/auth/refresh',401,NULL,'{\"query\": {}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','UnauthorizedException','Refresh token is no longer valid','2026-07-01 16:52:28'),(305,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-01 16:52:30'),(306,'security','auth','POST /auth/refresh',NULL,NULL,NULL,NULL,NULL,NULL,'failed','2d79b2a1-19c0-4da0-99e5-9359c056752c','POST','/auth/refresh',401,NULL,'{\"query\": {}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','UnauthorizedException','Refresh token is no longer valid','2026-07-02 09:16:47'),(307,'security','auth','POST /auth/refresh',NULL,NULL,NULL,NULL,NULL,NULL,'failed','213062a4-0beb-4dfe-952c-fa728c8f12d0','POST','/auth/refresh',401,NULL,'{\"query\": {}, \"params\": {}}',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','UnauthorizedException','Refresh token is no longer valid','2026-07-02 09:16:47'),(308,'auth','auth','login',1,NULL,NULL,NULL,NULL,NULL,'success',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'::1',NULL,NULL,'admin','2026-07-02 09:16:49'),(309,'operation','production','创建生产工单',1,'admin',NULL,'work_order',NULL,'GD-003','success','fa963a6c-c508-4ed8-97b9-10f57c1aaefd','POST','/orders',201,18,'{\"body\": {\"remark\": \"\", \"orderNo\": \"GD-003\", \"ownerId\": \"2\", \"productId\": \"1\", \"planEndDate\": \"2026-07-31\", \"customerName\": \"航空航天有限公司\", \"planStartDate\": \"2026-07-07\", \"customerOrderNo\": \"DD-20260702001\", \"plannedQuantity\": 50}, \"query\": {}, \"params\": {}}',NULL,'{\"id\": \"3\", \"remark\": null, \"status\": \"draft\", \"batches\": [], \"orderNo\": \"GD-003\", \"ownerId\": \"2\", \"createdAt\": \"2026-07-02T05:54:26.000Z\", \"ownerName\": \"生产主管\", \"productId\": \"1\", \"updatedAt\": \"2026-07-02T05:54:26.000Z\", \"nextAction\": \"下达工单\", \"currentFlow\": \"草稿\", \"planEndDate\": \"2026-07-30\", \"productName\": \"宽带微带环形器\", \"customerName\": \"航空航天有限公司\", \"productModel\": \"HMITB60T180G-B2\", \"planStartDate\": \"2026-07-06\", \"customerOrderNo\": \"DD-20260702001\", \"plannedQuantity\": \"50.0000\", \"assignedQuantity\": \"0.0000\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=18ms','2026-07-02 13:54:26'),(310,'operation','production','下达生产工单',1,'admin',3,'work_order','{\"workOrderId\": \"3\"}',NULL,'success','89478004-4c79-42a2-a117-d1158dd5356e','PUT','/orders/:id/release',200,12,'{\"body\": {}, \"query\": {}, \"params\": {\"id\": \"3\"}}','{\"id\": 3, \"remark\": null, \"status\": \"draft\", \"order_no\": \"GD-003\", \"owner_id\": 2, \"product_id\": 1, \"customer_name\": \"航空航天有限公司\", \"plan_end_date\": \"2026-07-30T16:00:00.000Z\", \"plan_start_date\": \"2026-07-06T16:00:00.000Z\", \"planned_quantity\": \"50.0000\", \"customer_order_no\": \"DD-20260702001\", \"product_default_route_id\": 1}','{\"id\": \"3\", \"remark\": null, \"status\": \"released\", \"batches\": [], \"orderNo\": \"GD-003\", \"ownerId\": \"2\", \"createdAt\": \"2026-07-02T05:54:26.000Z\", \"ownerName\": \"生产主管\", \"productId\": \"1\", \"updatedAt\": \"2026-07-02T05:54:33.000Z\", \"nextAction\": \"分配生产批次\", \"currentFlow\": \"已下达，待分配生产批次\", \"planEndDate\": \"2026-07-30\", \"productName\": \"宽带微带环形器\", \"customerName\": \"航空航天有限公司\", \"productModel\": \"HMITB60T180G-B2\", \"planStartDate\": \"2026-07-06\", \"customerOrderNo\": \"DD-20260702001\", \"plannedQuantity\": \"50.0000\", \"assignedQuantity\": \"0.0000\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=12ms','2026-07-02 13:54:33'),(311,'operation','production','创建生产任务',1,'admin',NULL,'production_batch',NULL,NULL,'success','2bcd85fd-7532-4c4e-bc6e-07ab84261938','POST','/tasks',201,42,'{\"body\": {\"steps\": [{\"sopFileId\": \"1\", \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"4\"}, {\"sopFileId\": \"2\", \"responsibleUserId\": \"2\", \"processRouteStepsId\": \"5\"}, {\"sopFileId\": null, \"responsibleUserId\": \"4\", \"processRouteStepsId\": \"6\"}, {\"sopFileId\": \"3\", \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"7\"}], \"remark\": \"\", \"batchNo\": null, \"ownerId\": \"2\", \"routeId\": \"1\", \"planEndDate\": \"2026-06-17\", \"workOrderId\": \"2\", \"planStartDate\": \"2026-06-16\", \"plannedQuantity\": 20}, \"query\": {}, \"params\": {}}',NULL,'{\"id\": \"3\", \"steps\": [{\"id\": \"13\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"装配\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"1\", \"startedAt\": null, \"stepOrder\": 1, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"4\", \"responsibleUserName\": \"生产操作员\"}, {\"id\": \"14\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"调试\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"2\", \"startedAt\": null, \"stepOrder\": 2, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"2\", \"processRouteStepsId\": \"5\", \"responsibleUserName\": \"生产主管\"}, {\"id\": \"15\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"检验\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": null, \"startedAt\": null, \"stepOrder\": 3, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"4\", \"processRouteStepsId\": \"6\", \"responsibleUserName\": \"质量检验员\"}, {\"id\": \"16\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"焊接\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"3\", \"startedAt\": null, \"stepOrder\": 4, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"7\", \"responsibleUserName\": \"生产操作员\"}], \"remark\": null, \"status\": \"pending\", \"batchNo\": \"PB20260702001\", \"ownerId\": \"2\", \"routeId\": \"1\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"ownerName\": \"生产主管\", \"productId\": \"1\", \"routeName\": \"环形器标准工艺路线\", \"stepCount\": 4, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"planEndDate\": \"2026-06-16\", \"productName\": \"宽带微带环形器\", \"workOrderId\": \"2\", \"workOrderNo\": \"gd-002\", \"productModel\": \"HMITB60T180G-B2\", \"planStartDate\": \"2026-06-15\", \"dispatchStatus\": \"assigned\", \"materialStatus\": \"missing_demand\", \"plannedQuantity\": \"20.0000\", \"assignedStepCount\": 4, \"materialRequirements\": [{\"id\": \"4\", \"unit\": \"pcs\", \"usageId\": null, \"materialName\": \"粘合剂\", \"planQuantity\": \"60.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615003\", \"needBatchRecord\": true, \"quantityPerUnit\": \"3.0000\", \"materialProductId\": \"5\", \"productMaterialId\": \"4\"}, {\"id\": \"5\", \"unit\": \"pcs\", \"usageId\": null, \"materialName\": \"PCB板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615002\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"4\", \"productMaterialId\": \"5\"}, {\"id\": \"6\", \"unit\": \"pcs\", \"usageId\": null, \"materialName\": \"带线腔体\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"3\", \"productMaterialId\": \"6\"}, {\"id\": \"7\", \"unit\": \"pcs\", \"usageId\": null, \"materialName\": \"环形器控制板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"PCB-CIR-001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"2\", \"productMaterialId\": \"7\"}], \"assignedMaterialCount\": 0, \"materialRequirementCount\": 0}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=42ms','2026-07-02 13:55:06'),(312,'operation','production','生成物料需求',1,'admin',3,'production_batch','{\"productionBatchId\": \"3\"}',NULL,'success','5c6b8f84-f7be-4db4-9f4e-2dedc1a12984','POST','/tasks/:id/material-demand',201,27,'{\"body\": {}, \"query\": {}, \"params\": {\"id\": \"3\"}}',NULL,'{\"task\": {\"id\": \"3\", \"steps\": [{\"id\": \"13\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"装配\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"1\", \"startedAt\": null, \"stepOrder\": 1, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"4\", \"responsibleUserName\": \"生产操作员\"}, {\"id\": \"14\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"调试\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"2\", \"startedAt\": null, \"stepOrder\": 2, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"2\", \"processRouteStepsId\": \"5\", \"responsibleUserName\": \"生产主管\"}, {\"id\": \"15\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"检验\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": null, \"startedAt\": null, \"stepOrder\": 3, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"4\", \"processRouteStepsId\": \"6\", \"responsibleUserName\": \"质量检验员\"}, {\"id\": \"16\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"焊接\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"3\", \"startedAt\": null, \"stepOrder\": 4, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"7\", \"responsibleUserName\": \"生产操作员\"}], \"remark\": null, \"status\": \"material_pending\", \"batchNo\": \"PB20260702001\", \"ownerId\": \"2\", \"routeId\": \"1\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"ownerName\": \"生产主管\", \"productId\": \"1\", \"routeName\": \"环形器标准工艺路线\", \"stepCount\": 4, \"updatedAt\": \"2026-07-02T05:56:26.000Z\", \"planEndDate\": \"2026-06-16\", \"productName\": \"宽带微带环形器\", \"workOrderId\": \"2\", \"workOrderNo\": \"gd-002\", \"productModel\": \"HMITB60T180G-B2\", \"planStartDate\": \"2026-06-15\", \"dispatchStatus\": \"assigned\", \"materialStatus\": \"unallocated\", \"plannedQuantity\": \"20.0000\", \"assignedStepCount\": 4, \"materialRequirements\": [{\"id\": \"12\", \"unit\": \"pcs\", \"usageId\": \"12\", \"materialName\": \"粘合剂\", \"planQuantity\": \"60.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615003\", \"needBatchRecord\": true, \"quantityPerUnit\": \"3.0000\", \"materialProductId\": \"5\", \"productMaterialId\": \"4\"}, {\"id\": \"11\", \"unit\": \"pcs\", \"usageId\": \"11\", \"materialName\": \"PCB板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615002\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"4\", \"productMaterialId\": \"5\"}, {\"id\": \"10\", \"unit\": \"pcs\", \"usageId\": \"10\", \"materialName\": \"带线腔体\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"3\", \"productMaterialId\": \"6\"}, {\"id\": \"9\", \"unit\": \"pcs\", \"usageId\": \"9\", \"materialName\": \"环形器控制板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"PCB-CIR-001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"2\", \"productMaterialId\": \"7\"}], \"assignedMaterialCount\": 0, \"materialRequirementCount\": 4}, \"materials\": [{\"id\": \"12\", \"unit\": \"pcs\", \"usageId\": \"12\", \"materialName\": \"粘合剂\", \"planQuantity\": \"60.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615003\", \"needBatchRecord\": true, \"quantityPerUnit\": \"3.0000\", \"materialProductId\": \"5\", \"productMaterialId\": \"4\"}, {\"id\": \"11\", \"unit\": \"pcs\", \"usageId\": \"11\", \"materialName\": \"PCB板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615002\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"4\", \"productMaterialId\": \"5\"}, {\"id\": \"10\", \"unit\": \"pcs\", \"usageId\": \"10\", \"materialName\": \"带线腔体\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"3\", \"productMaterialId\": \"6\"}, {\"id\": \"9\", \"unit\": \"pcs\", \"usageId\": \"9\", \"materialName\": \"环形器控制板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"PCB-CIR-001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"2\", \"productMaterialId\": \"7\"}]}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=27ms','2026-07-02 13:56:26'),(313,'operation','production','生产任务派工',1,'admin',3,'production_batch','{\"productionBatchId\": \"3\"}',NULL,'success','8fd849ba-1014-4540-9226-2a374df2a29a','POST','/tasks/:id/dispatch',201,32,'{\"body\": {\"steps\": [{\"sopFileId\": \"1\", \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"4\"}, {\"sopFileId\": \"2\", \"responsibleUserId\": \"2\", \"processRouteStepsId\": \"5\"}, {\"sopFileId\": \"4\", \"responsibleUserId\": \"4\", \"processRouteStepsId\": \"6\"}, {\"sopFileId\": \"3\", \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"7\"}]}, \"query\": {}, \"params\": {\"id\": \"3\"}}','{\"id\": \"3\", \"steps\": [{\"id\": \"13\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"装配\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"1\", \"startedAt\": null, \"stepOrder\": 1, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"4\", \"responsibleUserName\": \"生产操作员\"}, {\"id\": \"14\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"调试\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"2\", \"startedAt\": null, \"stepOrder\": 2, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"2\", \"processRouteStepsId\": \"5\", \"responsibleUserName\": \"生产主管\"}, {\"id\": \"15\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"检验\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": null, \"startedAt\": null, \"stepOrder\": 3, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"4\", \"processRouteStepsId\": \"6\", \"responsibleUserName\": \"质量检验员\"}, {\"id\": \"16\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"焊接\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"sopFileId\": \"3\", \"startedAt\": null, \"stepOrder\": 4, \"updatedAt\": \"2026-07-02T05:55:06.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"7\", \"responsibleUserName\": \"生产操作员\"}], \"remark\": null, \"status\": \"material_pending\", \"batchNo\": \"PB20260702001\", \"ownerId\": \"2\", \"routeId\": \"1\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"ownerName\": \"生产主管\", \"productId\": \"1\", \"routeName\": \"环形器标准工艺路线\", \"stepCount\": 4, \"updatedAt\": \"2026-07-02T05:56:26.000Z\", \"planEndDate\": \"2026-06-16\", \"productName\": \"宽带微带环形器\", \"workOrderId\": \"2\", \"workOrderNo\": \"gd-002\", \"productModel\": \"HMITB60T180G-B2\", \"planStartDate\": \"2026-06-15\", \"dispatchStatus\": \"assigned\", \"materialStatus\": \"unallocated\", \"plannedQuantity\": \"20.0000\", \"assignedStepCount\": 4, \"materialRequirements\": [{\"id\": \"12\", \"unit\": \"pcs\", \"usageId\": \"12\", \"materialName\": \"粘合剂\", \"planQuantity\": \"60.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615003\", \"needBatchRecord\": true, \"quantityPerUnit\": \"3.0000\", \"materialProductId\": \"5\", \"productMaterialId\": \"4\"}, {\"id\": \"11\", \"unit\": \"pcs\", \"usageId\": \"11\", \"materialName\": \"PCB板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615002\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"4\", \"productMaterialId\": \"5\"}, {\"id\": \"10\", \"unit\": \"pcs\", \"usageId\": \"10\", \"materialName\": \"带线腔体\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"3\", \"productMaterialId\": \"6\"}, {\"id\": \"9\", \"unit\": \"pcs\", \"usageId\": \"9\", \"materialName\": \"环形器控制板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"PCB-CIR-001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"2\", \"productMaterialId\": \"7\"}], \"assignedMaterialCount\": 0, \"materialRequirementCount\": 4}','{\"id\": \"3\", \"steps\": [{\"id\": \"17\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"装配\", \"createdAt\": \"2026-07-02T05:58:56.000Z\", \"sopFileId\": \"1\", \"startedAt\": null, \"stepOrder\": 1, \"updatedAt\": \"2026-07-02T05:58:56.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"4\", \"responsibleUserName\": \"生产操作员\"}, {\"id\": \"18\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"调试\", \"createdAt\": \"2026-07-02T05:58:56.000Z\", \"sopFileId\": \"2\", \"startedAt\": null, \"stepOrder\": 2, \"updatedAt\": \"2026-07-02T05:58:56.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"2\", \"processRouteStepsId\": \"5\", \"responsibleUserName\": \"生产主管\"}, {\"id\": \"19\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"检验\", \"createdAt\": \"2026-07-02T05:58:56.000Z\", \"sopFileId\": null, \"startedAt\": null, \"stepOrder\": 3, \"updatedAt\": \"2026-07-02T05:58:56.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"4\", \"processRouteStepsId\": \"6\", \"responsibleUserName\": \"质量检验员\"}, {\"id\": \"20\", \"remark\": null, \"status\": \"pending\", \"batchId\": \"3\", \"stepName\": \"焊接\", \"createdAt\": \"2026-07-02T05:58:56.000Z\", \"sopFileId\": \"3\", \"startedAt\": null, \"stepOrder\": 4, \"updatedAt\": \"2026-07-02T05:58:56.000Z\", \"completedAt\": null, \"outputQuantity\": null, \"returnQuantity\": null, \"abnormalQuantity\": null, \"responsibleUserId\": \"3\", \"processRouteStepsId\": \"7\", \"responsibleUserName\": \"生产操作员\"}], \"remark\": null, \"status\": \"material_pending\", \"batchNo\": \"PB20260702001\", \"ownerId\": \"2\", \"routeId\": \"1\", \"createdAt\": \"2026-07-02T05:55:06.000Z\", \"ownerName\": \"生产主管\", \"productId\": \"1\", \"routeName\": \"环形器标准工艺路线\", \"stepCount\": 4, \"updatedAt\": \"2026-07-02T05:58:56.000Z\", \"planEndDate\": \"2026-06-16\", \"productName\": \"宽带微带环形器\", \"workOrderId\": \"2\", \"workOrderNo\": \"gd-002\", \"productModel\": \"HMITB60T180G-B2\", \"planStartDate\": \"2026-06-15\", \"dispatchStatus\": \"assigned\", \"materialStatus\": \"unallocated\", \"plannedQuantity\": \"20.0000\", \"assignedStepCount\": 4, \"materialRequirements\": [{\"id\": \"12\", \"unit\": \"pcs\", \"usageId\": \"12\", \"materialName\": \"粘合剂\", \"planQuantity\": \"60.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615003\", \"needBatchRecord\": true, \"quantityPerUnit\": \"3.0000\", \"materialProductId\": \"5\", \"productMaterialId\": \"4\"}, {\"id\": \"11\", \"unit\": \"pcs\", \"usageId\": \"11\", \"materialName\": \"PCB板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615002\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"4\", \"productMaterialId\": \"5\"}, {\"id\": \"10\", \"unit\": \"pcs\", \"usageId\": \"10\", \"materialName\": \"带线腔体\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"GX-20260615001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"3\", \"productMaterialId\": \"6\"}, {\"id\": \"9\", \"unit\": \"pcs\", \"usageId\": \"9\", \"materialName\": \"环形器控制板\", \"planQuantity\": \"20.0000\", \"usedQuantity\": \"0.0000\", \"isKeyMaterial\": true, \"materialModel\": \"PCB-CIR-001\", \"needBatchRecord\": true, \"quantityPerUnit\": \"1.0000\", \"materialProductId\": \"2\", \"productMaterialId\": \"7\"}], \"assignedMaterialCount\": 0, \"materialRequirementCount\": 4}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'duration=32ms','2026-07-02 13:58:56');
/*!40000 ALTER TABLE `operation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned NOT NULL DEFAULT '0',
  `name` varchar(64) NOT NULL,
  `code` varchar(128) NOT NULL,
  `type` varchar(32) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `api_method` varchar(16) DEFAULT NULL,
  `api_path` varchar(255) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permissions_code` (`code`),
  KEY `idx_permissions_parent_id` (`parent_id`),
  KEY `idx_permissions_type` (`type`),
  KEY `idx_permissions_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=260 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,0,'首页','dashboard:page','page','/',NULL,NULL,10,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(10,0,'系统管理','system:page','page','/system',NULL,NULL,100,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(11,10,'用户管理','system:users:view','page','/system/users','GET','/system/users',110,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(12,11,'用户详情','system:users:detail','api',NULL,'GET','/system/users/{id}',111,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(13,11,'新增用户','system:users:create','api',NULL,'POST','/system/users',112,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(14,11,'编辑用户','system:users:update','api',NULL,'PUT','/system/users/{id}',113,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(15,11,'启用用户','system:users:enable','api',NULL,'PUT','/system/users/{id}/enable',114,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(16,11,'停用用户','system:users:disable','api',NULL,'PUT','/system/users/{id}/disable',115,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(17,11,'重置密码','system:users:reset-password','api',NULL,'PUT','/system/users/{id}/reset-password',116,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(18,11,'分配角色','system:users:assign-role','api',NULL,'PUT','/system/users/{id}/roles',117,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(20,10,'角色管理','system:roles:view','page','/system/roles','GET','/system/roles',120,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(21,20,'角色详情','system:roles:detail','api',NULL,'GET','/system/roles/{id}',121,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(22,20,'新增角色','system:roles:create','api',NULL,'POST','/system/roles',122,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(23,20,'编辑角色','system:roles:update','api',NULL,'PUT','/system/roles/{id}',123,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(24,20,'删除角色','system:roles:delete','api',NULL,'DELETE','/system/roles/{id}',124,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(25,20,'启用角色','system:roles:enable','api',NULL,'PUT','/system/roles/{id}/enable',125,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(26,20,'停用角色','system:roles:disable','api',NULL,'PUT','/system/roles/{id}/disable',126,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(27,20,'分配权限','system:roles:assign-permissions','api',NULL,'PUT','/system/roles/{id}/permissions',127,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(30,10,'权限管理','system:permissions:view','page','/system/permissions','GET','/system/permissions',130,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(31,30,'权限详情','system:permissions:detail','api',NULL,'GET','/system/permissions/{id}',131,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(32,30,'新增权限','system:permissions:create','api',NULL,'POST','/system/permissions',132,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(33,30,'编辑权限','system:permissions:update','api',NULL,'PUT','/system/permissions/{id}',133,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(34,30,'删除权限','system:permissions:delete','api',NULL,'DELETE','/system/permissions/{id}',134,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(35,30,'启用权限','system:permissions:enable','api',NULL,'PUT','/system/permissions/{id}/enable',135,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(36,30,'停用权限','system:permissions:disable','api',NULL,'PUT','/system/permissions/{id}/disable',136,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(40,10,'日志管理','system:logs:view','page','/system/logs','GET','/system/logs',140,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(41,40,'日志详情','system:logs:detail','api',NULL,'GET','/system/logs/{id}',141,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(45,40,'导出日志','system:logs:export','api',NULL,'GET','/system/logs/export',145,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(50,0,'产品管理','product:page','page','/product',NULL,NULL,200,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(51,50,'产品资料','product:products:view','page','/product/products','GET','/products',210,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(52,51,'产品详情','product:products:detail','api',NULL,'GET','/products/{id}',211,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(53,51,'新增产品','product:products:create','api',NULL,'POST','/products',212,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(54,51,'编辑产品','product:products:update','api',NULL,'PUT','/products/{id}',213,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(55,51,'启用产品','product:products:enable','api',NULL,'PUT','/products/{id}/enable',214,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(56,51,'停用产品','product:products:disable','api',NULL,'PUT','/products/{id}/disable',215,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(57,51,'查看产品库存','product:products:view-inventory','api',NULL,'GET','/products/{id}/inventory',216,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(58,51,'查看产品工艺路线','product:products:view-route','api',NULL,'GET','/products/{id}/routes',217,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(59,51,'配置产品用料清单','product:products:config-bom','api',NULL,'PUT','/products/{id}/bom',218,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(60,51,'绑定默认工艺路线','product:products:bind-route','api',NULL,'PUT','/products/{id}/route',219,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(70,50,'产品分类','product:categories:view','page','/product/categories','GET','/product-categories',230,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(71,70,'产品分类详情','product:categories:detail','api',NULL,'GET','/product-categories/{id}',231,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(72,70,'新增产品分类','product:categories:create','api',NULL,'POST','/product-categories',232,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(73,70,'编辑产品分类','product:categories:update','api',NULL,'PUT','/product-categories/{id}',233,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(74,70,'启用产品分类','product:categories:enable','api',NULL,'PUT','/product-categories/{id}/enable',234,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(75,70,'停用产品分类','product:categories:disable','api',NULL,'PUT','/product-categories/{id}/disable',235,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(76,70,'配置规格参数','product:categories:config-spec','api',NULL,'PUT','/product-categories/{id}/specs',236,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(80,50,'生产工序','product:processes:view','page','/product/processes','GET','/processes',250,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(81,80,'生产工序详情','product:processes:detail','api',NULL,'GET','/processes/{id}',251,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(82,80,'新增生产工序','product:processes:create','api',NULL,'POST','/processes',252,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(83,80,'编辑生产工序','product:processes:update','api',NULL,'PUT','/processes/{id}',253,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(84,80,'启用生产工序','product:processes:enable','api',NULL,'PUT','/processes/{id}/enable',254,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(85,80,'停用生产工序','product:processes:disable','api',NULL,'PUT','/processes/{id}/disable',255,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(86,80,'上传工序SOP','product:processes:upload-sop','api',NULL,'POST','/processes/{id}/sop',256,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(90,50,'工艺路线','product:routes:view','page','/product/routes','GET','/routes',270,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(91,90,'工艺路线详情','product:routes:detail','api',NULL,'GET','/routes/{id}',271,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(92,90,'新增工艺路线','product:routes:create','api',NULL,'POST','/routes',272,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(93,90,'编辑工艺路线','product:routes:update','api',NULL,'PUT','/routes/{id}',273,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(94,90,'删除工艺路线','product:routes:delete','api',NULL,'DELETE','/routes/{id}',274,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(95,90,'启用工艺路线','product:routes:enable','api',NULL,'PUT','/routes/{id}/enable',275,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(96,90,'停用工艺路线','product:routes:disable','api',NULL,'PUT','/routes/{id}/disable',276,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(97,90,'配置工艺路线工序','product:routes:config-processes','api',NULL,'PUT','/routes/{id}/processes',277,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(100,0,'仓储管理','warehouse:page','page','/warehouse',NULL,NULL,300,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(101,100,'库存管理','warehouse:inventory:view','page','/warehouse/inventory','GET','/warehouse/inventory',310,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(102,101,'查看可用库存','warehouse:inventory:view-available','api',NULL,'GET','/warehouse/inventory/available',311,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(103,101,'查看预留库存','warehouse:inventory:view-reserved','api',NULL,'GET','/warehouse/inventory/reserved',312,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(104,101,'库存盘点','warehouse:inventory:stocktake','api',NULL,'POST','/warehouse/inventory/stocktake',313,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(105,101,'库存调整','warehouse:inventory:adjust','api',NULL,'PUT','/warehouse/inventory/adjust',314,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(110,100,'出入库管理','warehouse:transactions:view','page','/warehouse/transactions','GET','/warehouse/transactions',330,0,'2026-06-11 16:23:33','2026-06-23 14:11:29','2026-06-23 14:05:39'),(111,110,'出入库详情','warehouse:transactions:detail','api',NULL,'GET','/warehouse/transactions/{id}',331,0,'2026-06-11 16:23:33','2026-06-23 14:11:29','2026-06-23 14:05:39'),(112,110,'入库','warehouse:transactions:inbound','api',NULL,'POST','/warehouse/transactions/inbound',332,0,'2026-06-11 16:23:33','2026-06-23 14:11:29','2026-06-23 14:05:39'),(113,110,'出库','warehouse:transactions:outbound','api',NULL,'POST','/warehouse/transactions/outbound',333,0,'2026-06-11 16:23:33','2026-06-23 14:11:29','2026-06-23 14:05:39'),(114,110,'发运','warehouse:transactions:shipment','api',NULL,'POST','/warehouse/transactions/shipment',334,0,'2026-06-11 16:23:33','2026-06-23 14:11:29','2026-06-23 14:05:39'),(115,110,'退料','warehouse:transactions:return','api',NULL,'POST','/warehouse/transactions/return',335,0,'2026-06-11 16:23:33','2026-06-23 14:11:29','2026-06-23 14:05:39'),(130,0,'生产管理','production:page','page','/production',NULL,NULL,400,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(131,130,'工单管理','production:orders:view','page','/production/orders','GET','/orders',410,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(132,131,'工单详情','production:orders:detail','api',NULL,'GET','/orders/{id}',411,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(133,131,'新增工单','production:orders:create','api',NULL,'POST','/orders',412,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(134,131,'编辑工单','production:orders:update','api',NULL,'PUT','/orders/{id}',413,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(135,131,'保存草稿','production:orders:draft','api',NULL,'PUT','/orders/{id}/draft',414,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(136,131,'下达工单','production:orders:release','api',NULL,'PUT','/orders/{id}/release',415,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(137,131,'关闭工单','production:orders:close','api',NULL,'PUT','/orders/{id}/close',416,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(138,131,'取消工单','production:orders:cancel','api',NULL,'PUT','/orders/{id}/cancel',417,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(139,131,'查看工单任务','production:orders:tasks:view','api',NULL,'GET','/orders/{id}/tasks',418,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(140,131,'新增工单任务','production:orders:tasks:create','api',NULL,'POST','/orders/{id}/tasks',419,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(141,131,'编辑工单任务','production:orders:tasks:update','api',NULL,'PUT','/orders/{id}/tasks/{taskId}',420,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(142,131,'生成工单物料需求','production:orders:generate-material-demand','api',NULL,'POST','/orders/{id}/material-demand',421,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(143,131,'分配工单物料','production:orders:allocate-material','api',NULL,'POST','/orders/{id}/material-allocation',422,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(150,130,'任务管理','production:tasks:view','page','/production/tasks','GET','/tasks',440,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(151,150,'任务详情','production:tasks:detail','api',NULL,'GET','/tasks/{id}',441,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(152,150,'新增任务','production:tasks:create','api',NULL,'POST','/tasks',442,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(153,150,'编辑任务','production:tasks:update','api',NULL,'PUT','/tasks/{id}',443,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(154,150,'生成任务物料需求','production:tasks:generate-material-demand','api',NULL,'POST','/tasks/{id}/material-demand',444,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(155,150,'分配任务物料','production:tasks:allocate-material','api',NULL,'POST','/tasks/{id}/material-allocation',445,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(156,150,'任务派工','production:tasks:dispatch','api',NULL,'POST','/tasks/{id}/dispatch',446,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(157,150,'开始生产','production:tasks:start','api',NULL,'PUT','/tasks/{id}/start',447,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(158,150,'完成生产','production:tasks:finish','api',NULL,'PUT','/tasks/{id}/finish',448,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(159,150,'创建返工','production:tasks:create-rework','api',NULL,'POST','/tasks/{id}/rework',449,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(160,150,'查看追溯','production:tasks:view-trace','api',NULL,'GET','/tasks/{id}/trace',450,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(170,130,'物料分配','production:material-allocation:view','page','/production/material-allocation','GET','/material-allocation',470,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(171,170,'生成物料需求','production:material-allocation:generate-demand','api',NULL,'POST','/material-allocation/generate-demand',471,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(172,170,'分配物料','production:material-allocation:allocate','api',NULL,'POST','/material-allocation/allocate',472,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(173,170,'确认齐套','production:material-allocation:confirm-kit','api',NULL,'PUT','/material-allocation/{id}/confirm-kit',473,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(174,170,'确认出库','production:material-allocation:confirm-outbound','api',NULL,'PUT','/material-allocation/{id}/confirm-outbound',474,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(175,170,'退料','production:material-allocation:return-material','api',NULL,'POST','/material-allocation/{id}/return',475,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(180,0,'质量管理','quality:page','page','/quality',NULL,NULL,500,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(181,180,'检验记录','quality:inspections:view','page','/quality/inspections','GET','/quality/inspections',510,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(182,181,'检验详情','quality:inspections:detail','api',NULL,'GET','/quality/inspections/{id}',511,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(183,181,'新增检验记录','quality:inspections:create','api',NULL,'POST','/quality/inspections',512,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(184,181,'编辑检验记录','quality:inspections:update','api',NULL,'PUT','/quality/inspections/{id}',513,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(185,181,'上传检测文件','quality:inspections:upload-file','api',NULL,'POST','/quality/inspections/{id}/files',514,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(186,181,'创建检验返工','quality:inspections:create-rework','api',NULL,'POST','/quality/inspections/{id}/rework',515,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(187,181,'确认合格入库','quality:inspections:confirm-inbound','api',NULL,'PUT','/quality/inspections/{id}/confirm-inbound',516,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(190,180,'返工记录','quality:reworks:view','page','/quality/reworks','GET','/quality/reworks',530,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(191,190,'返工详情','quality:reworks:detail','api',NULL,'GET','/quality/reworks/{id}',531,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(192,190,'新增返工记录','quality:reworks:create','api',NULL,'POST','/quality/reworks',532,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(193,190,'编辑返工记录','quality:reworks:update','api',NULL,'PUT','/quality/reworks/{id}',533,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(194,190,'分配返工负责人','quality:reworks:assign-owner','api',NULL,'PUT','/quality/reworks/{id}/owner',534,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(195,190,'填写返工结果','quality:reworks:submit-result','api',NULL,'PUT','/quality/reworks/{id}/result',535,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(196,190,'返工后重新检验','quality:reworks:reinspect','api',NULL,'POST','/quality/reworks/{id}/reinspect',536,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(210,0,'员工端','worker:page','page','/worker',NULL,NULL,600,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(211,210,'我的任务','worker:tasks:view','page','/worker/tasks','GET','/worker/tasks',610,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(212,211,'我的任务详情','worker:tasks:detail','api',NULL,'GET','/worker/tasks/{id}',611,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(213,211,'查看SOP','worker:tasks:view-sop','api',NULL,'GET','/worker/tasks/{id}/sop',612,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(214,211,'开始我的任务','worker:tasks:start','api',NULL,'PUT','/worker/tasks/{id}/start',613,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(215,211,'完成我的任务','worker:tasks:complete','api',NULL,'PUT','/worker/tasks/{id}/complete',614,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(216,211,'查看我的任务历史','worker:tasks:history','api',NULL,'GET','/worker/tasks/{id}/history',615,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(220,0,'检测端','inspector:page','page','/inspector',NULL,NULL,700,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(221,220,'检测任务','inspector:tasks:view','page','/inspector/tasks','GET','/inspector/tasks',710,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(222,221,'检测任务详情','inspector:tasks:detail','api',NULL,'GET','/inspector/tasks/{id}',711,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(223,221,'查看规格书','inspector:tasks:view-spec','api',NULL,'GET','/inspector/tasks/{id}/spec',712,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(224,221,'填写检测结果','inspector:tasks:submit-result','api',NULL,'PUT','/inspector/tasks/{id}/result',713,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(225,221,'上传检测文件','inspector:tasks:upload-file','api',NULL,'POST','/inspector/tasks/{id}/files',714,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(226,221,'创建检测返工','inspector:tasks:create-rework','api',NULL,'POST','/inspector/tasks/{id}/rework',715,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(230,130,'派工管理','production:dispatch:view','page','/production/dispatch','GET','/dispatch',480,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(231,230,'派工详情','production:dispatch:detail','api',NULL,'GET','/dispatch/{batchId}',481,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(232,230,'工序派工','production:dispatch:assign','api',NULL,'POST','/dispatch/{batchId}/steps/{stepId}/assign',482,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(233,230,'改派','production:dispatch:reassign','api',NULL,'PUT','/dispatch/{batchId}/steps/{stepId}/reassign',483,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(234,230,'一键按默认派工','production:dispatch:batch-default','api',NULL,'POST','/dispatch/{batchId}/batch-default',484,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(235,230,'清除全部派工','production:dispatch:clear','api',NULL,'DELETE','/dispatch/{batchId}/clear',485,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(240,130,'生产报工','production:reports:view','page','/production/execution-records','GET','/execution-records',490,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(241,240,'报工详情','production:reports:detail','api',NULL,'GET','/execution-records/{batchId}',491,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(242,240,'开工','production:reports:start','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/start',492,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(243,240,'完工报工','production:reports:finish','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/finish',493,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(244,240,'开工并报工','production:reports:start-and-finish','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/start-and-finish',494,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(245,240,'批量报工','production:reports:batch-finish','api',NULL,'POST','/execution-records/batch-finish',495,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(246,100,'成品出入库管理','warehouse:finished-transactions:view','page','/warehouse/finished-transactions','GET','/warehouse/finished-transactions',330,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(247,246,'成品出入库详情','warehouse:finished-transactions:detail','api',NULL,'GET','/warehouse/finished-transactions/{id}',331,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(248,246,'成品入库','warehouse:finished-transactions:inbound','api',NULL,'POST','/warehouse/finished-transactions/inbound',332,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(249,246,'成品出库','warehouse:finished-transactions:outbound','api',NULL,'POST','/warehouse/finished-transactions/outbound',333,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(250,246,'成品发运','warehouse:finished-transactions:shipment','api',NULL,'POST','/warehouse/finished-transactions/shipment',334,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(251,100,'物料出入库管理','warehouse:material-transactions:view','page','/warehouse/material-transactions','GET','/warehouse/material-transactions',340,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(252,251,'物料出入库详情','warehouse:material-transactions:detail','api',NULL,'GET','/warehouse/material-transactions/{id}',341,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(253,251,'物料入库','warehouse:material-transactions:inbound','api',NULL,'POST','/warehouse/material-transactions/inbound',342,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(254,251,'物料出库','warehouse:material-transactions:outbound','api',NULL,'POST','/warehouse/material-transactions/outbound',343,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(255,251,'物料退料','warehouse:material-transactions:return','api',NULL,'POST','/warehouse/material-transactions/return',344,1,'2026-06-23 14:11:29','2026-06-23 14:11:29',NULL),(256,100,'库存盘点台账','warehouse:stocktakes:view','page','/warehouse/stocktakes','GET','/warehouse/stocktakes',320,1,'2026-07-01 15:02:30','2026-07-01 15:02:30',NULL),(257,256,'库存盘点目标','warehouse:stocktakes:targets','api',NULL,'GET','/warehouse/stocktakes/targets',321,1,'2026-07-01 15:02:30','2026-07-01 15:02:30',NULL),(258,256,'新增库存盘点','warehouse:stocktakes:create','api',NULL,'POST','/warehouse/stocktakes',322,1,'2026-07-01 15:02:30','2026-07-01 15:02:30',NULL),(259,256,'确认盘点调账','warehouse:stocktakes:adjust','api',NULL,'POST','/warehouse/stocktakes/{id}/adjust',323,1,'2026-07-01 15:02:30','2026-07-01 15:02:30',NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `process_route_steps`
--

DROP TABLE IF EXISTS `process_route_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_route_steps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `route_id` bigint unsigned NOT NULL,
  `process_step_id` bigint unsigned NOT NULL COMMENT '标准工序ID',
  `step_order` int NOT NULL,
  `default_owner_id` bigint unsigned DEFAULT NULL,
  `sop_file_id` bigint unsigned DEFAULT NULL,
  `need_inspection` tinyint NOT NULL DEFAULT '0' COMMENT '是否需要检验：1是，0否',
  `need_record` tinyint NOT NULL DEFAULT '1' COMMENT '是否必须报工：1是，0否',
  `status` tinyint NOT NULL DEFAULT '1',
  `remark` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_by` bigint unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_process_route_steps_order_deleted` (`route_id`,`step_order`,`is_deleted`),
  KEY `idx_process_route_steps_route_id` (`route_id`),
  KEY `idx_process_route_steps_default_owner_id` (`default_owner_id`),
  KEY `idx_process_route_steps_sop_file_id` (`sop_file_id`),
  KEY `idx_process_route_steps_status` (`status`),
  KEY `idx_process_route_steps_is_deleted` (`is_deleted`),
  KEY `idx_process_route_steps_created_by` (`created_by`),
  KEY `idx_process_route_steps_updated_by` (`updated_by`),
  KEY `idx_process_route_steps_deleted_by` (`deleted_by`),
  KEY `idx_process_route_steps_process_step_id` (`process_step_id`),
  KEY `idx_process_route_steps_need_inspection` (`need_inspection`),
  KEY `idx_process_route_steps_need_record` (`need_record`),
  CONSTRAINT `fk_process_route_steps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_default_owner_id` FOREIGN KEY (`default_owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_process_step_id` FOREIGN KEY (`process_step_id`) REFERENCES `process_steps` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_process_route_steps_route_id` FOREIGN KEY (`route_id`) REFERENCES `process_routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_process_route_steps_sop_file_id` FOREIGN KEY (`sop_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `process_route_steps`
--

LOCK TABLES `process_route_steps` WRITE;
/*!40000 ALTER TABLE `process_route_steps` DISABLE KEYS */;
INSERT INTO `process_route_steps` VALUES (1,1,1,1,3,1,0,1,1,'工艺路线工序明细样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-16 15:40:08',1,NULL,'2026-06-11 16:30:27'),(2,1,2,2,2,2,0,1,1,'工艺路线工序明细样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-16 15:40:08',1,NULL,'2026-06-11 16:30:27'),(3,1,3,3,4,NULL,0,1,1,NULL,NULL,'2026-06-11 15:56:12',NULL,'2026-06-16 15:40:08',1,NULL,'2026-06-11 16:30:27'),(4,1,1,1,3,1,0,1,1,'工艺路线工序明细样例',NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL),(5,1,2,2,2,2,0,1,1,'工艺路线工序明细样例',NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL),(6,1,3,3,4,NULL,0,1,1,NULL,NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL),(7,1,4,4,3,3,0,1,1,NULL,NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL);
/*!40000 ALTER TABLE `process_route_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `process_routes`
--

DROP TABLE IF EXISTS `process_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_routes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `route_code` varchar(64) NOT NULL,
  `route_name` varchar(128) NOT NULL,
  `product_category_id` bigint unsigned DEFAULT NULL,
  `version` varchar(64) DEFAULT NULL,
  `applicable_product_type` varchar(100) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `remark` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_by` bigint unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_process_routes_code_deleted` (`route_code`,`is_deleted`),
  KEY `idx_process_routes_status` (`status`),
  KEY `idx_process_routes_is_deleted` (`is_deleted`),
  KEY `idx_process_routes_created_by` (`created_by`),
  KEY `idx_process_routes_updated_by` (`updated_by`),
  KEY `idx_process_routes_deleted_by` (`deleted_by`),
  KEY `idx_process_routes_product_category_id` (`product_category_id`),
  CONSTRAINT `fk_process_routes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_routes_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_routes_product_category_id` FOREIGN KEY (`product_category_id`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_routes_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `process_routes`
--

LOCK TABLES `process_routes` WRITE;
/*!40000 ALTER TABLE `process_routes` DISABLE KEYS */;
INSERT INTO `process_routes` VALUES (1,'ROUTE-CIR-STD','环形器标准工艺路线',1,'V1.0','环形器',1,'默认工艺路线样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-16 15:40:09',0,NULL,NULL);
/*!40000 ALTER TABLE `process_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `process_steps`
--

DROP TABLE IF EXISTS `process_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_steps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `step_code` varchar(100) DEFAULT NULL,
  `step_name` varchar(100) NOT NULL,
  `sop_file_id` bigint unsigned DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1启用，0停用',
  `remark` text,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_by` bigint unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_process_steps_code_deleted` (`step_code`,`is_deleted`),
  KEY `idx_process_steps_sop_file_id` (`sop_file_id`),
  KEY `idx_process_steps_is_deleted` (`is_deleted`),
  KEY `idx_process_steps_created_by` (`created_by`),
  KEY `idx_process_steps_updated_by` (`updated_by`),
  KEY `idx_process_steps_deleted_by` (`deleted_by`),
  KEY `idx_process_steps_status` (`status`),
  CONSTRAINT `fk_process_steps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_steps_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_steps_sop_file_id` FOREIGN KEY (`sop_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_steps_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `process_steps`
--

LOCK TABLES `process_steps` WRITE;
/*!40000 ALTER TABLE `process_steps` DISABLE KEYS */;
INSERT INTO `process_steps` VALUES (1,'GX-001','装配',1,1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(2,'GX-002','调试',2,1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(3,'GX-003','检验',NULL,1,'由历史路线步骤迁移生成',NULL,'2026-06-11 16:23:33',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(4,'GX-004','焊接',3,1,NULL,NULL,'2026-06-11 16:27:06',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(5,'text','test',4,1,'test',NULL,'2026-06-11 17:02:39',NULL,'2026-06-22 14:27:15',0,NULL,NULL);
/*!40000 ALTER TABLE `process_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_attribute` varchar(64) NOT NULL,
  `product_type` varchar(64) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `remark` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_by` bigint unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_categories_attribute_type_deleted` (`product_attribute`,`product_type`,`is_deleted`),
  KEY `idx_product_categories_attribute` (`product_attribute`),
  KEY `idx_product_categories_type` (`product_type`),
  KEY `idx_product_categories_status` (`status`),
  KEY `idx_product_categories_is_deleted` (`is_deleted`),
  KEY `idx_product_categories_created_by` (`created_by`),
  KEY `idx_product_categories_updated_by` (`updated_by`),
  KEY `idx_product_categories_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_product_categories_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_categories_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_categories_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (1,'成品','环形器',1,'微波器件成品分类',NULL,'2026-06-11 14:24:07',NULL,'2026-06-11 14:24:07',0,NULL,NULL),(2,'成品','PCB',1,'PCB 成品分类',NULL,'2026-06-11 14:24:07',NULL,'2026-06-11 14:49:25',0,NULL,NULL),(3,'半成品','腔体',1,NULL,NULL,'2026-06-11 14:26:27',NULL,'2026-06-11 14:26:27',0,NULL,NULL);
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_flow_records`
--

DROP TABLE IF EXISTS `product_flow_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_flow_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '流转记录ID',
  `flow_no` varchar(100) DEFAULT NULL COMMENT '入库单号、出库单号或调整单号',
  `inventory_id` bigint unsigned NOT NULL COMMENT '产品库存ID',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '生产批次ID冗余',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID冗余',
  `object_type` varchar(50) NOT NULL COMMENT '对象类型：semi_finished/finished',
  `flow_type` varchar(50) NOT NULL COMMENT '流转类型：inbound/outbound/adjustment',
  `flow_reason` varchar(100) DEFAULT NULL COMMENT '流转原因',
  `quantity` int NOT NULL COMMENT '本次流转数量，始终为正数',
  `partner_name` varchar(255) DEFAULT NULL COMMENT '客户或供应商名称',
  `partner_type` varchar(50) DEFAULT NULL COMMENT '合作类型：customer/supplier',
  `external_doc_no` varchar(100) DEFAULT NULL COMMENT '客户单号、发货单或退货单',
  `related_stocktake_id` bigint unsigned DEFAULT NULL COMMENT '盘点调整关联的盘点ID',
  `related_flow_id` bigint unsigned DEFAULT NULL COMMENT '退回时关联的原流转ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '经办人ID',
  `flow_date` date NOT NULL COMMENT '流转日期',
  `file_url` varchar(500) DEFAULT NULL COMMENT '入库单、发货单或退货单附件',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_flow_records_inventory_id` (`inventory_id`),
  KEY `idx_product_flow_records_batch_id` (`batch_id`),
  KEY `idx_product_flow_records_product_id` (`product_id`),
  KEY `idx_product_flow_records_flow_type` (`flow_type`),
  KEY `idx_product_flow_records_flow_date` (`flow_date`),
  KEY `idx_product_flow_records_related_stocktake_id` (`related_stocktake_id`),
  KEY `idx_product_flow_records_related_flow_id` (`related_flow_id`),
  KEY `idx_product_flow_records_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_product_flow_records_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_inventory_id` FOREIGN KEY (`inventory_id`) REFERENCES `product_inventory_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_related_flow_id` FOREIGN KEY (`related_flow_id`) REFERENCES `product_flow_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_related_stocktake_id` FOREIGN KEY (`related_stocktake_id`) REFERENCES `inventory_stocktakes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_product_flow_records_flow_type` CHECK ((`flow_type` in (_utf8mb4'inbound',_utf8mb4'outbound',_utf8mb4'adjustment'))),
  CONSTRAINT `chk_product_flow_records_object_type` CHECK ((`object_type` in (_utf8mb4'semi_finished',_utf8mb4'finished'))),
  CONSTRAINT `chk_product_flow_records_partner_type` CHECK (((`partner_type` is null) or (`partner_type` in (_utf8mb4'customer',_utf8mb4'supplier')))),
  CONSTRAINT `chk_product_flow_records_quantity` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成品和半成品入库、出库、退回与调整流水表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_flow_records`
--

LOCK TABLES `product_flow_records` WRITE;
/*!40000 ALTER TABLE `product_flow_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_flow_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_inventory_batches`
--

DROP TABLE IF EXISTS `product_inventory_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_inventory_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '产品库存ID',
  `inventory_batch_no` varchar(100) DEFAULT NULL COMMENT '产品库存批号',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '来源生产批次ID',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `source_type` varchar(50) NOT NULL DEFAULT 'production' COMMENT '来源类型：production/purchase/outsourcing/stocktake/other',
  `object_type` varchar(50) NOT NULL COMMENT '对象类型：semi_finished/finished',
  `quantity` int NOT NULL DEFAULT '0' COMMENT '当前库存数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `received_date` date NOT NULL COMMENT '首次入库日期',
  `location` varchar(100) DEFAULT NULL COMMENT '存放位置',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_inventory_batches_batch_product_type` (`batch_id`,`product_id`,`object_type`),
  KEY `idx_product_inventory_batches_inventory_batch_no` (`inventory_batch_no`),
  KEY `idx_product_inventory_batches_product_id` (`product_id`),
  KEY `idx_product_inventory_batches_object_type` (`object_type`),
  KEY `idx_product_inventory_batches_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_product_inventory_batches_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_inventory_batches_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_product_inventory_batches_object_type` CHECK ((`object_type` in (_utf8mb4'semi_finished',_utf8mb4'finished'))),
  CONSTRAINT `chk_product_inventory_batches_quantity` CHECK ((`quantity` >= 0)),
  CONSTRAINT `chk_product_inventory_batches_source_type` CHECK ((`source_type` in (_utf8mb4'production',_utf8mb4'purchase',_utf8mb4'outsourcing',_utf8mb4'stocktake',_utf8mb4'other')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成品和半成品当前库存批次表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_inventory_batches`
--

LOCK TABLES `product_inventory_batches` WRITE;
/*!40000 ALTER TABLE `product_inventory_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_inventory_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_materials`
--

DROP TABLE IF EXISTS `product_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `material_product_id` bigint unsigned NOT NULL COMMENT '物料产品ID',
  `quantity_per_unit` decimal(12,4) NOT NULL DEFAULT '1.0000' COMMENT '单件用量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `is_key_material` tinyint NOT NULL DEFAULT '1' COMMENT '是否关键物料',
  `need_batch_record` tinyint NOT NULL DEFAULT '1' COMMENT '是否记录批次',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_materials_product_material_deleted` (`product_id`,`material_product_id`,`is_deleted`),
  KEY `idx_product_materials_product_id` (`product_id`),
  KEY `idx_product_materials_material_product_id` (`material_product_id`),
  KEY `idx_product_materials_is_deleted` (`is_deleted`),
  KEY `idx_product_materials_created_by` (`created_by`),
  KEY `idx_product_materials_updated_by` (`updated_by`),
  KEY `idx_product_materials_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_product_materials_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_materials_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_materials_material_product_id` FOREIGN KEY (`material_product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_materials_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_materials_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_product_materials_quantity_per_unit` CHECK ((`quantity_per_unit` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='产品物料清单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_materials`
--

LOCK TABLES `product_materials` WRITE;
/*!40000 ALTER TABLE `product_materials` DISABLE KEYS */;
INSERT INTO `product_materials` VALUES (1,2,3,1.0000,'pcs',1,1,NULL,NULL,'2026-06-15 16:14:06',NULL,'2026-06-15 16:14:06',0,NULL,NULL),(2,2,4,1.0000,'pcs',1,1,NULL,NULL,'2026-06-15 16:14:06',NULL,'2026-06-15 16:14:06',0,NULL,NULL),(3,2,5,1.0000,'pcs',1,1,NULL,NULL,'2026-06-15 16:14:06',NULL,'2026-06-15 16:14:06',0,NULL,NULL),(4,1,5,3.0000,'pcs',1,1,NULL,NULL,'2026-06-22 14:52:56',NULL,'2026-06-22 16:55:56',0,NULL,NULL),(5,1,4,1.0000,'pcs',1,1,NULL,NULL,'2026-06-22 14:53:08',NULL,'2026-06-22 16:55:56',0,NULL,NULL),(6,1,3,1.0000,'pcs',1,1,NULL,NULL,'2026-06-22 14:53:08',NULL,'2026-06-22 16:55:56',0,NULL,NULL),(7,1,2,1.0000,'pcs',1,1,NULL,NULL,'2026-06-22 14:53:08',NULL,'2026-06-22 16:55:56',0,NULL,NULL);
/*!40000 ALTER TABLE `product_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_batches`
--

DROP TABLE IF EXISTS `production_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `work_order_id` bigint unsigned NOT NULL COMMENT '工单ID',
  `batch_no` varchar(100) NOT NULL COMMENT '生产批次号',
  `route_id` bigint unsigned DEFAULT NULL COMMENT '执行工艺路线ID',
  `planned_quantity` decimal(12,4) NOT NULL COMMENT '批次计划数量',
  `status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT 'pending/assigned/doing/completed/cancelled',
  `owner_id` bigint unsigned DEFAULT NULL COMMENT '批次负责人',
  `plan_start_date` date DEFAULT NULL COMMENT '计划开始日期',
  `plan_end_date` date DEFAULT NULL COMMENT '计划完成日期',
  `actual_start_at` datetime DEFAULT NULL COMMENT '实际开始时间',
  `actual_end_at` datetime DEFAULT NULL COMMENT '实际完成时间',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_batches_no_deleted` (`batch_no`,`is_deleted`),
  KEY `idx_production_batches_work_order_id` (`work_order_id`),
  KEY `idx_production_batches_route_id` (`route_id`),
  KEY `idx_production_batches_status` (`status`),
  KEY `idx_production_batches_owner_id` (`owner_id`),
  KEY `idx_production_batches_is_deleted` (`is_deleted`),
  KEY `idx_production_batches_created_by` (`created_by`),
  KEY `idx_production_batches_updated_by` (`updated_by`),
  KEY `idx_production_batches_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_production_batches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_route_id` FOREIGN KEY (`route_id`) REFERENCES `process_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `chk_production_batches_quantity` CHECK ((`planned_quantity` > 0)),
  CONSTRAINT `chk_production_batches_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'material_pending',_utf8mb4'material_assigned',_utf8mb4'doing',_utf8mb4'completed',_utf8mb4'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_batches`
--

LOCK TABLES `production_batches` WRITE;
/*!40000 ALTER TABLE `production_batches` DISABLE KEYS */;
INSERT INTO `production_batches` VALUES (1,1,'PB20260615001',1,100.0000,'doing',4,'2026-06-13','2026-06-16','2026-06-24 13:50:58',NULL,NULL,NULL,'2026-06-15 11:41:08',NULL,'2026-06-26 11:58:32',0,NULL,NULL),(2,2,'SCPC-20260617-001',1,80.0000,'doing',2,'2026-06-16','2026-06-17','2026-06-24 13:37:14',NULL,NULL,NULL,'2026-06-17 11:16:37',NULL,'2026-06-24 13:50:54',0,NULL,NULL),(3,2,'PB20260702001',1,20.0000,'material_pending',2,'2026-06-16','2026-06-17',NULL,NULL,NULL,NULL,'2026-07-02 13:55:06',NULL,'2026-07-02 13:58:56',0,NULL,NULL);
/*!40000 ALTER TABLE `production_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_code` varchar(100) DEFAULT NULL COMMENT '产品编码',
  `product_model` varchar(128) NOT NULL,
  `product_name` varchar(128) NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `default_route_id` bigint unsigned DEFAULT NULL,
  `spec_file_id` bigint unsigned DEFAULT NULL COMMENT '产品规格书ID',
  `unit` varchar(32) NOT NULL DEFAULT 'pcs',
  `acquire_method` varchar(32) NOT NULL,
  `spec_values` json DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `remark` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_by` bigint unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_model_deleted` (`product_model`,`is_deleted`),
  UNIQUE KEY `uk_products_code_deleted` (`product_code`,`is_deleted`),
  KEY `idx_products_name` (`product_name`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_acquire_method` (`acquire_method`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_is_deleted` (`is_deleted`),
  KEY `idx_products_created_by` (`created_by`),
  KEY `idx_products_updated_by` (`updated_by`),
  KEY `idx_products_deleted_by` (`deleted_by`),
  KEY `idx_products_default_route_id` (`default_route_id`),
  KEY `idx_products_spec_file_id` (`spec_file_id`),
  CONSTRAINT `fk_products_category_id` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_default_route_id` FOREIGN KEY (`default_route_id`) REFERENCES `process_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_spec_file_id` FOREIGN KEY (`spec_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_products_acquire_method` CHECK ((`acquire_method` in (_utf8mb4'self_made',_utf8mb4'outsourced',_utf8mb4'purchased')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,NULL,'HMITB60T180G-B2','宽带微带环形器',1,1,NULL,'pcs','self_made','[{\"key\": \"频率范围\", \"unit\": \"GHz\", \"value\": \"6-18\"}, {\"key\": \"插入损耗\", \"unit\": \"dB\", \"value\": \"0.8\"}, {\"key\": \"隔离度\", \"unit\": \"dB\", \"value\": \"18\"}]',1,'产品资料样例',NULL,'2026-06-11 14:49:25',NULL,'2026-06-12 09:44:47',0,NULL,NULL),(2,NULL,'PCB-CIR-001','环形器控制板',2,1,NULL,'pcs','self_made','[{\"key\": \"隔离度\", \"unit\": \"dB\", \"value\": \"15\"}]',1,'PCB 产品资料样例',NULL,'2026-06-11 14:49:25',NULL,'2026-06-24 16:17:57',0,NULL,NULL),(3,NULL,'GX-20260615001','带线腔体',3,NULL,NULL,'pcs','purchased','[]',1,NULL,NULL,'2026-06-15 16:12:40',NULL,'2026-06-15 16:12:40',0,NULL,NULL),(4,NULL,'GX-20260615002','PCB板',2,NULL,NULL,'pcs','purchased','[]',1,NULL,NULL,'2026-06-15 16:13:29',NULL,'2026-06-15 16:13:29',0,NULL,NULL),(5,NULL,'GX-20260615003','粘合剂',3,NULL,NULL,'pcs','purchased','[]',1,NULL,NULL,'2026-06-15 16:14:04',NULL,'2026-06-15 16:14:04',0,NULL,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `jti` char(36) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh_tokens_jti` (`jti`),
  KEY `idx_refresh_tokens_user_id` (`user_id`),
  KEY `idx_refresh_tokens_expires_at` (`expires_at`),
  CONSTRAINT `fk_refresh_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (151,1,'a62dc01e-f63c-4391-adb9-30e9dc86de5c','2026-07-09 14:07:04','2026-07-02 14:07:03');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_role_permissions_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,'2026-06-11 16:23:33'),(1,10,'2026-06-11 16:23:33'),(1,11,'2026-06-11 16:23:33'),(1,12,'2026-06-11 16:23:33'),(1,13,'2026-06-11 16:23:33'),(1,14,'2026-06-11 16:23:33'),(1,15,'2026-06-11 16:23:33'),(1,16,'2026-06-11 16:23:33'),(1,17,'2026-06-11 16:23:33'),(1,18,'2026-06-11 16:23:33'),(1,20,'2026-06-11 16:23:33'),(1,21,'2026-06-11 16:23:33'),(1,22,'2026-06-11 16:23:33'),(1,23,'2026-06-11 16:23:33'),(1,24,'2026-06-11 16:23:33'),(1,25,'2026-06-11 16:23:33'),(1,26,'2026-06-11 16:23:33'),(1,27,'2026-06-11 16:23:33'),(1,30,'2026-06-11 16:23:33'),(1,31,'2026-06-11 16:23:33'),(1,32,'2026-06-11 16:23:33'),(1,33,'2026-06-11 16:23:33'),(1,34,'2026-06-11 16:23:33'),(1,35,'2026-06-11 16:23:33'),(1,36,'2026-06-11 16:23:33'),(1,40,'2026-06-11 16:23:33'),(1,41,'2026-06-11 16:23:33'),(1,45,'2026-06-11 16:23:33'),(1,50,'2026-06-11 16:23:33'),(1,51,'2026-06-11 16:23:33'),(1,52,'2026-06-11 16:23:33'),(1,53,'2026-06-11 16:23:33'),(1,54,'2026-06-11 16:23:33'),(1,55,'2026-06-11 16:23:33'),(1,56,'2026-06-11 16:23:33'),(1,57,'2026-06-11 16:23:33'),(1,58,'2026-06-11 16:23:33'),(1,59,'2026-06-11 16:23:33'),(1,60,'2026-06-11 16:23:33'),(1,70,'2026-06-11 16:23:33'),(1,71,'2026-06-11 16:23:33'),(1,72,'2026-06-11 16:23:33'),(1,73,'2026-06-11 16:23:33'),(1,74,'2026-06-11 16:23:33'),(1,75,'2026-06-11 16:23:33'),(1,76,'2026-06-11 16:23:33'),(1,80,'2026-06-11 16:23:33'),(1,81,'2026-06-11 16:23:33'),(1,82,'2026-06-11 16:23:33'),(1,83,'2026-06-11 16:23:33'),(1,84,'2026-06-11 16:23:33'),(1,85,'2026-06-11 16:23:33'),(1,86,'2026-06-11 16:23:33'),(1,90,'2026-06-11 16:23:33'),(1,91,'2026-06-11 16:23:33'),(1,92,'2026-06-11 16:23:33'),(1,93,'2026-06-11 16:23:33'),(1,94,'2026-06-11 16:23:33'),(1,95,'2026-06-11 16:23:33'),(1,96,'2026-06-11 16:23:33'),(1,97,'2026-06-11 16:23:33'),(1,100,'2026-06-11 16:23:33'),(1,101,'2026-06-11 16:23:33'),(1,102,'2026-06-11 16:23:33'),(1,103,'2026-06-11 16:23:33'),(1,104,'2026-06-11 16:23:33'),(1,105,'2026-06-11 16:23:33'),(1,110,'2026-06-11 16:23:33'),(1,111,'2026-06-11 16:23:33'),(1,112,'2026-06-11 16:23:33'),(1,113,'2026-06-11 16:23:33'),(1,114,'2026-06-11 16:23:33'),(1,115,'2026-06-11 16:23:33'),(1,130,'2026-06-11 16:23:33'),(1,131,'2026-06-11 16:23:33'),(1,132,'2026-06-11 16:23:33'),(1,133,'2026-06-11 16:23:33'),(1,134,'2026-06-11 16:23:33'),(1,135,'2026-06-11 16:23:33'),(1,136,'2026-06-11 16:23:33'),(1,137,'2026-06-11 16:23:33'),(1,138,'2026-06-11 16:23:33'),(1,139,'2026-06-11 16:23:33'),(1,140,'2026-06-11 16:23:33'),(1,141,'2026-06-11 16:23:33'),(1,142,'2026-06-11 16:23:33'),(1,143,'2026-06-11 16:23:33'),(1,150,'2026-06-11 16:23:33'),(1,151,'2026-06-11 16:23:33'),(1,152,'2026-06-11 16:23:33'),(1,153,'2026-06-11 16:23:33'),(1,154,'2026-06-11 16:23:33'),(1,155,'2026-06-11 16:23:33'),(1,156,'2026-06-11 16:23:33'),(1,157,'2026-06-11 16:23:33'),(1,158,'2026-06-11 16:23:33'),(1,159,'2026-06-11 16:23:33'),(1,160,'2026-06-11 16:23:33'),(1,170,'2026-06-11 16:23:33'),(1,171,'2026-06-11 16:23:33'),(1,172,'2026-06-11 16:23:33'),(1,173,'2026-06-11 16:23:33'),(1,174,'2026-06-11 16:23:33'),(1,175,'2026-06-11 16:23:33'),(1,180,'2026-06-11 16:23:33'),(1,181,'2026-06-11 16:23:33'),(1,182,'2026-06-11 16:23:33'),(1,183,'2026-06-11 16:23:33'),(1,184,'2026-06-11 16:23:33'),(1,185,'2026-06-11 16:23:33'),(1,186,'2026-06-11 16:23:33'),(1,187,'2026-06-11 16:23:33'),(1,190,'2026-06-11 16:23:33'),(1,191,'2026-06-11 16:23:33'),(1,192,'2026-06-11 16:23:33'),(1,193,'2026-06-11 16:23:33'),(1,194,'2026-06-11 16:23:33'),(1,195,'2026-06-11 16:23:33'),(1,196,'2026-06-11 16:23:33'),(1,210,'2026-06-11 16:23:33'),(1,211,'2026-06-11 16:23:33'),(1,212,'2026-06-11 16:23:33'),(1,213,'2026-06-11 16:23:33'),(1,214,'2026-06-11 16:23:33'),(1,215,'2026-06-11 16:23:33'),(1,216,'2026-06-11 16:23:33'),(1,220,'2026-06-11 16:23:33'),(1,221,'2026-06-11 16:23:33'),(1,222,'2026-06-11 16:23:33'),(1,223,'2026-06-11 16:23:33'),(1,224,'2026-06-11 16:23:33'),(1,225,'2026-06-11 16:23:33'),(1,226,'2026-06-11 16:23:33'),(1,230,'2026-06-11 16:23:33'),(1,231,'2026-06-11 16:23:33'),(1,232,'2026-06-11 16:23:33'),(1,233,'2026-06-11 16:23:33'),(1,234,'2026-06-11 16:23:33'),(1,235,'2026-06-11 16:23:33'),(1,240,'2026-06-11 16:23:33'),(1,241,'2026-06-11 16:23:33'),(1,242,'2026-06-11 16:23:33'),(1,243,'2026-06-11 16:23:33'),(1,244,'2026-06-11 16:23:33'),(1,245,'2026-06-11 16:23:33'),(1,246,'2026-06-23 14:11:29'),(1,247,'2026-06-23 14:11:29'),(1,248,'2026-06-23 14:11:29'),(1,249,'2026-06-23 14:11:29'),(1,250,'2026-06-23 14:11:29'),(1,251,'2026-06-23 14:11:29'),(1,252,'2026-06-23 14:11:29'),(1,253,'2026-06-23 14:11:29'),(1,254,'2026-06-23 14:11:29'),(1,255,'2026-06-23 14:11:29'),(1,256,'2026-07-01 15:02:30'),(1,257,'2026-07-01 15:02:30'),(1,258,'2026-07-01 15:02:30'),(1,259,'2026-07-01 15:02:30'),(2,1,'2026-06-11 16:23:33'),(3,1,'2026-06-11 16:23:33'),(4,1,'2026-06-11 16:23:33');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`),
  KEY `idx_roles_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'超级管理员','admin','系统内置超级管理员角色',1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(2,'生产管理','production_manager','生产部业务管理角色',1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(3,'生产执行','production_operator','生产部工序执行角色',1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(4,'质量检验','quality_inspector','质量部检验与返工处理角色',1,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_step_materials`
--

DROP TABLE IF EXISTS `route_step_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_step_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `process_route_step_id` bigint unsigned NOT NULL COMMENT '工艺路线工序明细ID',
  `product_material_id` bigint unsigned NOT NULL COMMENT '产品物料清单ID',
  `quantity_per_unit` decimal(12,4) NOT NULL,
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_route_step_materials_step_material_deleted` (`process_route_step_id`,`product_material_id`,`is_deleted`),
  KEY `idx_route_step_materials_product_material_id` (`product_material_id`),
  KEY `idx_route_step_materials_is_deleted` (`is_deleted`),
  KEY `idx_route_step_materials_created_by` (`created_by`),
  KEY `idx_route_step_materials_updated_by` (`updated_by`),
  KEY `idx_route_step_materials_deleted_by` (`deleted_by`),
  KEY `idx_route_step_materials_process_route_step_id` (`process_route_step_id`),
  CONSTRAINT `fk_route_step_materials_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_route_step_materials_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_route_step_materials_process_route_step_id` FOREIGN KEY (`process_route_step_id`) REFERENCES `process_route_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_step_materials_product_material_id` FOREIGN KEY (`product_material_id`) REFERENCES `product_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_step_materials_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_route_step_materials_quantity` CHECK ((`quantity_per_unit` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工序用料关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_step_materials`
--

LOCK TABLES `route_step_materials` WRITE;
/*!40000 ALTER TABLE `route_step_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_step_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `technical_files`
--

DROP TABLE IF EXISTS `technical_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `technical_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `file_code` varchar(100) NOT NULL COMMENT '文件编号',
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_type` varchar(64) NOT NULL DEFAULT 'sop',
  `version` varchar(64) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `remark` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_by` bigint unsigned DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_technical_files_code_version_deleted` (`file_code`,`version`,`is_deleted`),
  KEY `idx_technical_files_file_type` (`file_type`),
  KEY `idx_technical_files_status` (`status`),
  KEY `idx_technical_files_is_deleted` (`is_deleted`),
  KEY `idx_technical_files_created_by` (`created_by`),
  KEY `idx_technical_files_updated_by` (`updated_by`),
  KEY `idx_technical_files_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_technical_files_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_technical_files_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_technical_files_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `technical_files`
--

LOCK TABLES `technical_files` WRITE;
/*!40000 ALTER TABLE `technical_files` DISABLE KEYS */;
INSERT INTO `technical_files` VALUES (1,'FILE-0001','装配作业指导书.pdf','/files/processes/GX-001.pdf','sop','V1.0',1,'工序 SOP 样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(2,'FILE-0002','调试规范.pdf','/files/processes/GX-002.pdf','sop','V1.0',1,'工序 SOP 样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(3,'FILE-0003','3- 真空焊接工艺规程.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx','process_sop',NULL,1,'生产工序上传文件',NULL,'2026-06-11 16:27:36',NULL,'2026-06-22 14:27:15',0,NULL,NULL),(4,'FILE-0004','1- 微电路制作检验规程.docx','/uploads/processes/1781169761042-1-_微电路制作检验规程.docx','process_sop',NULL,1,'生产工序上传文件',NULL,'2026-06-11 17:22:41',NULL,'2026-06-22 14:27:15',0,NULL,NULL);
/*!40000 ALTER TABLE `technical_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `idx_user_roles_role_id` (`role_id`),
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,'2026-06-11 11:47:00'),(2,2,'2026-06-11 11:47:00'),(3,3,'2026-06-11 11:47:00'),(4,4,'2026-06-11 11:47:00');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint unsigned DEFAULT NULL,
  `username` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(64) NOT NULL,
  `email` varchar(128) DEFAULT NULL,
  `mobile` varchar(32) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_department_id` (`department_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'admin','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','系统管理员','admin@company.local',NULL,1,'2026-07-02 09:16:49','2026-06-11 11:47:00','2026-07-02 09:16:49',NULL),(2,2,'production_manager','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','生产主管','production.manager@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(3,2,'production_operator','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','生产操作员','production.operator@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(4,3,'quality_inspector','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','质量检验员','quality.inspector@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_batch_material_allocation`
--

DROP TABLE IF EXISTS `v_batch_material_allocation`;
/*!50001 DROP VIEW IF EXISTS `v_batch_material_allocation`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_batch_material_allocation` AS SELECT 
 1 AS `requirement_id`,
 1 AS `usage_id`,
 1 AS `batch_id`,
 1 AS `batch_no`,
 1 AS `work_order_id`,
 1 AS `order_no`,
 1 AS `product_id`,
 1 AS `product_code`,
 1 AS `product_model`,
 1 AS `product_name`,
 1 AS `planned_quantity`,
 1 AS `product_material_id`,
 1 AS `material_product_id`,
 1 AS `material_code`,
 1 AS `material_model`,
 1 AS `material_name`,
 1 AS `quantity_per_unit`,
 1 AS `current_bom_required_quantity`,
 1 AS `required_quantity`,
 1 AS `reserved_quantity`,
 1 AS `issued_quantity`,
 1 AS `returned_quantity`,
 1 AS `used_quantity`,
 1 AS `net_used_quantity`,
 1 AS `unfulfilled_quantity`,
 1 AS `unit`,
 1 AS `is_key_material`,
 1 AS `need_batch_record`,
 1 AS `material_batch_id`,
 1 AS `material_batch_no`,
 1 AS `allocated_material_batch_count`,
 1 AS `allocated_material_batch_nos`,
 1 AS `material_status`,
 1 AS `recorded_by`,
 1 AS `recorded_at`,
 1 AS `remark`,
 1 AS `demand_type`,
 1 AS `requirement_status`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_material_batch_available`
--

DROP TABLE IF EXISTS `v_material_batch_available`;
/*!50001 DROP VIEW IF EXISTS `v_material_batch_available`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_material_batch_available` AS SELECT 
 1 AS `material_batch_id`,
 1 AS `material_batch_no`,
 1 AS `material_product_id`,
 1 AS `material_code`,
 1 AS `material_model`,
 1 AS `material_name`,
 1 AS `unit`,
 1 AS `supplier_name`,
 1 AS `protocol_code`,
 1 AS `received_date`,
 1 AS `stock_quantity`,
 1 AS `reserved_quantity`,
 1 AS `used_quantity`,
 1 AS `returned_quantity`,
 1 AS `reserved_not_used_quantity`,
 1 AS `reserved_not_issued_quantity`,
 1 AS `available_quantity`,
 1 AS `material_batch_status`,
 1 AS `remark`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_material_batch_distribution`
--

DROP TABLE IF EXISTS `v_material_batch_distribution`;
/*!50001 DROP VIEW IF EXISTS `v_material_batch_distribution`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_material_batch_distribution` AS SELECT 
 1 AS `usage_id`,
 1 AS `material_batch_id`,
 1 AS `material_batch_no`,
 1 AS `material_product_id`,
 1 AS `material_code`,
 1 AS `material_model`,
 1 AS `material_name`,
 1 AS `supplier_name`,
 1 AS `protocol_code`,
 1 AS `operation_type`,
 1 AS `operation_type_text`,
 1 AS `reserved_quantity`,
 1 AS `used_quantity`,
 1 AS `unit`,
 1 AS `recorded_at`,
 1 AS `recorded_by`,
 1 AS `recorded_by_name`,
 1 AS `batch_id`,
 1 AS `batch_no`,
 1 AS `work_order_id`,
 1 AS `order_no`,
 1 AS `product_id`,
 1 AS `product_model`,
 1 AS `product_name`,
 1 AS `customer_name`,
 1 AS `customer_order_no`,
 1 AS `remark`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_process_route_step_detail`
--

DROP TABLE IF EXISTS `v_process_route_step_detail`;
/*!50001 DROP VIEW IF EXISTS `v_process_route_step_detail`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_process_route_step_detail` AS SELECT 
 1 AS `route_id`,
 1 AS `route_code`,
 1 AS `route_name`,
 1 AS `route_version`,
 1 AS `route_status`,
 1 AS `route_step_id`,
 1 AS `step_order`,
 1 AS `process_step_id`,
 1 AS `step_code`,
 1 AS `step_name`,
 1 AS `sop_file_id`,
 1 AS `sop_file_code`,
 1 AS `sop_file_name`,
 1 AS `sop_version`,
 1 AS `sop_file_url`,
 1 AS `default_owner_id`,
 1 AS `default_owner_name`,
 1 AS `need_inspection`,
 1 AS `need_record`,
 1 AS `remark`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_production_batch_overview`
--

DROP TABLE IF EXISTS `v_production_batch_overview`;
/*!50001 DROP VIEW IF EXISTS `v_production_batch_overview`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_production_batch_overview` AS SELECT 
 1 AS `batch_id`,
 1 AS `batch_no`,
 1 AS `work_order_id`,
 1 AS `order_no`,
 1 AS `customer_order_no`,
 1 AS `customer_name`,
 1 AS `quality_level`,
 1 AS `product_id`,
 1 AS `product_code`,
 1 AS `product_model`,
 1 AS `product_name`,
 1 AS `product_unit`,
 1 AS `route_id`,
 1 AS `route_code`,
 1 AS `route_name`,
 1 AS `route_version`,
 1 AS `owner_id`,
 1 AS `owner_name`,
 1 AS `planned_quantity`,
 1 AS `batch_status`,
 1 AS `plan_start_date`,
 1 AS `plan_end_date`,
 1 AS `actual_start_at`,
 1 AS `actual_end_at`,
 1 AS `remark`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(100) NOT NULL COMMENT '工单号',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `planned_quantity` decimal(12,4) NOT NULL COMMENT '计划生产数量',
  `customer_order_no` varchar(100) DEFAULT NULL COMMENT '客户订单号',
  `customer_name` varchar(255) DEFAULT NULL COMMENT '客户名称',
  `quality_level` varchar(50) DEFAULT NULL COMMENT '质量等级',
  `owner_id` bigint unsigned DEFAULT NULL COMMENT '工单负责人',
  `status` varchar(50) NOT NULL DEFAULT 'draft' COMMENT 'draft/released/doing/completed/closed/cancelled',
  `plan_start_date` date DEFAULT NULL COMMENT '计划开始日期',
  `plan_end_date` date DEFAULT NULL COMMENT '计划完成日期',
  `actual_start_at` datetime DEFAULT NULL COMMENT '实际开始时间',
  `actual_end_at` datetime DEFAULT NULL COMMENT '实际完成时间',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_orders_no_deleted` (`order_no`,`is_deleted`),
  KEY `idx_work_orders_product_id` (`product_id`),
  KEY `idx_work_orders_owner_id` (`owner_id`),
  KEY `idx_work_orders_status` (`status`),
  KEY `idx_work_orders_plan_dates` (`plan_start_date`,`plan_end_date`),
  KEY `idx_work_orders_is_deleted` (`is_deleted`),
  KEY `idx_work_orders_created_by` (`created_by`),
  KEY `idx_work_orders_updated_by` (`updated_by`),
  KEY `idx_work_orders_deleted_by` (`deleted_by`),
  KEY `idx_work_orders_customer_order_no` (`customer_order_no`),
  CONSTRAINT `fk_work_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_work_orders_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_work_orders_quantity` CHECK ((`planned_quantity` > 0)),
  CONSTRAINT `chk_work_orders_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'released',_utf8mb4'doing',_utf8mb4'completed',_utf8mb4'closed',_utf8mb4'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
INSERT INTO `work_orders` VALUES (1,'GD-001',1,100.0000,NULL,NULL,NULL,2,'released','2026-06-15','2026-06-18',NULL,NULL,'需要提供检测报告',NULL,'2026-06-12 14:53:35',NULL,'2026-06-15 11:41:08',0,NULL,NULL),(2,'gd-002',1,100.0000,'DD-20260624001','航天',NULL,2,'doing','2026-06-17','2026-06-18',NULL,NULL,NULL,NULL,'2026-06-17 10:55:49',NULL,'2026-07-02 13:55:06',0,NULL,NULL),(3,'GD-003',1,50.0000,'DD-20260702001','航空航天有限公司',NULL,2,'released','2026-07-07','2026-07-31',NULL,NULL,NULL,NULL,'2026-07-02 13:54:26',NULL,'2026-07-02 13:54:33',0,NULL,NULL);
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'company_test'
--

--
-- Dumping routines for database 'company_test'
--

--
-- Current Database: `company_test`
--

USE `company_test`;

--
-- Final view structure for view `v_batch_material_allocation`
--

/*!50001 DROP VIEW IF EXISTS `v_batch_material_allocation`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_batch_material_allocation` AS select `requirement`.`id` AS `requirement_id`,`requirement`.`id` AS `usage_id`,`overview`.`batch_id` AS `batch_id`,`overview`.`batch_no` AS `batch_no`,`overview`.`work_order_id` AS `work_order_id`,`overview`.`order_no` AS `order_no`,`overview`.`product_id` AS `product_id`,`overview`.`product_code` AS `product_code`,`overview`.`product_model` AS `product_model`,`overview`.`product_name` AS `product_name`,`overview`.`planned_quantity` AS `planned_quantity`,`requirement`.`product_materials_id` AS `product_material_id`,coalesce(`requirement`.`material_product_id`,`pm`.`material_product_id`) AS `material_product_id`,`material`.`product_code` AS `material_code`,`material`.`product_model` AS `material_model`,`material`.`product_name` AS `material_name`,`pm`.`quantity_per_unit` AS `quantity_per_unit`,cast((`pm`.`quantity_per_unit` * `overview`.`planned_quantity`) as decimal(12,4)) AS `current_bom_required_quantity`,`requirement`.`plan_quantity` AS `required_quantity`,coalesce(`summary`.`reserved_quantity`,0) AS `reserved_quantity`,coalesce(`summary`.`issued_quantity`,0) AS `issued_quantity`,coalesce(`summary`.`returned_quantity`,0) AS `returned_quantity`,(coalesce(`summary`.`issued_quantity`,0) - coalesce(`summary`.`returned_quantity`,0)) AS `used_quantity`,(coalesce(`summary`.`issued_quantity`,0) - coalesce(`summary`.`returned_quantity`,0)) AS `net_used_quantity`,greatest((`requirement`.`plan_quantity` - coalesce(`summary`.`reserved_quantity`,0)),0) AS `unfulfilled_quantity`,coalesce(`requirement`.`unit`,`pm`.`unit`,`material`.`unit`) AS `unit`,`pm`.`is_key_material` AS `is_key_material`,`pm`.`need_batch_record` AS `need_batch_record`,`summary`.`material_batch_id` AS `material_batch_id`,`summary`.`material_batch_no` AS `material_batch_no`,coalesce(`summary`.`allocated_material_batch_count`,0) AS `allocated_material_batch_count`,`summary`.`allocated_material_batch_nos` AS `allocated_material_batch_nos`,(case when (coalesce(`summary`.`reserved_quantity`,0) < `requirement`.`plan_quantity`) then 'shortage' when ((coalesce(`summary`.`issued_quantity`,0) - coalesce(`summary`.`returned_quantity`,0)) >= `requirement`.`plan_quantity`) then 'issued' when ((coalesce(`summary`.`issued_quantity`,0) - coalesce(`summary`.`returned_quantity`,0)) > 0) then 'partial_issued' when (coalesce(`summary`.`reserved_quantity`,0) >= `requirement`.`plan_quantity`) then 'allocated' when (coalesce(`summary`.`reserved_quantity`,0) > 0) then 'partial_allocated' else 'unallocated' end) AS `material_status`,`summary`.`recorded_by` AS `recorded_by`,`summary`.`recorded_at` AS `recorded_at`,`summary`.`remark` AS `remark`,`requirement`.`demand_type` AS `demand_type`,`requirement`.`status` AS `requirement_status`,`requirement`.`created_at` AS `created_at`,`requirement`.`updated_at` AS `updated_at` from ((((`batch_material_requirement` `requirement` join `v_production_batch_overview` `overview` on((`overview`.`batch_id` = `requirement`.`batch_id`))) join `product_materials` `pm` on(((`pm`.`id` = `requirement`.`product_materials_id`) and (`pm`.`is_deleted` = 0)))) join `products` `material` on(((`material`.`id` = coalesce(`requirement`.`material_product_id`,`pm`.`material_product_id`)) and (`material`.`is_deleted` = 0)))) left join (select `operation`.`batch_id` AS `batch_id`,`operation`.`require_id` AS `require_id`,`operation`.`product_materials_id` AS `product_materials_id`,(case when (count(distinct (case when (`operation`.`operation_type` = 'reserve') then `operation`.`material_batch_id` end)) = 1) then max((case when (`operation`.`operation_type` = 'reserve') then `operation`.`material_batch_id` end)) else NULL end) AS `material_batch_id`,count(distinct (case when (`operation`.`operation_type` = 'reserve') then `operation`.`material_batch_id` end)) AS `allocated_material_batch_count`,group_concat(distinct (case when (`operation`.`operation_type` = 'reserve') then `mb`.`material_batch_no` end) order by `mb`.`material_batch_no` ASC separator '、') AS `material_batch_no`,group_concat(distinct (case when (`operation`.`operation_type` = 'reserve') then `mb`.`material_batch_no` end) order by `mb`.`material_batch_no` ASC separator '、') AS `allocated_material_batch_nos`,sum((case when (`operation`.`operation_type` = 'reserve') then coalesce(nullif(`operation`.`operation_quantity`,0),`operation`.`reserved_quantity`,0) when (`operation`.`operation_type` = 'unreserve') then -(coalesce(nullif(`operation`.`operation_quantity`,0),`operation`.`reserved_quantity`,0)) else 0 end)) AS `reserved_quantity`,sum((case when (`operation`.`operation_type` = 'issue') then coalesce(nullif(`operation`.`operation_quantity`,0),`operation`.`used_quantity`,0) else 0 end)) AS `issued_quantity`,sum((case when (`operation`.`operation_type` = 'return') then coalesce(nullif(`operation`.`operation_quantity`,0),`operation`.`used_quantity`,0) else 0 end)) AS `returned_quantity`,max(`operation`.`recorded_by`) AS `recorded_by`,max(`operation`.`recorded_at`) AS `recorded_at`,substring_index(group_concat(`operation`.`remark` order by `operation`.`id` DESC separator '\n'),'\n',1) AS `remark` from (`batch_material_usages` `operation` left join `material_batches` `mb` on(((`mb`.`id` = `operation`.`material_batch_id`) and (`mb`.`is_deleted` = 0)))) where (`operation`.`is_deleted` = 0) group by `operation`.`batch_id`,`operation`.`require_id`,`operation`.`product_materials_id`) `summary` on(((`summary`.`batch_id` = `requirement`.`batch_id`) and ((`summary`.`require_id` = `requirement`.`id`) or ((`summary`.`require_id` is null) and (`summary`.`product_materials_id` = `requirement`.`product_materials_id`)))))) where ((`requirement`.`is_deleted` = 0) and (`requirement`.`status` <> 'cancelled')) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_material_batch_available`
--

/*!50001 DROP VIEW IF EXISTS `v_material_batch_available`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_material_batch_available` AS select `mb`.`id` AS `material_batch_id`,`mb`.`material_batch_no` AS `material_batch_no`,`mb`.`product_id` AS `material_product_id`,`p`.`product_code` AS `material_code`,`p`.`product_model` AS `material_model`,`p`.`product_name` AS `material_name`,`p`.`unit` AS `unit`,`mb`.`supplier_name` AS `supplier_name`,`mb`.`protocol_code` AS `protocol_code`,`mb`.`received_date` AS `received_date`,`mb`.`quantity` AS `stock_quantity`,coalesce(`usage_summary`.`reserved_quantity`,0) AS `reserved_quantity`,coalesce(`usage_summary`.`used_quantity`,0) AS `used_quantity`,coalesce(`usage_summary`.`returned_quantity`,0) AS `returned_quantity`,coalesce(`usage_summary`.`reserved_not_used_quantity`,0) AS `reserved_not_used_quantity`,coalesce(`usage_summary`.`reserved_not_used_quantity`,0) AS `reserved_not_issued_quantity`,greatest((`mb`.`quantity` - coalesce(`usage_summary`.`reserved_not_used_quantity`,0)),0) AS `available_quantity`,`mb`.`status` AS `material_batch_status`,`mb`.`remark` AS `remark`,`mb`.`created_at` AS `created_at`,`mb`.`updated_at` AS `updated_at` from ((`material_batches` `mb` join `products` `p` on(((`p`.`id` = `mb`.`product_id`) and (`p`.`is_deleted` = 0)))) left join (select `operation_summary`.`material_batch_id` AS `material_batch_id`,sum(`operation_summary`.`reserved_quantity`) AS `reserved_quantity`,sum(`operation_summary`.`net_used_quantity`) AS `used_quantity`,sum(`operation_summary`.`returned_quantity`) AS `returned_quantity`,sum(greatest((`operation_summary`.`reserved_quantity` - `operation_summary`.`net_used_quantity`),0)) AS `reserved_not_used_quantity` from (select `batch_material_usages`.`material_batch_id` AS `material_batch_id`,`batch_material_usages`.`batch_id` AS `batch_id`,coalesce(`batch_material_usages`.`require_id`,`batch_material_usages`.`product_materials_id`) AS `demand_key`,sum((case when (`batch_material_usages`.`operation_type` = 'reserve') then coalesce(nullif(`batch_material_usages`.`operation_quantity`,0),`batch_material_usages`.`reserved_quantity`,0) when (`batch_material_usages`.`operation_type` = 'unreserve') then -(coalesce(nullif(`batch_material_usages`.`operation_quantity`,0),`batch_material_usages`.`reserved_quantity`,0)) else 0 end)) AS `reserved_quantity`,sum((case when (`batch_material_usages`.`operation_type` = 'issue') then coalesce(nullif(`batch_material_usages`.`operation_quantity`,0),`batch_material_usages`.`used_quantity`,0) when (`batch_material_usages`.`operation_type` = 'return') then -(coalesce(nullif(`batch_material_usages`.`operation_quantity`,0),`batch_material_usages`.`used_quantity`,0)) else 0 end)) AS `net_used_quantity`,sum((case when (`batch_material_usages`.`operation_type` = 'return') then coalesce(nullif(`batch_material_usages`.`operation_quantity`,0),`batch_material_usages`.`used_quantity`,0) else 0 end)) AS `returned_quantity` from `batch_material_usages` where (`batch_material_usages`.`is_deleted` = 0) group by `batch_material_usages`.`material_batch_id`,`batch_material_usages`.`batch_id`,coalesce(`batch_material_usages`.`require_id`,`batch_material_usages`.`product_materials_id`)) `operation_summary` group by `operation_summary`.`material_batch_id`) `usage_summary` on((`usage_summary`.`material_batch_id` = `mb`.`id`))) where (`mb`.`is_deleted` = 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_material_batch_distribution`
--

/*!50001 DROP VIEW IF EXISTS `v_material_batch_distribution`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_material_batch_distribution` AS select `operation`.`id` AS `usage_id`,`operation`.`material_batch_id` AS `material_batch_id`,`mb`.`material_batch_no` AS `material_batch_no`,`mb`.`product_id` AS `material_product_id`,`material`.`product_code` AS `material_code`,`material`.`product_model` AS `material_model`,`material`.`product_name` AS `material_name`,`mb`.`supplier_name` AS `supplier_name`,`mb`.`protocol_code` AS `protocol_code`,`operation`.`operation_type` AS `operation_type`,(case `operation`.`operation_type` when 'reserve' then '预留' when 'unreserve' then '取消预留' when 'issue' then '领料' when 'return' then '退料' else `operation`.`operation_type` end) AS `operation_type_text`,(case when (`operation`.`operation_type` = 'reserve') then coalesce(nullif(`operation`.`operation_quantity`,0),`operation`.`reserved_quantity`,0) else 0 end) AS `reserved_quantity`,(case when (`operation`.`operation_type` in ('issue','return')) then coalesce(nullif(`operation`.`operation_quantity`,0),`operation`.`used_quantity`,0) else 0 end) AS `used_quantity`,coalesce(`operation`.`unit`,`material`.`unit`) AS `unit`,`operation`.`recorded_at` AS `recorded_at`,`operation`.`recorded_by` AS `recorded_by`,`recorder`.`display_name` AS `recorded_by_name`,`batch`.`id` AS `batch_id`,`batch`.`batch_no` AS `batch_no`,`work_order`.`id` AS `work_order_id`,`work_order`.`order_no` AS `order_no`,`work_order`.`product_id` AS `product_id`,`product`.`product_model` AS `product_model`,`product`.`product_name` AS `product_name`,`work_order`.`customer_name` AS `customer_name`,`work_order`.`customer_order_no` AS `customer_order_no`,`operation`.`remark` AS `remark` from ((((((`batch_material_usages` `operation` join `material_batches` `mb` on(((`mb`.`id` = `operation`.`material_batch_id`) and (`mb`.`is_deleted` = 0)))) join `products` `material` on(((`material`.`id` = `mb`.`product_id`) and (`material`.`is_deleted` = 0)))) join `production_batches` `batch` on(((`batch`.`id` = `operation`.`batch_id`) and (`batch`.`is_deleted` = 0)))) join `work_orders` `work_order` on(((`work_order`.`id` = `batch`.`work_order_id`) and (`work_order`.`is_deleted` = 0)))) join `products` `product` on(((`product`.`id` = `work_order`.`product_id`) and (`product`.`is_deleted` = 0)))) left join `users` `recorder` on(((`recorder`.`id` = `operation`.`recorded_by`) and (`recorder`.`deleted_at` is null)))) where (`operation`.`is_deleted` = 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_process_route_step_detail`
--

/*!50001 DROP VIEW IF EXISTS `v_process_route_step_detail`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_process_route_step_detail` AS select `route`.`id` AS `route_id`,`route`.`route_code` AS `route_code`,`route`.`route_name` AS `route_name`,`route`.`version` AS `route_version`,`route`.`status` AS `route_status`,`route_step`.`id` AS `route_step_id`,`route_step`.`step_order` AS `step_order`,`route_step`.`process_step_id` AS `process_step_id`,`step`.`step_code` AS `step_code`,`step`.`step_name` AS `step_name`,coalesce(`route_step`.`sop_file_id`,`step`.`sop_file_id`) AS `sop_file_id`,`sop`.`file_code` AS `sop_file_code`,`sop`.`file_name` AS `sop_file_name`,`sop`.`version` AS `sop_version`,`sop`.`file_url` AS `sop_file_url`,`route_step`.`default_owner_id` AS `default_owner_id`,`owner`.`display_name` AS `default_owner_name`,`route_step`.`need_inspection` AS `need_inspection`,`route_step`.`need_record` AS `need_record`,`route_step`.`remark` AS `remark` from ((((`process_route_steps` `route_step` join `process_routes` `route` on(((`route`.`id` = `route_step`.`route_id`) and (`route`.`is_deleted` = 0)))) join `process_steps` `step` on(((`step`.`id` = `route_step`.`process_step_id`) and (`step`.`is_deleted` = 0)))) left join `technical_files` `sop` on(((`sop`.`id` = coalesce(`route_step`.`sop_file_id`,`step`.`sop_file_id`)) and (`sop`.`is_deleted` = 0)))) left join `users` `owner` on(((`owner`.`id` = `route_step`.`default_owner_id`) and (`owner`.`deleted_at` is null)))) where ((`route_step`.`is_deleted` = 0) and (`route_step`.`status` = 1)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_production_batch_overview`
--

/*!50001 DROP VIEW IF EXISTS `v_production_batch_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_production_batch_overview` AS select `b`.`id` AS `batch_id`,`b`.`batch_no` AS `batch_no`,`b`.`work_order_id` AS `work_order_id`,`wo`.`order_no` AS `order_no`,`wo`.`customer_order_no` AS `customer_order_no`,`wo`.`customer_name` AS `customer_name`,`wo`.`quality_level` AS `quality_level`,`wo`.`product_id` AS `product_id`,`p`.`product_code` AS `product_code`,`p`.`product_model` AS `product_model`,`p`.`product_name` AS `product_name`,`p`.`unit` AS `product_unit`,`b`.`route_id` AS `route_id`,`r`.`route_code` AS `route_code`,`r`.`route_name` AS `route_name`,`r`.`version` AS `route_version`,`b`.`owner_id` AS `owner_id`,`u`.`display_name` AS `owner_name`,`b`.`planned_quantity` AS `planned_quantity`,`b`.`status` AS `batch_status`,`b`.`plan_start_date` AS `plan_start_date`,`b`.`plan_end_date` AS `plan_end_date`,`b`.`actual_start_at` AS `actual_start_at`,`b`.`actual_end_at` AS `actual_end_at`,`b`.`remark` AS `remark`,`b`.`created_at` AS `created_at`,`b`.`updated_at` AS `updated_at` from ((((`production_batches` `b` join `work_orders` `wo` on(((`wo`.`id` = `b`.`work_order_id`) and (`wo`.`is_deleted` = 0)))) join `products` `p` on(((`p`.`id` = `wo`.`product_id`) and (`p`.`is_deleted` = 0)))) left join `process_routes` `r` on(((`r`.`id` = `b`.`route_id`) and (`r`.`is_deleted` = 0)))) left join `users` `u` on(((`u`.`id` = `b`.`owner_id`) and (`u`.`deleted_at` is null)))) where (`b`.`is_deleted` = 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-02 14:22:11
