-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: company_mes_v2
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
-- Current Database: `company_mes_v2`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `company_mes_v2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `company_mes_v2`;

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='batch step report records';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_step_records`
--

LOCK TABLES `batch_step_records` WRITE;
/*!40000 ALTER TABLE `batch_step_records` DISABLE KEYS */;
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
-- Table structure for table `inventory_transaction`
--

DROP TABLE IF EXISTS `inventory_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transaction` (
  `id` bigint NOT NULL,
  `material_id` bigint NOT NULL COMMENT '物料ID，冗余保存，便于按物料汇总库存',
  `batch_id` bigint NOT NULL COMMENT '批次ID',
  `transaction_type` varchar(30) NOT NULL COMMENT '库存变动类型：入库/出库/退料入库/报废出库/盘点调整/状态转入/状态转出',
  `quantity` decimal(12,4) NOT NULL COMMENT '库存变动数量。正数表示增加，负数表示减少',
  `stock_status` varchar(20) DEFAULT '可用' COMMENT '库存状态：可用/待检/冻结/不良。可分配库存只统计 stock_status=可用',
  `reference_type` varchar(50) DEFAULT NULL COMMENT '来源明细类型：PO_DETAIL/OUTBOUND_DETAIL/RETURN_DETAIL/SCRAP/STOCK_CHECK/STATUS_TRANSFER',
  `reference_detail_id` bigint DEFAULT NULL COMMENT '来源明细ID。建议指向明细行，不要只指向主单',
  `idempotency_key` varchar(100) NOT NULL COMMENT '幂等键，防止同一业务动作重复生成库存流水',
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_transaction_idempotency` (`idempotency_key`),
  KEY `fk_inventory_transaction_batch_material` (`batch_id`,`material_id`),
  CONSTRAINT `fk_inventory_transaction_batch_material` FOREIGN KEY (`batch_id`, `material_id`) REFERENCES `material_batch` (`id`, `material_id`),
  CONSTRAINT `chk_inventory_transaction_quantity` CHECK ((`quantity` <> 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transaction`
--

LOCK TABLES `inventory_transaction` WRITE;
/*!40000 ALTER TABLE `inventory_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_allocation`
--

DROP TABLE IF EXISTS `material_allocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_allocation` (
  `id` bigint NOT NULL,
  `demand_id` bigint NOT NULL COMMENT '需求ID',
  `material_batch_id` bigint NOT NULL COMMENT '分配的物料批次ID',
  `assigned_number` decimal(12,4) NOT NULL COMMENT '分配数量',
  `outbound_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '本分配行累计出库数量',
  `returned_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '本分配行累计退料数量',
  `scrapped_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '本分配行累计报废数量。包括已分配未出库报废，以及退料后报废',
  `version` int DEFAULT '0' COMMENT '乐观锁版本号',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_material_allocation_demand` (`demand_id`),
  KEY `fk_material_allocation_batch` (`material_batch_id`),
  CONSTRAINT `fk_material_allocation_batch` FOREIGN KEY (`material_batch_id`) REFERENCES `material_batch` (`id`),
  CONSTRAINT `fk_material_allocation_demand` FOREIGN KEY (`demand_id`) REFERENCES `material_demand` (`id`),
  CONSTRAINT `chk_material_allocation_assigned_number` CHECK ((`assigned_number` > 0)),
  CONSTRAINT `chk_material_allocation_available_quantity` CHECK (((`outbound_quantity` + `scrapped_quantity`) <= (`assigned_number` + `returned_quantity`))),
  CONSTRAINT `chk_material_allocation_outbound_quantity` CHECK ((`outbound_quantity` >= 0)),
  CONSTRAINT `chk_material_allocation_return_limit` CHECK ((`returned_quantity` <= `outbound_quantity`)),
  CONSTRAINT `chk_material_allocation_returned_quantity` CHECK ((`returned_quantity` >= 0)),
  CONSTRAINT `chk_material_allocation_scrapped_quantity` CHECK ((`scrapped_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_allocation`
--

LOCK TABLES `material_allocation` WRITE;
/*!40000 ALTER TABLE `material_allocation` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_allocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_batch`
--

DROP TABLE IF EXISTS `material_batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_batch` (
  `id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `batch_code` varchar(100) NOT NULL COMMENT '批次号，展示和追溯使用',
  `provider` varchar(100) DEFAULT NULL COMMENT '供应商',
  `production_date` date DEFAULT NULL COMMENT '生产日期',
  `batch_status` varchar(20) DEFAULT '可用' COMMENT '批次业务状态：可用/冻结/停用。不要用它表示用完，用完应由库存流水汇总判断',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_batch_material_code` (`material_id`,`batch_code`),
  UNIQUE KEY `uk_material_batch_id_material` (`id`,`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_batch`
--

LOCK TABLES `material_batch` WRITE;
/*!40000 ALTER TABLE `material_batch` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_demand`
--

DROP TABLE IF EXISTS `material_demand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_demand` (
  `id` bigint NOT NULL,
  `task_id` bigint NOT NULL COMMENT '生产任务ID',
  `material_id` bigint NOT NULL COMMENT '物料ID',
  `need_number` decimal(12,4) NOT NULL COMMENT '需求数量',
  `demand_type` int DEFAULT '0' COMMENT '需求类型：0正常需求/1追加补料/2报废补料',
  `parent_demand_id` bigint DEFAULT NULL COMMENT '补料需求关联的原始需求ID。正常需求为空',
  `source_scrap_id` bigint DEFAULT NULL COMMENT '如果是报废补料，关联报废单ID',
  `reason_type` varchar(50) DEFAULT NULL COMMENT '补料原因：生产损耗/物料不良/返工补料/其他',
  `status` varchar(30) DEFAULT '待分配' COMMENT '状态：待分配/部分分配/已分配/部分出库/已出库/退料处理中/报废处理中/已关闭/已取消',
  `allocated_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '累计已分配数量，来自 material_allocation.assigned_number 汇总',
  `outbound_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '累计出库数量，来自 outbound_detail.outbound_number 汇总',
  `returned_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '累计退料数量，来自 return_detail.return_number 汇总',
  `scrapped_quantity` decimal(12,4) DEFAULT '0.0000' COMMENT '累计报废数量，来自 material_scrap.scrap_number 汇总',
  `version` int DEFAULT '0' COMMENT '乐观锁版本号',
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_demand_source_scrap` (`source_scrap_id`),
  KEY `fk_material_demand_parent` (`parent_demand_id`),
  CONSTRAINT `fk_material_demand_parent` FOREIGN KEY (`parent_demand_id`) REFERENCES `material_demand` (`id`),
  CONSTRAINT `chk_material_demand_allocated_quantity` CHECK ((`allocated_quantity` >= 0)),
  CONSTRAINT `chk_material_demand_allocation_limit` CHECK ((`allocated_quantity` <= `need_number`)),
  CONSTRAINT `chk_material_demand_need_number` CHECK ((`need_number` > 0)),
  CONSTRAINT `chk_material_demand_outbound_quantity` CHECK ((`outbound_quantity` >= 0)),
  CONSTRAINT `chk_material_demand_return_limit` CHECK ((`returned_quantity` <= `outbound_quantity`)),
  CONSTRAINT `chk_material_demand_returned_quantity` CHECK ((`returned_quantity` >= 0)),
  CONSTRAINT `chk_material_demand_scrapped_quantity` CHECK ((`scrapped_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_demand`
--

LOCK TABLES `material_demand` WRITE;
/*!40000 ALTER TABLE `material_demand` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_demand` ENABLE KEYS */;
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
  `target_id` bigint unsigned DEFAULT NULL,
  `target_type` varchar(64) DEFAULT NULL,
  `result` varchar(32) NOT NULL DEFAULT 'success',
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_operation_logs_log_type` (`log_type`),
  KEY `idx_operation_logs_module` (`module`),
  KEY `idx_operation_logs_action` (`action`),
  KEY `idx_operation_logs_user_id` (`user_id`),
  KEY `idx_operation_logs_result` (`result`),
  KEY `idx_operation_logs_created_at` (`created_at`),
  CONSTRAINT `fk_operation_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation_logs`
--

LOCK TABLES `operation_logs` WRITE;
/*!40000 ALTER TABLE `operation_logs` DISABLE KEYS */;
INSERT INTO `operation_logs` VALUES (175,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-24 14:59:28'),(176,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=9ms','2026-06-24 14:59:44'),(177,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-24 15:01:27');
/*!40000 ALTER TABLE `operation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_detail`
--

DROP TABLE IF EXISTS `outbound_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_detail` (
  `id` bigint NOT NULL,
  `outbound_id` bigint NOT NULL COMMENT '出库主表ID',
  `allocation_id` bigint NOT NULL COMMENT '分配明细ID',
  `outbound_number` decimal(12,4) NOT NULL COMMENT '本次出库数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_detail_order_allocation` (`outbound_id`,`allocation_id`),
  KEY `fk_outbound_detail_allocation` (`allocation_id`),
  CONSTRAINT `fk_outbound_detail_allocation` FOREIGN KEY (`allocation_id`) REFERENCES `material_allocation` (`id`),
  CONSTRAINT `fk_outbound_detail_order` FOREIGN KEY (`outbound_id`) REFERENCES `outbound_order` (`id`),
  CONSTRAINT `chk_outbound_detail_number` CHECK ((`outbound_number` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_detail`
--

LOCK TABLES `outbound_detail` WRITE;
/*!40000 ALTER TABLE `outbound_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `outbound_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_order`
--

DROP TABLE IF EXISTS `outbound_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_order` (
  `id` bigint NOT NULL,
  `outbound_no` varchar(50) NOT NULL COMMENT '出库单号',
  `demand_id` bigint NOT NULL COMMENT '本次出库对应的需求ID',
  `status` varchar(20) DEFAULT '待拣货' COMMENT '状态：待拣货/已拣货/部分出库/已出库/已取消',
  `version` int DEFAULT '0' COMMENT '乐观锁版本号',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `outbound_at` timestamp NULL DEFAULT NULL COMMENT '实际出库时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_order_no` (`outbound_no`),
  KEY `fk_outbound_order_demand` (`demand_id`),
  CONSTRAINT `fk_outbound_order_demand` FOREIGN KEY (`demand_id`) REFERENCES `material_demand` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_order`
--

LOCK TABLES `outbound_order` WRITE;
/*!40000 ALTER TABLE `outbound_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `outbound_order` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,0,'首页','dashboard:page','page','/',NULL,NULL,10,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(10,0,'系统管理','system:page','page','/system',NULL,NULL,100,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(11,10,'用户管理','system:users:view','page','/system/users','GET','/system/users',110,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(12,11,'用户详情','system:users:detail','api',NULL,'GET','/system/users/{id}',111,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(13,11,'新增用户','system:users:create','api',NULL,'POST','/system/users',112,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(14,11,'编辑用户','system:users:update','api',NULL,'PUT','/system/users/{id}',113,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(15,11,'启用用户','system:users:enable','api',NULL,'PUT','/system/users/{id}/enable',114,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(16,11,'停用用户','system:users:disable','api',NULL,'PUT','/system/users/{id}/disable',115,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(17,11,'重置密码','system:users:reset-password','api',NULL,'PUT','/system/users/{id}/reset-password',116,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(18,11,'分配角色','system:users:assign-role','api',NULL,'PUT','/system/users/{id}/roles',117,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(20,10,'角色管理','system:roles:view','page','/system/roles','GET','/system/roles',120,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(21,20,'角色详情','system:roles:detail','api',NULL,'GET','/system/roles/{id}',121,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(22,20,'新增角色','system:roles:create','api',NULL,'POST','/system/roles',122,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(23,20,'编辑角色','system:roles:update','api',NULL,'PUT','/system/roles/{id}',123,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(24,20,'删除角色','system:roles:delete','api',NULL,'DELETE','/system/roles/{id}',124,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(25,20,'启用角色','system:roles:enable','api',NULL,'PUT','/system/roles/{id}/enable',125,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(26,20,'停用角色','system:roles:disable','api',NULL,'PUT','/system/roles/{id}/disable',126,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(27,20,'分配权限','system:roles:assign-permissions','api',NULL,'PUT','/system/roles/{id}/permissions',127,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(30,10,'权限管理','system:permissions:view','page','/system/permissions','GET','/system/permissions',130,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(31,30,'权限详情','system:permissions:detail','api',NULL,'GET','/system/permissions/{id}',131,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(32,30,'新增权限','system:permissions:create','api',NULL,'POST','/system/permissions',132,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(33,30,'编辑权限','system:permissions:update','api',NULL,'PUT','/system/permissions/{id}',133,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(34,30,'删除权限','system:permissions:delete','api',NULL,'DELETE','/system/permissions/{id}',134,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(35,30,'启用权限','system:permissions:enable','api',NULL,'PUT','/system/permissions/{id}/enable',135,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(36,30,'停用权限','system:permissions:disable','api',NULL,'PUT','/system/permissions/{id}/disable',136,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(40,10,'日志管理','system:logs:view','page','/system/logs','GET','/system/logs',140,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(41,40,'日志详情','system:logs:detail','api',NULL,'GET','/system/logs/{id}',141,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(45,40,'导出日志','system:logs:export','api',NULL,'GET','/system/logs/export',145,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(50,0,'产品管理','product:page','page','/product',NULL,NULL,200,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(51,50,'产品资料','product:products:view','page','/product/products','GET','/products',210,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(52,51,'产品详情','product:products:detail','api',NULL,'GET','/products/{id}',211,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(53,51,'新增产品','product:products:create','api',NULL,'POST','/products',212,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(54,51,'编辑产品','product:products:update','api',NULL,'PUT','/products/{id}',213,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(55,51,'启用产品','product:products:enable','api',NULL,'PUT','/products/{id}/enable',214,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(56,51,'停用产品','product:products:disable','api',NULL,'PUT','/products/{id}/disable',215,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(57,51,'查看产品库存','product:products:view-inventory','api',NULL,'GET','/products/{id}/inventory',216,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(58,51,'查看产品工艺路线','product:products:view-route','api',NULL,'GET','/products/{id}/routes',217,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(59,51,'配置产品用料清单','product:products:config-bom','api',NULL,'PUT','/products/{id}/bom',218,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(60,51,'绑定默认工艺路线','product:products:bind-route','api',NULL,'PUT','/products/{id}/route',219,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(70,50,'产品分类','product:categories:view','page','/product/categories','GET','/product-categories',230,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(71,70,'产品分类详情','product:categories:detail','api',NULL,'GET','/product-categories/{id}',231,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(72,70,'新增产品分类','product:categories:create','api',NULL,'POST','/product-categories',232,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(73,70,'编辑产品分类','product:categories:update','api',NULL,'PUT','/product-categories/{id}',233,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(74,70,'启用产品分类','product:categories:enable','api',NULL,'PUT','/product-categories/{id}/enable',234,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(75,70,'停用产品分类','product:categories:disable','api',NULL,'PUT','/product-categories/{id}/disable',235,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(76,70,'配置规格参数','product:categories:config-spec','api',NULL,'PUT','/product-categories/{id}/specs',236,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(80,50,'生产工序','product:processes:view','page','/product/processes','GET','/processes',250,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(81,80,'生产工序详情','product:processes:detail','api',NULL,'GET','/processes/{id}',251,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(82,80,'新增生产工序','product:processes:create','api',NULL,'POST','/processes',252,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(83,80,'编辑生产工序','product:processes:update','api',NULL,'PUT','/processes/{id}',253,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(84,80,'启用生产工序','product:processes:enable','api',NULL,'PUT','/processes/{id}/enable',254,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(85,80,'停用生产工序','product:processes:disable','api',NULL,'PUT','/processes/{id}/disable',255,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(86,80,'上传工序SOP','product:processes:upload-sop','api',NULL,'POST','/processes/{id}/sop',256,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(90,50,'工艺路线','product:routes:view','page','/product/routes','GET','/routes',270,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(91,90,'工艺路线详情','product:routes:detail','api',NULL,'GET','/routes/{id}',271,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(92,90,'新增工艺路线','product:routes:create','api',NULL,'POST','/routes',272,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(93,90,'编辑工艺路线','product:routes:update','api',NULL,'PUT','/routes/{id}',273,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(94,90,'删除工艺路线','product:routes:delete','api',NULL,'DELETE','/routes/{id}',274,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(95,90,'启用工艺路线','product:routes:enable','api',NULL,'PUT','/routes/{id}/enable',275,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(96,90,'停用工艺路线','product:routes:disable','api',NULL,'PUT','/routes/{id}/disable',276,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(97,90,'配置工艺路线工序','product:routes:config-processes','api',NULL,'PUT','/routes/{id}/processes',277,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(100,0,'仓储管理','warehouse:page','page','/warehouse',NULL,NULL,300,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(101,100,'库存管理','warehouse:inventory:view','page','/warehouse/inventory','GET','/warehouse/inventory',310,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(102,101,'查看可用库存','warehouse:inventory:view-available','api',NULL,'GET','/warehouse/inventory/available',311,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(103,101,'查看预留库存','warehouse:inventory:view-reserved','api',NULL,'GET','/warehouse/inventory/reserved',312,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(104,101,'库存盘点','warehouse:inventory:stocktake','api',NULL,'POST','/warehouse/inventory/stocktake',313,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(105,101,'库存调整','warehouse:inventory:adjust','api',NULL,'PUT','/warehouse/inventory/adjust',314,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(110,100,'出入库管理','warehouse:transactions:view','page','/warehouse/transactions','GET','/warehouse/transactions',330,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(111,110,'出入库详情','warehouse:transactions:detail','api',NULL,'GET','/warehouse/transactions/{id}',331,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(112,110,'入库','warehouse:transactions:inbound','api',NULL,'POST','/warehouse/transactions/inbound',332,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(113,110,'出库','warehouse:transactions:outbound','api',NULL,'POST','/warehouse/transactions/outbound',333,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(114,110,'发运','warehouse:transactions:shipment','api',NULL,'POST','/warehouse/transactions/shipment',334,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(115,110,'退料','warehouse:transactions:return','api',NULL,'POST','/warehouse/transactions/return',335,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(130,0,'生产管理','production:page','page','/production',NULL,NULL,400,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(131,130,'工单管理','production:orders:view','page','/production/orders','GET','/orders',410,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(132,131,'工单详情','production:orders:detail','api',NULL,'GET','/orders/{id}',411,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(133,131,'新增工单','production:orders:create','api',NULL,'POST','/orders',412,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(134,131,'编辑工单','production:orders:update','api',NULL,'PUT','/orders/{id}',413,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(135,131,'保存草稿','production:orders:draft','api',NULL,'PUT','/orders/{id}/draft',414,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(136,131,'下达工单','production:orders:release','api',NULL,'PUT','/orders/{id}/release',415,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(137,131,'关闭工单','production:orders:close','api',NULL,'PUT','/orders/{id}/close',416,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(138,131,'取消工单','production:orders:cancel','api',NULL,'PUT','/orders/{id}/cancel',417,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(139,131,'查看工单任务','production:orders:tasks:view','api',NULL,'GET','/orders/{id}/tasks',418,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(140,131,'新增工单任务','production:orders:tasks:create','api',NULL,'POST','/orders/{id}/tasks',419,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(141,131,'编辑工单任务','production:orders:tasks:update','api',NULL,'PUT','/orders/{id}/tasks/{taskId}',420,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(142,131,'生成工单物料需求','production:orders:generate-material-demand','api',NULL,'POST','/orders/{id}/material-demand',421,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(143,131,'分配工单物料','production:orders:allocate-material','api',NULL,'POST','/orders/{id}/material-allocation',422,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(150,130,'任务管理','production:tasks:view','page','/production/tasks','GET','/tasks',440,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(151,150,'任务详情','production:tasks:detail','api',NULL,'GET','/tasks/{id}',441,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(152,150,'新增任务','production:tasks:create','api',NULL,'POST','/tasks',442,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(153,150,'编辑任务','production:tasks:update','api',NULL,'PUT','/tasks/{id}',443,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(154,150,'生成任务物料需求','production:tasks:generate-material-demand','api',NULL,'POST','/tasks/{id}/material-demand',444,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(155,150,'分配任务物料','production:tasks:allocate-material','api',NULL,'POST','/tasks/{id}/material-allocation',445,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(156,150,'任务派工','production:tasks:dispatch','api',NULL,'POST','/tasks/{id}/dispatch',446,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(157,150,'开始生产','production:tasks:start','api',NULL,'PUT','/tasks/{id}/start',447,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(158,150,'完成生产','production:tasks:finish','api',NULL,'PUT','/tasks/{id}/finish',448,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(159,150,'创建返工','production:tasks:create-rework','api',NULL,'POST','/tasks/{id}/rework',449,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(160,150,'查看追溯','production:tasks:view-trace','api',NULL,'GET','/tasks/{id}/trace',450,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(170,130,'物料分配','production:material-allocation:view','page','/production/material-allocation','GET','/material-allocation',470,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(171,170,'生成物料需求','production:material-allocation:generate-demand','api',NULL,'POST','/material-allocation/generate-demand',471,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(172,170,'分配物料','production:material-allocation:allocate','api',NULL,'POST','/material-allocation/allocate',472,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(173,170,'确认齐套','production:material-allocation:confirm-kit','api',NULL,'PUT','/material-allocation/{id}/confirm-kit',473,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(174,170,'确认出库','production:material-allocation:confirm-outbound','api',NULL,'PUT','/material-allocation/{id}/confirm-outbound',474,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(175,170,'退料','production:material-allocation:return-material','api',NULL,'POST','/material-allocation/{id}/return',475,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(180,0,'质量管理','quality:page','page','/quality',NULL,NULL,500,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(181,180,'检验记录','quality:inspections:view','page','/quality/inspections','GET','/quality/inspections',510,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(182,181,'检验详情','quality:inspections:detail','api',NULL,'GET','/quality/inspections/{id}',511,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(183,181,'新增检验记录','quality:inspections:create','api',NULL,'POST','/quality/inspections',512,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(184,181,'编辑检验记录','quality:inspections:update','api',NULL,'PUT','/quality/inspections/{id}',513,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(185,181,'上传检测文件','quality:inspections:upload-file','api',NULL,'POST','/quality/inspections/{id}/files',514,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(186,181,'创建检验返工','quality:inspections:create-rework','api',NULL,'POST','/quality/inspections/{id}/rework',515,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(187,181,'确认合格入库','quality:inspections:confirm-inbound','api',NULL,'PUT','/quality/inspections/{id}/confirm-inbound',516,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(190,180,'返工记录','quality:reworks:view','page','/quality/reworks','GET','/quality/reworks',530,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(191,190,'返工详情','quality:reworks:detail','api',NULL,'GET','/quality/reworks/{id}',531,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(192,190,'新增返工记录','quality:reworks:create','api',NULL,'POST','/quality/reworks',532,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(193,190,'编辑返工记录','quality:reworks:update','api',NULL,'PUT','/quality/reworks/{id}',533,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(194,190,'分配返工负责人','quality:reworks:assign-owner','api',NULL,'PUT','/quality/reworks/{id}/owner',534,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(195,190,'填写返工结果','quality:reworks:submit-result','api',NULL,'PUT','/quality/reworks/{id}/result',535,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(196,190,'返工后重新检验','quality:reworks:reinspect','api',NULL,'POST','/quality/reworks/{id}/reinspect',536,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(210,0,'员工端','worker:page','page','/worker',NULL,NULL,600,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(211,210,'我的任务','worker:tasks:view','page','/worker/tasks','GET','/worker/tasks',610,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(212,211,'我的任务详情','worker:tasks:detail','api',NULL,'GET','/worker/tasks/{id}',611,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(213,211,'查看SOP','worker:tasks:view-sop','api',NULL,'GET','/worker/tasks/{id}/sop',612,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(214,211,'开始我的任务','worker:tasks:start','api',NULL,'PUT','/worker/tasks/{id}/start',613,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(215,211,'完成我的任务','worker:tasks:complete','api',NULL,'PUT','/worker/tasks/{id}/complete',614,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(216,211,'查看我的任务历史','worker:tasks:history','api',NULL,'GET','/worker/tasks/{id}/history',615,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(220,0,'检测端','inspector:page','page','/inspector',NULL,NULL,700,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(221,220,'检测任务','inspector:tasks:view','page','/inspector/tasks','GET','/inspector/tasks',710,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(222,221,'检测任务详情','inspector:tasks:detail','api',NULL,'GET','/inspector/tasks/{id}',711,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(223,221,'查看规格书','inspector:tasks:view-spec','api',NULL,'GET','/inspector/tasks/{id}/spec',712,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(224,221,'填写检测结果','inspector:tasks:submit-result','api',NULL,'PUT','/inspector/tasks/{id}/result',713,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(225,221,'上传检测文件','inspector:tasks:upload-file','api',NULL,'POST','/inspector/tasks/{id}/files',714,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(226,221,'创建检测返工','inspector:tasks:create-rework','api',NULL,'POST','/inspector/tasks/{id}/rework',715,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(230,130,'派工管理','production:dispatch:view','page','/production/dispatch','GET','/dispatch',480,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(231,230,'派工详情','production:dispatch:detail','api',NULL,'GET','/dispatch/{batchId}',481,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(232,230,'工序派工','production:dispatch:assign','api',NULL,'POST','/dispatch/{batchId}/steps/{stepId}/assign',482,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(233,230,'改派','production:dispatch:reassign','api',NULL,'PUT','/dispatch/{batchId}/steps/{stepId}/reassign',483,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(234,230,'一键按默认派工','production:dispatch:batch-default','api',NULL,'POST','/dispatch/{batchId}/batch-default',484,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(235,230,'清除全部派工','production:dispatch:clear','api',NULL,'DELETE','/dispatch/{batchId}/clear',485,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(240,130,'生产报工','production:reports:view','page','/production/execution-records','GET','/execution-records',490,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(241,240,'报工详情','production:reports:detail','api',NULL,'GET','/execution-records/{batchId}',491,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(242,240,'开工','production:reports:start','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/start',492,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(243,240,'完工报工','production:reports:finish','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/finish',493,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(244,240,'开工并报工','production:reports:start-and-finish','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/start-and-finish',494,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(245,240,'批量报工','production:reports:batch-finish','api',NULL,'POST','/execution-records/batch-finish',495,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_batches`
--

LOCK TABLES `production_batches` WRITE;
/*!40000 ALTER TABLE `production_batches` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (42,1,'a5e67693-c995-4f8a-ae46-937f53752040','2026-07-01 15:01:28','2026-06-24 15:01:27');
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
INSERT INTO `role_permissions` VALUES (1,1,'2026-06-11 16:23:33'),(1,10,'2026-06-11 16:23:33'),(1,11,'2026-06-11 16:23:33'),(1,12,'2026-06-11 16:23:33'),(1,13,'2026-06-11 16:23:33'),(1,14,'2026-06-11 16:23:33'),(1,15,'2026-06-11 16:23:33'),(1,16,'2026-06-11 16:23:33'),(1,17,'2026-06-11 16:23:33'),(1,18,'2026-06-11 16:23:33'),(1,20,'2026-06-11 16:23:33'),(1,21,'2026-06-11 16:23:33'),(1,22,'2026-06-11 16:23:33'),(1,23,'2026-06-11 16:23:33'),(1,24,'2026-06-11 16:23:33'),(1,25,'2026-06-11 16:23:33'),(1,26,'2026-06-11 16:23:33'),(1,27,'2026-06-11 16:23:33'),(1,30,'2026-06-11 16:23:33'),(1,31,'2026-06-11 16:23:33'),(1,32,'2026-06-11 16:23:33'),(1,33,'2026-06-11 16:23:33'),(1,34,'2026-06-11 16:23:33'),(1,35,'2026-06-11 16:23:33'),(1,36,'2026-06-11 16:23:33'),(1,40,'2026-06-11 16:23:33'),(1,41,'2026-06-11 16:23:33'),(1,45,'2026-06-11 16:23:33'),(1,50,'2026-06-11 16:23:33'),(1,51,'2026-06-11 16:23:33'),(1,52,'2026-06-11 16:23:33'),(1,53,'2026-06-11 16:23:33'),(1,54,'2026-06-11 16:23:33'),(1,55,'2026-06-11 16:23:33'),(1,56,'2026-06-11 16:23:33'),(1,57,'2026-06-11 16:23:33'),(1,58,'2026-06-11 16:23:33'),(1,59,'2026-06-11 16:23:33'),(1,60,'2026-06-11 16:23:33'),(1,70,'2026-06-11 16:23:33'),(1,71,'2026-06-11 16:23:33'),(1,72,'2026-06-11 16:23:33'),(1,73,'2026-06-11 16:23:33'),(1,74,'2026-06-11 16:23:33'),(1,75,'2026-06-11 16:23:33'),(1,76,'2026-06-11 16:23:33'),(1,80,'2026-06-11 16:23:33'),(1,81,'2026-06-11 16:23:33'),(1,82,'2026-06-11 16:23:33'),(1,83,'2026-06-11 16:23:33'),(1,84,'2026-06-11 16:23:33'),(1,85,'2026-06-11 16:23:33'),(1,86,'2026-06-11 16:23:33'),(1,90,'2026-06-11 16:23:33'),(1,91,'2026-06-11 16:23:33'),(1,92,'2026-06-11 16:23:33'),(1,93,'2026-06-11 16:23:33'),(1,94,'2026-06-11 16:23:33'),(1,95,'2026-06-11 16:23:33'),(1,96,'2026-06-11 16:23:33'),(1,97,'2026-06-11 16:23:33'),(1,100,'2026-06-11 16:23:33'),(1,101,'2026-06-11 16:23:33'),(1,102,'2026-06-11 16:23:33'),(1,103,'2026-06-11 16:23:33'),(1,104,'2026-06-11 16:23:33'),(1,105,'2026-06-11 16:23:33'),(1,110,'2026-06-11 16:23:33'),(1,111,'2026-06-11 16:23:33'),(1,112,'2026-06-11 16:23:33'),(1,113,'2026-06-11 16:23:33'),(1,114,'2026-06-11 16:23:33'),(1,115,'2026-06-11 16:23:33'),(1,130,'2026-06-11 16:23:33'),(1,131,'2026-06-11 16:23:33'),(1,132,'2026-06-11 16:23:33'),(1,133,'2026-06-11 16:23:33'),(1,134,'2026-06-11 16:23:33'),(1,135,'2026-06-11 16:23:33'),(1,136,'2026-06-11 16:23:33'),(1,137,'2026-06-11 16:23:33'),(1,138,'2026-06-11 16:23:33'),(1,139,'2026-06-11 16:23:33'),(1,140,'2026-06-11 16:23:33'),(1,141,'2026-06-11 16:23:33'),(1,142,'2026-06-11 16:23:33'),(1,143,'2026-06-11 16:23:33'),(1,150,'2026-06-11 16:23:33'),(1,151,'2026-06-11 16:23:33'),(1,152,'2026-06-11 16:23:33'),(1,153,'2026-06-11 16:23:33'),(1,154,'2026-06-11 16:23:33'),(1,155,'2026-06-11 16:23:33'),(1,156,'2026-06-11 16:23:33'),(1,157,'2026-06-11 16:23:33'),(1,158,'2026-06-11 16:23:33'),(1,159,'2026-06-11 16:23:33'),(1,160,'2026-06-11 16:23:33'),(1,170,'2026-06-11 16:23:33'),(1,171,'2026-06-11 16:23:33'),(1,172,'2026-06-11 16:23:33'),(1,173,'2026-06-11 16:23:33'),(1,174,'2026-06-11 16:23:33'),(1,175,'2026-06-11 16:23:33'),(1,180,'2026-06-11 16:23:33'),(1,181,'2026-06-11 16:23:33'),(1,182,'2026-06-11 16:23:33'),(1,183,'2026-06-11 16:23:33'),(1,184,'2026-06-11 16:23:33'),(1,185,'2026-06-11 16:23:33'),(1,186,'2026-06-11 16:23:33'),(1,187,'2026-06-11 16:23:33'),(1,190,'2026-06-11 16:23:33'),(1,191,'2026-06-11 16:23:33'),(1,192,'2026-06-11 16:23:33'),(1,193,'2026-06-11 16:23:33'),(1,194,'2026-06-11 16:23:33'),(1,195,'2026-06-11 16:23:33'),(1,196,'2026-06-11 16:23:33'),(1,210,'2026-06-11 16:23:33'),(1,211,'2026-06-11 16:23:33'),(1,212,'2026-06-11 16:23:33'),(1,213,'2026-06-11 16:23:33'),(1,214,'2026-06-11 16:23:33'),(1,215,'2026-06-11 16:23:33'),(1,216,'2026-06-11 16:23:33'),(1,220,'2026-06-11 16:23:33'),(1,221,'2026-06-11 16:23:33'),(1,222,'2026-06-11 16:23:33'),(1,223,'2026-06-11 16:23:33'),(1,224,'2026-06-11 16:23:33'),(1,225,'2026-06-11 16:23:33'),(1,226,'2026-06-11 16:23:33'),(1,230,'2026-06-11 16:23:33'),(1,231,'2026-06-11 16:23:33'),(1,232,'2026-06-11 16:23:33'),(1,233,'2026-06-11 16:23:33'),(1,234,'2026-06-11 16:23:33'),(1,235,'2026-06-11 16:23:33'),(1,240,'2026-06-11 16:23:33'),(1,241,'2026-06-11 16:23:33'),(1,242,'2026-06-11 16:23:33'),(1,243,'2026-06-11 16:23:33'),(1,244,'2026-06-11 16:23:33'),(1,245,'2026-06-11 16:23:33'),(2,1,'2026-06-11 16:23:33'),(3,1,'2026-06-11 16:23:33'),(4,1,'2026-06-11 16:23:33');
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
INSERT INTO `users` VALUES (1,1,'admin','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','系统管理员','admin@company.local',NULL,1,'2026-06-24 15:01:27','2026-06-11 11:47:00','2026-06-24 15:01:27',NULL),(2,2,'production_manager','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','生产主管','production.manager@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(3,2,'production_operator','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','生产操作员','production.operator@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(4,3,'quality_inspector','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','质量检验员','quality.inspector@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-30 10:16:57
