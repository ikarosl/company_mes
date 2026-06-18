-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: company_test
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

DROP DATABASE IF EXISTS `company_test`;
CREATE DATABASE /*!32312 IF NOT EXISTS*/ `company_test` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `company_test`;

--
-- Table structure for table `batch_material_usages`
--

DROP TABLE IF EXISTS `batch_material_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_material_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '生产批次ID，production_batches 表建立后补充外键',
  `material_batch_id` bigint unsigned NOT NULL COMMENT '物料批次ID',
  `reserved_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '预留数量',
  `used_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '实际使用数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `status` varchar(50) NOT NULL DEFAULT 'reserved' COMMENT 'reserved/part_used/used/cancelled',
  `recorded_by` bigint unsigned DEFAULT NULL COMMENT '记录人',
  `recorded_at` datetime DEFAULT NULL COMMENT '记录时间',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_batch_material_usages_batch_id` (`batch_id`),
  KEY `idx_batch_material_usages_material_batch_id` (`material_batch_id`),
  KEY `idx_batch_material_usages_status` (`status`),
  KEY `idx_batch_material_usages_recorded_by` (`recorded_by`),
  KEY `idx_batch_material_usages_is_deleted` (`is_deleted`),
  KEY `idx_batch_material_usages_created_by` (`created_by`),
  KEY `idx_batch_material_usages_updated_by` (`updated_by`),
  KEY `idx_batch_material_usages_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_batch_material_usages_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_material_usages_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_material_usages_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_material_usages_material_batch_id` FOREIGN KEY (`material_batch_id`) REFERENCES `material_batches` (`id`),
  CONSTRAINT `fk_batch_material_usages_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_material_usages_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_batch_material_usages_reserved_quantity` CHECK ((`reserved_quantity` >= 0)),
  CONSTRAINT `chk_batch_material_usages_status` CHECK ((`status` in (_utf8mb4'reserved',_utf8mb4'part_used',_utf8mb4'used',_utf8mb4'cancelled'))),
  CONSTRAINT `chk_batch_material_usages_used_quantity` CHECK ((`used_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料预留与使用表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_material_usages`
--

LOCK TABLES `batch_material_usages` WRITE;
/*!40000 ALTER TABLE `batch_material_usages` DISABLE KEYS */;
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
  `route_step_id` bigint unsigned NOT NULL COMMENT 'process route step id',
  `step_order` int NOT NULL COMMENT 'copied route step order',
  `step_name` varchar(100) NOT NULL COMMENT 'copied route step name',
  `sop_file_id` bigint unsigned DEFAULT NULL COMMENT 'copied SOP file id',
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
  UNIQUE KEY `uk_batch_step_records_batch_step_deleted` (`batch_id`,`route_step_id`,`is_deleted`),
  KEY `idx_batch_step_records_batch_id` (`batch_id`),
  KEY `idx_batch_step_records_route_step_id` (`route_step_id`),
  KEY `idx_batch_step_records_responsible_user_id` (`responsible_user_id`),
  KEY `idx_batch_step_records_status` (`status`),
  KEY `idx_batch_step_records_is_deleted` (`is_deleted`),
  KEY `idx_batch_step_records_created_by` (`created_by`),
  KEY `idx_batch_step_records_updated_by` (`updated_by`),
  KEY `idx_batch_step_records_deleted_by` (`deleted_by`),
  KEY `fk_batch_step_records_sop_file_id` (`sop_file_id`),
  CONSTRAINT `fk_batch_step_records_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_batch_step_records_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_responsible_user_id` FOREIGN KEY (`responsible_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_route_step_id` FOREIGN KEY (`route_step_id`) REFERENCES `process_route_steps` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_step_records_sop_file_id` FOREIGN KEY (`sop_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_batch_step_records_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_batch_step_records_abnormal_quantity` CHECK (((`return_quantity` is null) or (`return_quantity` >= 0))),
  CONSTRAINT `chk_batch_step_records_input_quantity` CHECK (((`output_quantity` is null) or (`output_quantity` >= 0))),
  CONSTRAINT `chk_batch_step_records_output_quantity` CHECK (((`abnormal_quantity` is null) or (`abnormal_quantity` >= 0))),
  CONSTRAINT `chk_batch_step_records_status` CHECK ((`status` in (_gbk'pending',_gbk'doing',_gbk'completed',_gbk'abnormal',_gbk'skipped')))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='batch step report records';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_step_records`
--

LOCK TABLES `batch_step_records` WRITE;
/*!40000 ALTER TABLE `batch_step_records` DISABLE KEYS */;
INSERT INTO `batch_step_records` VALUES (1,2,4,1,'装配',1,1,90.0000,90.0000,90.0000,'completed','2026-06-17 11:19:18','2026-06-17 11:19:35',NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-17 11:19:34',0,NULL,NULL),(2,2,5,2,'调试',2,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-17 11:19:07',0,NULL,NULL),(3,2,6,3,'检验',NULL,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-17 11:19:07',0,NULL,NULL),(4,2,7,4,'焊接',3,1,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-17 11:19:07',NULL,'2026-06-17 11:19:07',0,NULL,NULL);
/*!40000 ALTER TABLE `batch_step_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
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
  `received_date` date DEFAULT NULL COMMENT '入库/接收日期',
  `quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '当前库存台账数量',
  `status` varchar(50) NOT NULL DEFAULT 'available' COMMENT 'available/partial_used/used_up/disabled',
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
  CONSTRAINT `fk_material_batches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_material_batches_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_material_batches_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_material_batches_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_material_batches_quantity` CHECK ((`quantity` >= 0)),
  CONSTRAINT `chk_material_batches_status` CHECK ((`status` in (_gbk'available',_gbk'partial_used',_gbk'used_up',_gbk'disabled')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物料批次表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_batches`
--

LOCK TABLES `material_batches` WRITE;
/*!40000 ALTER TABLE `material_batches` DISABLE KEYS */;
INSERT INTO `material_batches` VALUES (1,2,'WL-001','PCB供应商','2026-06-12',100.0000,'available',NULL,NULL,'2026-06-12 13:46:15',NULL,'2026-06-12 13:47:23',0,NULL,NULL);
/*!40000 ALTER TABLE `material_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operation_logs`
-- Table structure for table `permissions`
-- Table structure for table `process_route_steps`
--

DROP TABLE IF EXISTS `process_route_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `process_route_steps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `route_id` bigint unsigned NOT NULL,
  `process_step_id` bigint unsigned DEFAULT NULL,
  `process_id` bigint unsigned DEFAULT NULL,
  `step_order` int NOT NULL,
  `process_code` varchar(64) NOT NULL,
  `process_name` varchar(128) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `default_owner_id` bigint unsigned DEFAULT NULL,
  `sop_file_id` bigint unsigned DEFAULT NULL,
  `sop_file_name` varchar(255) DEFAULT NULL,
  `sop_file_url` varchar(500) DEFAULT NULL,
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
  UNIQUE KEY `uk_process_route_steps_code_deleted` (`route_id`,`process_code`,`is_deleted`),
  UNIQUE KEY `uk_process_route_steps_order_deleted` (`route_id`,`step_order`,`is_deleted`),
  KEY `idx_process_route_steps_route_id` (`route_id`),
  KEY `idx_process_route_steps_default_owner_id` (`default_owner_id`),
  KEY `idx_process_route_steps_sop_file_id` (`sop_file_id`),
  KEY `idx_process_route_steps_status` (`status`),
  KEY `idx_process_route_steps_is_deleted` (`is_deleted`),
  KEY `idx_process_route_steps_created_by` (`created_by`),
  KEY `idx_process_route_steps_updated_by` (`updated_by`),
  KEY `idx_process_route_steps_deleted_by` (`deleted_by`),
  KEY `idx_process_route_steps_process_id` (`process_id`),
  KEY `idx_process_route_steps_process_step_id` (`process_step_id`),
  CONSTRAINT `fk_process_route_steps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_default_owner_id` FOREIGN KEY (`default_owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_process_id` FOREIGN KEY (`process_id`) REFERENCES `processes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_process_step_id` FOREIGN KEY (`process_step_id`) REFERENCES `process_steps` (`id`) ON DELETE SET NULL,
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
INSERT INTO `process_route_steps` VALUES (1,1,1,1,1,'GX-001','装配','将各部件组装成成品',3,1,NULL,NULL,1,'工艺路线工序明细样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-16 15:40:08',1,NULL,'2026-06-11 16:30:27'),(2,1,2,2,2,'GX-002','调试','调整产品性能参数',2,2,NULL,NULL,1,'工艺路线工序明细样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-16 15:40:08',1,NULL,'2026-06-11 16:30:27'),(3,1,3,3,3,'GX-003','检验','看是否符合客户要求',4,NULL,NULL,NULL,1,NULL,NULL,'2026-06-11 15:56:12',NULL,'2026-06-16 15:40:08',1,NULL,'2026-06-11 16:30:27'),(4,1,1,1,1,'GX-001','装配','将各部件组装成成品',3,1,'装配作业指导书.pdf','/files/processes/GX-001.pdf',1,'工艺路线工序明细样例',NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL),(5,1,2,2,2,'GX-002','调试','调整产品性能参数',2,2,'调试规范.pdf','/files/processes/GX-002.pdf',1,'工艺路线工序明细样例',NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL),(6,1,3,3,3,'GX-003','检验','看是否符合客户要求',4,NULL,NULL,NULL,1,NULL,NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL),(7,1,4,4,4,'GX-004','焊接','焊接PCB',3,3,'3- çç©ºçæ¥å·¥èºè§ç¨.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx',1,NULL,NULL,'2026-06-11 16:30:27',NULL,'2026-06-16 15:40:08',0,NULL,NULL);
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
INSERT INTO `process_steps` VALUES (1,'GX-001','装配',1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-11 16:22:31',0,NULL,NULL),(2,'GX-002','调试',2,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-11 16:22:31',0,NULL,NULL),(3,'GX-003','检验',NULL,'由历史路线步骤迁移生成',NULL,'2026-06-11 16:23:33',NULL,'2026-06-11 16:23:33',0,NULL,NULL),(4,'GX-004','焊接',3,NULL,NULL,'2026-06-11 16:27:06',NULL,'2026-06-11 17:19:36',0,NULL,NULL),(5,'text','test',4,'test',NULL,'2026-06-11 17:02:39',NULL,'2026-06-11 17:22:41',0,NULL,NULL);
/*!40000 ALTER TABLE `process_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `processes`
--

DROP TABLE IF EXISTS `processes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `processes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `process_code` varchar(64) NOT NULL,
  `process_name` varchar(128) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sop_file_id` bigint unsigned DEFAULT NULL,
  `sop_file_name` varchar(255) DEFAULT NULL,
  `sop_file_url` varchar(500) DEFAULT NULL,
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
  UNIQUE KEY `uk_processes_code_deleted` (`process_code`,`is_deleted`),
  KEY `idx_processes_sop_file_id` (`sop_file_id`),
  KEY `idx_processes_status` (`status`),
  KEY `idx_processes_is_deleted` (`is_deleted`),
  KEY `idx_processes_created_by` (`created_by`),
  KEY `idx_processes_updated_by` (`updated_by`),
  KEY `idx_processes_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_processes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_processes_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_processes_sop_file_id` FOREIGN KEY (`sop_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_processes_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `processes`
--

LOCK TABLES `processes` WRITE;
/*!40000 ALTER TABLE `processes` DISABLE KEYS */;
INSERT INTO `processes` VALUES (1,'GX-001','装配','将各部件组装成成品',1,NULL,NULL,1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-11 16:22:31',0,NULL,NULL),(2,'GX-002','调试','调整产品性能参数',2,NULL,NULL,1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-11 16:22:31',0,NULL,NULL),(3,'GX-003','检验','看是否符合客户要求',NULL,NULL,NULL,1,'由历史路线步骤迁移生成',NULL,'2026-06-11 16:23:33',NULL,'2026-06-11 16:23:33',0,NULL,NULL),(4,'GX-004','焊接','焊接PCB',3,'3- 真空焊接工艺规程.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx',1,NULL,NULL,'2026-06-11 16:27:06',NULL,'2026-06-11 17:19:36',0,NULL,NULL),(5,'text','test','test',4,'1- 微电路制作检验规程.docx','/uploads/processes/1781169761042-1-_微电路制作检验规程.docx',1,'test',NULL,'2026-06-11 17:02:39',NULL,'2026-06-11 17:22:41',0,NULL,NULL);
/*!40000 ALTER TABLE `processes` ENABLE KEYS */;
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
-- Table structure for table `product_materials`
--

DROP TABLE IF EXISTS `product_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `material_product_id` bigint unsigned NOT NULL COMMENT '物料产品ID',
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
  CONSTRAINT `fk_product_materials_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='产品物料清单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_materials`
--

LOCK TABLES `product_materials` WRITE;
/*!40000 ALTER TABLE `product_materials` DISABLE KEYS */;
INSERT INTO `product_materials` VALUES (1,2,3,'pcs',1,1,NULL,NULL,'2026-06-15 16:14:06',NULL,'2026-06-15 16:14:06',0,NULL,NULL),(2,2,4,'pcs',1,1,NULL,NULL,'2026-06-15 16:14:06',NULL,'2026-06-15 16:14:06',0,NULL,NULL),(3,2,5,'pcs',1,1,NULL,NULL,'2026-06-15 16:14:06',NULL,'2026-06-15 16:14:06',0,NULL,NULL);
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
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID，冗余工单产品便于查询追溯',
  `route_id` bigint unsigned DEFAULT NULL COMMENT '执行工艺路线ID',
  `planned_quantity` decimal(12,4) NOT NULL COMMENT '批次计划数量',
  `status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT 'pending/assigned/doing/completed/cancelled',
  `material_status` varchar(50) NOT NULL DEFAULT 'ungenerated' COMMENT '物料状态',
  `dispatch_status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT '派工状态',
  `production_status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT '生产状态',
  `inspection_status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT '检验状态',
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
  KEY `idx_production_batches_product_id` (`product_id`),
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
  CONSTRAINT `fk_production_batches_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_production_batches_route_id` FOREIGN KEY (`route_id`) REFERENCES `process_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `chk_production_batches_dispatch_status` CHECK ((`dispatch_status` in (_gbk'pending',_gbk'assigned'))),
  CONSTRAINT `chk_production_batches_inspection_status` CHECK ((`inspection_status` in (_gbk'pending',_gbk'inspecting',_gbk'passed',_gbk'failed',_gbk'partial_pass'))),
  CONSTRAINT `chk_production_batches_material_status` CHECK ((`material_status` in (_gbk'ungenerated',_gbk'unassigned',_gbk'partial_assigned',_gbk'assigned',_gbk'ready',_gbk'outbound',_gbk'shortage',_gbk'returned'))),
  CONSTRAINT `chk_production_batches_production_status` CHECK ((`production_status` in (_gbk'pending',_gbk'doing',_gbk'completed'))),
  CONSTRAINT `chk_production_batches_quantity` CHECK ((`planned_quantity` > 0)),
  CONSTRAINT `chk_production_batches_status` CHECK ((`status` in (_gbk'pending',_gbk'assigned',_gbk'doing',_gbk'completed',_gbk'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_batches`
--

LOCK TABLES `production_batches` WRITE;
/*!40000 ALTER TABLE `production_batches` DISABLE KEYS */;
INSERT INTO `production_batches` VALUES (1,1,'PB20260615001',1,1,100.0000,'assigned','ungenerated','assigned','pending','pending',2,'2026-06-14','2026-06-17',NULL,NULL,NULL,NULL,'2026-06-15 11:41:08',NULL,'2026-06-15 14:03:14',0,NULL,NULL),(2,2,'SCPC-20260617-001',1,1,80.0000,'assigned','ungenerated','assigned','pending','pending',2,'2026-06-17','2026-06-18',NULL,NULL,NULL,NULL,'2026-06-17 11:16:37',NULL,'2026-06-17 11:19:07',0,NULL,NULL);
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
  `product_model` varchar(128) NOT NULL,
  `product_name` varchar(128) NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `default_route_id` bigint unsigned DEFAULT NULL,
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
  KEY `idx_products_name` (`product_name`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_acquire_method` (`acquire_method`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_is_deleted` (`is_deleted`),
  KEY `idx_products_created_by` (`created_by`),
  KEY `idx_products_updated_by` (`updated_by`),
  KEY `idx_products_deleted_by` (`deleted_by`),
  KEY `idx_products_default_route_id` (`default_route_id`),
  CONSTRAINT `fk_products_category_id` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_default_route_id` FOREIGN KEY (`default_route_id`) REFERENCES `process_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_products_acquire_method` CHECK ((`acquire_method` in (_utf8mb4'self_made',_utf8mb4'outsourced',_utf8mb4'purchased')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'HMITB60T180G-B2','宽带微带环形器',1,1,'pcs','self_made','[{\"key\": \"频率范围\", \"unit\": \"GHz\", \"value\": \"6-18\"}, {\"key\": \"插入损耗\", \"unit\": \"dB\", \"value\": \"0.8\"}, {\"key\": \"隔离度\", \"unit\": \"dB\", \"value\": \"18\"}]',1,'产品资料样例',NULL,'2026-06-11 14:49:25',NULL,'2026-06-12 09:44:47',0,NULL,NULL),(2,'PCB-CIR-001','环形器控制板',2,1,'pcs','self_made','[]',1,'PCB 产品资料样例',NULL,'2026-06-11 14:49:25',NULL,'2026-06-16 11:26:59',0,NULL,NULL),(3,'GX-20260615001','带线腔体',3,NULL,'pcs','purchased','[]',1,NULL,NULL,'2026-06-15 16:12:40',NULL,'2026-06-15 16:12:40',0,NULL,NULL),(4,'GX-20260615002','PCB板',2,NULL,'pcs','purchased','[]',1,NULL,NULL,'2026-06-15 16:13:29',NULL,'2026-06-15 16:13:29',0,NULL,NULL),(5,'GX-20260615003','粘合剂',3,NULL,'pcs','purchased','[]',1,NULL,NULL,'2026-06-15 16:14:04',NULL,'2026-06-15 16:14:04',0,NULL,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
-- Table structure for table `role_permissions`
-- Table structure for table `roles`
-- Table structure for table `route_step_materials`
--

DROP TABLE IF EXISTS `route_step_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_step_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `route_step_id` bigint unsigned NOT NULL COMMENT '工艺路线工序明细ID',
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
  UNIQUE KEY `uk_route_step_materials_step_material_deleted` (`route_step_id`,`product_material_id`,`is_deleted`),
  KEY `idx_route_step_materials_route_step_id` (`route_step_id`),
  KEY `idx_route_step_materials_product_material_id` (`product_material_id`),
  KEY `idx_route_step_materials_is_deleted` (`is_deleted`),
  KEY `idx_route_step_materials_created_by` (`created_by`),
  KEY `idx_route_step_materials_updated_by` (`updated_by`),
  KEY `idx_route_step_materials_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_route_step_materials_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_route_step_materials_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_route_step_materials_product_material_id` FOREIGN KEY (`product_material_id`) REFERENCES `product_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_step_materials_route_step_id` FOREIGN KEY (`route_step_id`) REFERENCES `process_route_steps` (`id`) ON DELETE CASCADE,
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
INSERT INTO `technical_files` VALUES (1,'装配作业指导书.pdf','/files/processes/GX-001.pdf','sop','V1.0',1,'工序 SOP 样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 15:38:06',0,NULL,NULL),(2,'调试规范.pdf','/files/processes/GX-002.pdf','sop','V1.0',1,'工序 SOP 样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 15:38:06',0,NULL,NULL),(3,'3- 真空焊接工艺规程.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx','process_sop',NULL,1,'生产工序上传文件',NULL,'2026-06-11 16:27:36',NULL,'2026-06-11 17:19:36',0,NULL,NULL),(4,'1- 微电路制作检验规程.docx','/uploads/processes/1781169761042-1-_微电路制作检验规程.docx','process_sop',NULL,1,'生产工序上传文件',NULL,'2026-06-11 17:22:41',NULL,'2026-06-11 17:22:41',0,NULL,NULL);
/*!40000 ALTER TABLE `technical_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
-- Table structure for table `users`
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(100) NOT NULL COMMENT '工单号',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `route_id` bigint unsigned DEFAULT NULL COMMENT '本工单执行工艺路线ID',
  `planned_quantity` decimal(12,4) NOT NULL COMMENT '计划生产数量',
  `unit` varchar(50) NOT NULL DEFAULT 'pcs' COMMENT '单位',
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
  KEY `idx_work_orders_route_id` (`route_id`),
  KEY `idx_work_orders_owner_id` (`owner_id`),
  KEY `idx_work_orders_status` (`status`),
  KEY `idx_work_orders_plan_dates` (`plan_start_date`,`plan_end_date`),
  KEY `idx_work_orders_is_deleted` (`is_deleted`),
  KEY `idx_work_orders_created_by` (`created_by`),
  KEY `idx_work_orders_updated_by` (`updated_by`),
  KEY `idx_work_orders_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_work_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_work_orders_route_id` FOREIGN KEY (`route_id`) REFERENCES `process_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_work_orders_quantity` CHECK ((`planned_quantity` > 0)),
  CONSTRAINT `chk_work_orders_status` CHECK ((`status` in (_gbk'draft',_gbk'released',_gbk'doing',_gbk'completed',_gbk'closed',_gbk'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
INSERT INTO `work_orders` VALUES (1,'GD-001',1,1,100.0000,'个',2,'released','2026-06-15','2026-06-18',NULL,NULL,'需要提供检测报告',NULL,'2026-06-12 14:53:35',NULL,'2026-06-15 11:41:08',0,NULL,NULL),(2,'gd-002',1,1,100.0000,'pcs',2,'released','2026-06-18','2026-06-19',NULL,NULL,NULL,NULL,'2026-06-17 10:55:49',NULL,'2026-06-17 11:16:37',0,NULL,NULL);
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'company_test'
--

--
-- Dumping routines for database 'company_test'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-17 11:32:35
