mysqldump: [Warning] Using a password on the command line interface can be insecure.
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
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation_logs`
--

LOCK TABLES `operation_logs` WRITE;
/*!40000 ALTER TABLE `operation_logs` DISABLE KEYS */;
INSERT INTO `operation_logs` VALUES (1,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=4ms','2026-06-11 13:39:25'),(2,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 13:40:11'),(3,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 13:59:47'),(4,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-11 13:59:47'),(5,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 13:59:47'),(6,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 14:16:24'),(7,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=4ms','2026-06-11 14:16:24'),(8,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 14:20:25'),(9,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','failed',NULL,NULL,'::1','Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:48'),(10,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','failed',NULL,NULL,'::1','Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:49'),(11,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','failed',NULL,NULL,'::1','Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:49'),(12,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','failed',NULL,NULL,'::1','Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:56'),(13,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','failed',NULL,NULL,'::1','Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:56'),(14,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','failed',NULL,NULL,'::1','Table \'company_test.product_categories\' doesn\'t exist','2026-06-11 14:20:57'),(15,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 14:25:39'),(16,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 14:25:41'),(17,'operation','product-categories','POST /product-categories',1,NULL,'product-categories','success',NULL,'{\"id\": \"3\", \"status\": 1}','::1','duration=11ms','2026-06-11 14:26:27'),(18,'operation','product-categories','PUT /product-categories/2',1,2,'product-categories','success',NULL,'{\"id\": \"2\", \"status\": 1}','::1','duration=10ms','2026-06-11 14:27:55'),(19,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 14:29:41'),(20,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 14:31:15'),(21,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=2ms','2026-06-11 14:47:50'),(22,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 14:47:50'),(23,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 14:47:50'),(24,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 14:47:50'),(25,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-11 14:47:50'),(26,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 14:47:50'),(27,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 15:05:17'),(28,'operation','products','PUT /products/1',1,1,'products','success',NULL,'{\"id\": \"1\", \"status\": 1}','::1','duration=13ms','2026-06-11 15:06:38'),(29,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=5ms','2026-06-11 15:20:14'),(30,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 15:20:14'),(31,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 15:24:23'),(32,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=3ms','2026-06-11 15:42:42'),(33,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 15:42:42'),(34,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 15:42:43'),(35,'operation','processes','PUT /processes/1',1,1,'processes','success',NULL,'{\"id\": \"1\", \"status\": 1}','::1','duration=10ms','2026-06-11 15:43:24'),(36,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=5ms','2026-06-11 15:45:58'),(37,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 15:54:17'),(38,'operation','processes','POST /processes',1,NULL,'processes','success',NULL,'{\"id\": \"3\", \"status\": 1}','::1','duration=11ms','2026-06-11 15:56:12'),(39,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 16:09:36'),(40,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 16:09:36'),(41,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 16:13:51'),(42,'operation','processes','POST /processes',1,NULL,'processes','success',NULL,'{\"id\": \"4\", \"status\": 1}','::1','duration=12ms','2026-06-11 16:27:06'),(43,'operation','processes','POST /processes/4/sop',1,4,'processes','success',NULL,'{\"id\": \"4\", \"status\": 1}','::1','duration=26ms','2026-06-11 16:27:36'),(44,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-11 16:30:07'),(45,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-11 16:30:07'),(46,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 16:30:08'),(47,'operation','routes','PUT /routes/1/processes',1,1,'routes','success',NULL,'{\"id\": \"1\", \"status\": 1}','::1','duration=24ms','2026-06-11 16:30:27'),(48,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-11 16:47:14'),(49,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-12 10:47:46'),(50,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 10:47:46'),(51,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 10:47:47'),(52,'operation','processes','POST /processes/3/sop',1,3,'processes','success',NULL,'{\"id\": \"3\", \"status\": 1}','::1','duration=28ms','2026-06-12 10:49:03'),(53,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=2ms','2026-06-12 11:22:58'),(54,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-12 11:22:58'),(55,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 11:22:59'),(56,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 11:39:33'),(57,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 11:54:17'),(58,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 11:54:17'),(59,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 11:54:18'),(60,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 13:31:23'),(61,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-12 13:31:23'),(62,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 13:43:38'),(63,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 13:43:38'),(64,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 13:44:05'),(65,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=1ms','2026-06-12 14:07:55'),(66,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 14:07:55'),(67,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 14:07:57'),(68,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 14:19:21'),(69,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 14:27:24'),(70,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 14:36:21'),(71,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 14:36:21'),(72,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 14:36:22'),(73,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 14:36:22'),(74,'operation','product-categories','PUT /product-categories/3',1,3,'product-categories','success',NULL,'{\"id\": \"3\", \"status\": 0}','::1','duration=10ms','2026-06-12 14:40:21'),(75,'operation','product-categories','PUT /product-categories/3/enable',1,3,'product-categories','success',NULL,'{\"id\": \"3\", \"status\": 1}','::1','duration=11ms','2026-06-12 14:40:24'),(76,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 14:51:11'),(77,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 14:52:32'),(78,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 15:07:35'),(79,'auth','auth','POST /auth/logout',NULL,NULL,'auth','success',NULL,'{\"success\": true}','::1','duration=0ms','2026-06-12 15:07:35'),(80,'auth','auth','login',1,NULL,NULL,'success',NULL,NULL,'::1','admin','2026-06-12 15:07:53');
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
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,0,'首页','dashboard:page','page','/',NULL,NULL,10,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(10,0,'系统管理','system:page','page','/system',NULL,NULL,100,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(11,10,'用户管理','system:users:view','page','/system/users','GET','/system/users',110,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(12,11,'用户详情','system:users:detail','api',NULL,'GET','/system/users/{id}',111,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(13,11,'新增用户','system:users:create','api',NULL,'POST','/system/users',112,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(14,11,'编辑用户','system:users:update','api',NULL,'PUT','/system/users/{id}',113,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(15,11,'启用用户','system:users:enable','api',NULL,'PUT','/system/users/{id}/enable',114,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(16,11,'停用用户','system:users:disable','api',NULL,'PUT','/system/users/{id}/disable',115,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(17,11,'重置密码','system:users:reset-password','api',NULL,'PUT','/system/users/{id}/reset-password',116,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(18,11,'分配角色','system:users:assign-role','api',NULL,'PUT','/system/users/{id}/roles',117,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(20,10,'角色管理','system:roles:view','page','/system/roles','GET','/system/roles',120,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(21,20,'角色详情','system:roles:detail','api',NULL,'GET','/system/roles/{id}',121,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(22,20,'新增角色','system:roles:create','api',NULL,'POST','/system/roles',122,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(23,20,'编辑角色','system:roles:update','api',NULL,'PUT','/system/roles/{id}',123,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(24,20,'删除角色','system:roles:delete','api',NULL,'DELETE','/system/roles/{id}',124,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(25,20,'启用角色','system:roles:enable','api',NULL,'PUT','/system/roles/{id}/enable',125,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(26,20,'停用角色','system:roles:disable','api',NULL,'PUT','/system/roles/{id}/disable',126,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(27,20,'分配权限','system:roles:assign-permissions','api',NULL,'PUT','/system/roles/{id}/permissions',127,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(30,10,'权限管理','system:permissions:view','page','/system/permissions','GET','/system/permissions',130,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(31,30,'权限详情','system:permissions:detail','api',NULL,'GET','/system/permissions/{id}',131,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(32,30,'新增权限','system:permissions:create','api',NULL,'POST','/system/permissions',132,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(33,30,'编辑权限','system:permissions:update','api',NULL,'PUT','/system/permissions/{id}',133,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(34,30,'删除权限','system:permissions:delete','api',NULL,'DELETE','/system/permissions/{id}',134,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(35,30,'启用权限','system:permissions:enable','api',NULL,'PUT','/system/permissions/{id}/enable',135,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(36,30,'停用权限','system:permissions:disable','api',NULL,'PUT','/system/permissions/{id}/disable',136,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(40,10,'日志管理','system:logs:view','page','/system/logs','GET','/system/logs',140,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(41,40,'日志详情','system:logs:detail','api',NULL,'GET','/system/logs/{id}',141,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(45,40,'导出日志','system:logs:export','api',NULL,'GET','/system/logs/export',145,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(50,0,'产品管理','product:page','page','/product',NULL,NULL,200,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(51,50,'产品资料','product:products:view','page','/product/products','GET','/products',210,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(52,51,'产品详情','product:products:detail','api',NULL,'GET','/products/{id}',211,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(53,51,'新增产品','product:products:create','api',NULL,'POST','/products',212,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(54,51,'编辑产品','product:products:update','api',NULL,'PUT','/products/{id}',213,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(55,51,'启用产品','product:products:enable','api',NULL,'PUT','/products/{id}/enable',214,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(56,51,'停用产品','product:products:disable','api',NULL,'PUT','/products/{id}/disable',215,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(57,51,'查看产品库存','product:products:view-inventory','api',NULL,'GET','/products/{id}/inventory',216,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(58,51,'查看产品工艺路线','product:products:view-route','api',NULL,'GET','/products/{id}/routes',217,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(59,51,'配置产品用料清单','product:products:config-bom','api',NULL,'PUT','/products/{id}/bom',218,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(60,51,'绑定默认工艺路线','product:products:bind-route','api',NULL,'PUT','/products/{id}/route',219,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(70,50,'产品分类','product:categories:view','page','/product/categories','GET','/product-categories',230,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(71,70,'产品分类详情','product:categories:detail','api',NULL,'GET','/product-categories/{id}',231,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(72,70,'新增产品分类','product:categories:create','api',NULL,'POST','/product-categories',232,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(73,70,'编辑产品分类','product:categories:update','api',NULL,'PUT','/product-categories/{id}',233,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(74,70,'启用产品分类','product:categories:enable','api',NULL,'PUT','/product-categories/{id}/enable',234,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(75,70,'停用产品分类','product:categories:disable','api',NULL,'PUT','/product-categories/{id}/disable',235,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(76,70,'配置规格参数','product:categories:config-spec','api',NULL,'PUT','/product-categories/{id}/specs',236,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(80,50,'生产工序','product:processes:view','page','/product/processes','GET','/processes',250,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(81,80,'生产工序详情','product:processes:detail','api',NULL,'GET','/processes/{id}',251,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(82,80,'新增生产工序','product:processes:create','api',NULL,'POST','/processes',252,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(83,80,'编辑生产工序','product:processes:update','api',NULL,'PUT','/processes/{id}',253,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(84,80,'启用生产工序','product:processes:enable','api',NULL,'PUT','/processes/{id}/enable',254,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(85,80,'停用生产工序','product:processes:disable','api',NULL,'PUT','/processes/{id}/disable',255,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(86,80,'上传工序SOP','product:processes:upload-sop','api',NULL,'POST','/processes/{id}/sop',256,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(90,50,'工艺路线','product:routes:view','page','/product/routes','GET','/routes',270,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(91,90,'工艺路线详情','product:routes:detail','api',NULL,'GET','/routes/{id}',271,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(92,90,'新增工艺路线','product:routes:create','api',NULL,'POST','/routes',272,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(93,90,'编辑工艺路线','product:routes:update','api',NULL,'PUT','/routes/{id}',273,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(94,90,'删除工艺路线','product:routes:delete','api',NULL,'DELETE','/routes/{id}',274,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(95,90,'启用工艺路线','product:routes:enable','api',NULL,'PUT','/routes/{id}/enable',275,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(96,90,'停用工艺路线','product:routes:disable','api',NULL,'PUT','/routes/{id}/disable',276,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(97,90,'配置工艺路线工序','product:routes:config-processes','api',NULL,'PUT','/routes/{id}/processes',277,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(100,0,'仓储管理','warehouse:page','page','/warehouse',NULL,NULL,300,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(101,100,'库存管理','warehouse:inventory:view','page','/warehouse/inventory','GET','/warehouse/inventory',310,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(102,101,'查看可用库存','warehouse:inventory:view-available','api',NULL,'GET','/warehouse/inventory/available',311,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(103,101,'查看预留库存','warehouse:inventory:view-reserved','api',NULL,'GET','/warehouse/inventory/reserved',312,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(104,101,'库存盘点','warehouse:inventory:stocktake','api',NULL,'POST','/warehouse/inventory/stocktake',313,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(105,101,'库存调整','warehouse:inventory:adjust','api',NULL,'PUT','/warehouse/inventory/adjust',314,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(110,100,'出入库管理','warehouse:transactions:view','page','/warehouse/transactions','GET','/warehouse/transactions',330,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(111,110,'出入库详情','warehouse:transactions:detail','api',NULL,'GET','/warehouse/transactions/{id}',331,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(112,110,'入库','warehouse:transactions:inbound','api',NULL,'POST','/warehouse/transactions/inbound',332,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(113,110,'出库','warehouse:transactions:outbound','api',NULL,'POST','/warehouse/transactions/outbound',333,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(114,110,'发运','warehouse:transactions:shipment','api',NULL,'POST','/warehouse/transactions/shipment',334,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(115,110,'退料','warehouse:transactions:return','api',NULL,'POST','/warehouse/transactions/return',335,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(130,0,'生产管理','production:page','page','/production',NULL,NULL,400,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(131,130,'工单管理','production:orders:view','page','/production/orders','GET','/orders',410,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(132,131,'工单详情','production:orders:detail','api',NULL,'GET','/orders/{id}',411,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(133,131,'新增工单','production:orders:create','api',NULL,'POST','/orders',412,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(134,131,'编辑工单','production:orders:update','api',NULL,'PUT','/orders/{id}',413,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(135,131,'保存草稿','production:orders:draft','api',NULL,'PUT','/orders/{id}/draft',414,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(136,131,'下达工单','production:orders:release','api',NULL,'PUT','/orders/{id}/release',415,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(137,131,'关闭工单','production:orders:close','api',NULL,'PUT','/orders/{id}/close',416,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(138,131,'取消工单','production:orders:cancel','api',NULL,'PUT','/orders/{id}/cancel',417,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(139,131,'查看工单任务','production:orders:tasks:view','api',NULL,'GET','/orders/{id}/tasks',418,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(140,131,'新增工单任务','production:orders:tasks:create','api',NULL,'POST','/orders/{id}/tasks',419,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(141,131,'编辑工单任务','production:orders:tasks:update','api',NULL,'PUT','/orders/{id}/tasks/{taskId}',420,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(142,131,'生成工单物料需求','production:orders:generate-material-demand','api',NULL,'POST','/orders/{id}/material-demand',421,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(143,131,'分配工单物料','production:orders:allocate-material','api',NULL,'POST','/orders/{id}/material-allocation',422,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(150,130,'任务管理','production:tasks:view','page','/production/tasks','GET','/tasks',440,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(151,150,'任务详情','production:tasks:detail','api',NULL,'GET','/tasks/{id}',441,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(152,150,'新增任务','production:tasks:create','api',NULL,'POST','/tasks',442,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(153,150,'编辑任务','production:tasks:update','api',NULL,'PUT','/tasks/{id}',443,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(154,150,'生成任务物料需求','production:tasks:generate-material-demand','api',NULL,'POST','/tasks/{id}/material-demand',444,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(155,150,'分配任务物料','production:tasks:allocate-material','api',NULL,'POST','/tasks/{id}/material-allocation',445,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(156,150,'任务派工','production:tasks:dispatch','api',NULL,'POST','/tasks/{id}/dispatch',446,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(157,150,'开始生产','production:tasks:start','api',NULL,'PUT','/tasks/{id}/start',447,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(158,150,'完成生产','production:tasks:finish','api',NULL,'PUT','/tasks/{id}/finish',448,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(159,150,'创建返工','production:tasks:create-rework','api',NULL,'POST','/tasks/{id}/rework',449,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(160,150,'查看追溯','production:tasks:view-trace','api',NULL,'GET','/tasks/{id}/trace',450,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(170,130,'物料分配','production:material-allocation:view','page','/production/material-allocation','GET','/material-allocation',470,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(171,170,'生成物料需求','production:material-allocation:generate-demand','api',NULL,'POST','/material-allocation/generate-demand',471,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(172,170,'分配物料','production:material-allocation:allocate','api',NULL,'POST','/material-allocation/allocate',472,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(173,170,'确认齐套','production:material-allocation:confirm-kit','api',NULL,'PUT','/material-allocation/{id}/confirm-kit',473,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(174,170,'确认出库','production:material-allocation:confirm-outbound','api',NULL,'PUT','/material-allocation/{id}/confirm-outbound',474,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(175,170,'退料','production:material-allocation:return-material','api',NULL,'POST','/material-allocation/{id}/return',475,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(180,0,'质量管理','quality:page','page','/quality',NULL,NULL,500,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(181,180,'检验记录','quality:inspections:view','page','/quality/inspections','GET','/quality/inspections',510,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(182,181,'检验详情','quality:inspections:detail','api',NULL,'GET','/quality/inspections/{id}',511,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(183,181,'新增检验记录','quality:inspections:create','api',NULL,'POST','/quality/inspections',512,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(184,181,'编辑检验记录','quality:inspections:update','api',NULL,'PUT','/quality/inspections/{id}',513,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(185,181,'上传检测文件','quality:inspections:upload-file','api',NULL,'POST','/quality/inspections/{id}/files',514,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(186,181,'创建检验返工','quality:inspections:create-rework','api',NULL,'POST','/quality/inspections/{id}/rework',515,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(187,181,'确认合格入库','quality:inspections:confirm-inbound','api',NULL,'PUT','/quality/inspections/{id}/confirm-inbound',516,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(190,180,'返工记录','quality:reworks:view','page','/quality/reworks','GET','/quality/reworks',530,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(191,190,'返工详情','quality:reworks:detail','api',NULL,'GET','/quality/reworks/{id}',531,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(192,190,'新增返工记录','quality:reworks:create','api',NULL,'POST','/quality/reworks',532,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(193,190,'编辑返工记录','quality:reworks:update','api',NULL,'PUT','/quality/reworks/{id}',533,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(194,190,'分配返工负责人','quality:reworks:assign-owner','api',NULL,'PUT','/quality/reworks/{id}/owner',534,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(195,190,'填写返工结果','quality:reworks:submit-result','api',NULL,'PUT','/quality/reworks/{id}/result',535,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(196,190,'返工后重新检验','quality:reworks:reinspect','api',NULL,'POST','/quality/reworks/{id}/reinspect',536,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(210,0,'员工端','worker:page','page','/worker',NULL,NULL,600,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(211,210,'我的任务','worker:tasks:view','page','/worker/tasks','GET','/worker/tasks',610,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(212,211,'我的任务详情','worker:tasks:detail','api',NULL,'GET','/worker/tasks/{id}',611,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(213,211,'查看SOP','worker:tasks:view-sop','api',NULL,'GET','/worker/tasks/{id}/sop',612,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(214,211,'开始我的任务','worker:tasks:start','api',NULL,'PUT','/worker/tasks/{id}/start',613,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(215,211,'完成我的任务','worker:tasks:complete','api',NULL,'PUT','/worker/tasks/{id}/complete',614,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(216,211,'查看我的任务历史','worker:tasks:history','api',NULL,'GET','/worker/tasks/{id}/history',615,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(220,0,'检测端','inspector:page','page','/inspector',NULL,NULL,700,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(221,220,'检测任务','inspector:tasks:view','page','/inspector/tasks','GET','/inspector/tasks',710,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(222,221,'检测任务详情','inspector:tasks:detail','api',NULL,'GET','/inspector/tasks/{id}',711,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(223,221,'查看规格书','inspector:tasks:view-spec','api',NULL,'GET','/inspector/tasks/{id}/spec',712,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(224,221,'填写检测结果','inspector:tasks:submit-result','api',NULL,'PUT','/inspector/tasks/{id}/result',713,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(225,221,'上传检测文件','inspector:tasks:upload-file','api',NULL,'POST','/inspector/tasks/{id}/files',714,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(226,221,'创建检测返工','inspector:tasks:create-rework','api',NULL,'POST','/inspector/tasks/{id}/rework',715,1,'2026-06-11 16:23:33','2026-06-11 16:23:33',NULL),(230,130,'派工管理','production:dispatch:view','page','/production/dispatch','GET','/dispatch',480,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(231,230,'派工详情','production:dispatch:detail','api',NULL,'GET','/dispatch/{batchId}',481,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(232,230,'工序派工','production:dispatch:assign','api',NULL,'POST','/dispatch/{batchId}/steps/{stepId}/assign',482,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(233,230,'改派','production:dispatch:reassign','api',NULL,'PUT','/dispatch/{batchId}/steps/{stepId}/reassign',483,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(234,230,'一键按默认派工','production:dispatch:batch-default','api',NULL,'POST','/dispatch/{batchId}/batch-default',484,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(235,230,'清除全部派工','production:dispatch:clear','api',NULL,'DELETE','/dispatch/{batchId}/clear',485,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(240,130,'生产报工','production:reports:view','page','/production/execution-records','GET','/execution-records',490,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(241,240,'报工详情','production:reports:detail','api',NULL,'GET','/execution-records/{batchId}',491,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(242,240,'开工','production:reports:start','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/start',492,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(243,240,'完工报工','production:reports:finish','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/finish',493,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(244,240,'开工并报工','production:reports:start-and-finish','api',NULL,'POST','/execution-records/{batchId}/steps/{stepId}/start-and-finish',494,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL),(245,240,'批量报工','production:reports:batch-finish','api',NULL,'POST','/execution-records/batch-finish',495,1,'2026-06-12 10:46:47','2026-06-12 10:46:47',NULL);
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
  CONSTRAINT `fk_process_route_steps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_default_owner_id` FOREIGN KEY (`default_owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_process_id` FOREIGN KEY (`process_id`) REFERENCES `processes` (`id`) ON DELETE SET NULL,
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
INSERT INTO `process_route_steps` VALUES (1,1,1,1,'GX-001','装配','将各部件组装成成品',3,1,NULL,NULL,1,'工艺路线工序明细样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 16:30:27',1,NULL,'2026-06-11 16:30:27'),(2,1,2,2,'GX-002','调试','调整产品性能参数',2,2,NULL,NULL,1,'工艺路线工序明细样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 16:30:27',1,NULL,'2026-06-11 16:30:27'),(3,1,3,3,'GX-003','检验','看是否符合客户要求',4,NULL,NULL,NULL,1,NULL,NULL,'2026-06-11 15:56:12',NULL,'2026-06-11 16:30:27',1,NULL,'2026-06-11 16:30:27'),(4,1,1,1,'GX-001','装配','将各部件组装成成品',3,1,'装配作业指导书.pdf','/files/processes/GX-001.pdf',1,'工艺路线工序明细样例',NULL,'2026-06-11 16:30:27',NULL,'2026-06-11 16:30:27',0,NULL,NULL),(5,1,2,2,'GX-002','调试','调整产品性能参数',2,2,'调试规范.pdf','/files/processes/GX-002.pdf',1,'工艺路线工序明细样例',NULL,'2026-06-11 16:30:27',NULL,'2026-06-11 16:30:27',0,NULL,NULL),(6,1,3,3,'GX-003','检验','看是否符合客户要求',4,NULL,NULL,NULL,1,NULL,NULL,'2026-06-11 16:30:27',NULL,'2026-06-11 16:30:27',0,NULL,NULL),(7,1,4,4,'GX-004','焊接','焊接PCB',3,3,'3- çç©ºçæ¥å·¥èºè§ç¨.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx',1,NULL,NULL,'2026-06-11 16:30:27',NULL,'2026-06-11 16:30:27',0,NULL,NULL);
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
  UNIQUE KEY `uk_process_routes_code_deleted` (`route_code`,`is_deleted`),
  KEY `idx_process_routes_status` (`status`),
  KEY `idx_process_routes_is_deleted` (`is_deleted`),
  KEY `idx_process_routes_created_by` (`created_by`),
  KEY `idx_process_routes_updated_by` (`updated_by`),
  KEY `idx_process_routes_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_process_routes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_routes_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_routes_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `process_routes`
--

LOCK TABLES `process_routes` WRITE;
/*!40000 ALTER TABLE `process_routes` DISABLE KEYS */;
INSERT INTO `process_routes` VALUES (1,'ROUTE-CIR-STD','环形器标准工艺路线','V1.0',1,'默认工艺路线样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 15:38:06',0,NULL,NULL);
/*!40000 ALTER TABLE `process_routes` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `processes`
--

LOCK TABLES `processes` WRITE;
/*!40000 ALTER TABLE `processes` DISABLE KEYS */;
INSERT INTO `processes` VALUES (1,'GX-001','装配','将各部件组装成成品',1,NULL,NULL,1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-11 16:22:31',0,NULL,NULL),(2,'GX-002','调试','调整产品性能参数',2,NULL,NULL,1,'生产工序主数据样例',NULL,'2026-06-11 16:22:31',NULL,'2026-06-11 16:22:31',0,NULL,NULL),(3,'GX-003','检验','看是否符合客户要求',4,'有名字.jpg','/uploads/processes/1781232543422-有名字.jpg',1,'由历史路线步骤迁移生成',NULL,'2026-06-11 16:23:33',NULL,'2026-06-12 10:49:03',0,NULL,NULL),(4,'GX-004','焊接','焊接PCB',3,'3- çç©ºçæ¥å·¥èºè§ç¨.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx',1,NULL,NULL,'2026-06-11 16:27:06',NULL,'2026-06-11 16:27:36',0,NULL,NULL);
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
INSERT INTO `product_categories` VALUES (1,'成品','环形器',1,'微波器件成品分类',NULL,'2026-06-11 14:24:07',NULL,'2026-06-11 14:24:07',0,NULL,NULL),(2,'成品','PCB',1,'PCB 成品分类',NULL,'2026-06-11 14:24:07',NULL,'2026-06-11 14:49:25',0,NULL,NULL),(3,'半成品','腔体',1,NULL,NULL,'2026-06-11 14:26:27',NULL,'2026-06-12 14:40:24',0,NULL,NULL);
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'HMITB60T180G-B2','宽带微带环形器',1,1,'pcs','self_made','[{\"key\": \"频率范围\", \"unit\": \"GHz\", \"value\": \"6-18\"}, {\"key\": \"插入损耗\", \"unit\": \"dB\", \"value\": \"0.8\"}, {\"key\": \"隔离度\", \"unit\": \"dB\", \"value\": \"18\"}]',1,'产品资料样例',NULL,'2026-06-11 14:49:25',NULL,'2026-06-11 16:43:16',0,NULL,NULL),(2,'PCB-CIR-001','环形器控制板',2,NULL,'pcs','outsourced','[{\"key\": \"板材\", \"unit\": null, \"value\": \"Rogers\"}, {\"key\": \"层数\", \"unit\": \"层\", \"value\": \"4\"}, {\"key\": \"厚度\", \"unit\": \"mm\", \"value\": \"1.6\"}]',1,'PCB 产品资料样例',NULL,'2026-06-11 14:49:25',NULL,'2026-06-11 16:43:16',0,NULL,NULL);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
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
INSERT INTO `role_permissions` VALUES (1,1,'2026-06-11 16:23:33'),(1,10,'2026-06-11 16:23:33'),(1,11,'2026-06-11 16:23:33'),(1,12,'2026-06-11 16:23:33'),(1,13,'2026-06-11 16:23:33'),(1,14,'2026-06-11 16:23:33'),(1,15,'2026-06-11 16:23:33'),(1,16,'2026-06-11 16:23:33'),(1,17,'2026-06-11 16:23:33'),(1,18,'2026-06-11 16:23:33'),(1,20,'2026-06-11 16:23:33'),(1,21,'2026-06-11 16:23:33'),(1,22,'2026-06-11 16:23:33'),(1,23,'2026-06-11 16:23:33'),(1,24,'2026-06-11 16:23:33'),(1,25,'2026-06-11 16:23:33'),(1,26,'2026-06-11 16:23:33'),(1,27,'2026-06-11 16:23:33'),(1,30,'2026-06-11 16:23:33'),(1,31,'2026-06-11 16:23:33'),(1,32,'2026-06-11 16:23:33'),(1,33,'2026-06-11 16:23:33'),(1,34,'2026-06-11 16:23:33'),(1,35,'2026-06-11 16:23:33'),(1,36,'2026-06-11 16:23:33'),(1,40,'2026-06-11 16:23:33'),(1,41,'2026-06-11 16:23:33'),(1,45,'2026-06-11 16:23:33'),(1,50,'2026-06-11 16:23:33'),(1,51,'2026-06-11 16:23:33'),(1,52,'2026-06-11 16:23:33'),(1,53,'2026-06-11 16:23:33'),(1,54,'2026-06-11 16:23:33'),(1,55,'2026-06-11 16:23:33'),(1,56,'2026-06-11 16:23:33'),(1,57,'2026-06-11 16:23:33'),(1,58,'2026-06-11 16:23:33'),(1,59,'2026-06-11 16:23:33'),(1,60,'2026-06-11 16:23:33'),(1,70,'2026-06-11 16:23:33'),(1,71,'2026-06-11 16:23:33'),(1,72,'2026-06-11 16:23:33'),(1,73,'2026-06-11 16:23:33'),(1,74,'2026-06-11 16:23:33'),(1,75,'2026-06-11 16:23:33'),(1,76,'2026-06-11 16:23:33'),(1,80,'2026-06-11 16:23:33'),(1,81,'2026-06-11 16:23:33'),(1,82,'2026-06-11 16:23:33'),(1,83,'2026-06-11 16:23:33'),(1,84,'2026-06-11 16:23:33'),(1,85,'2026-06-11 16:23:33'),(1,86,'2026-06-11 16:23:33'),(1,90,'2026-06-11 16:23:33'),(1,91,'2026-06-11 16:23:33'),(1,92,'2026-06-11 16:23:33'),(1,93,'2026-06-11 16:23:33'),(1,94,'2026-06-11 16:23:33'),(1,95,'2026-06-11 16:23:33'),(1,96,'2026-06-11 16:23:33'),(1,97,'2026-06-11 16:23:33'),(1,100,'2026-06-11 16:23:33'),(1,101,'2026-06-11 16:23:33'),(1,102,'2026-06-11 16:23:33'),(1,103,'2026-06-11 16:23:33'),(1,104,'2026-06-11 16:23:33'),(1,105,'2026-06-11 16:23:33'),(1,110,'2026-06-11 16:23:33'),(1,111,'2026-06-11 16:23:33'),(1,112,'2026-06-11 16:23:33'),(1,113,'2026-06-11 16:23:33'),(1,114,'2026-06-11 16:23:33'),(1,115,'2026-06-11 16:23:33'),(1,130,'2026-06-11 16:23:33'),(1,131,'2026-06-11 16:23:33'),(1,132,'2026-06-11 16:23:33'),(1,133,'2026-06-11 16:23:33'),(1,134,'2026-06-11 16:23:33'),(1,135,'2026-06-11 16:23:33'),(1,136,'2026-06-11 16:23:33'),(1,137,'2026-06-11 16:23:33'),(1,138,'2026-06-11 16:23:33'),(1,139,'2026-06-11 16:23:33'),(1,140,'2026-06-11 16:23:33'),(1,141,'2026-06-11 16:23:33'),(1,142,'2026-06-11 16:23:33'),(1,143,'2026-06-11 16:23:33'),(1,150,'2026-06-11 16:23:33'),(1,151,'2026-06-11 16:23:33'),(1,152,'2026-06-11 16:23:33'),(1,153,'2026-06-11 16:23:33'),(1,154,'2026-06-11 16:23:33'),(1,155,'2026-06-11 16:23:33'),(1,156,'2026-06-11 16:23:33'),(1,157,'2026-06-11 16:23:33'),(1,158,'2026-06-11 16:23:33'),(1,159,'2026-06-11 16:23:33'),(1,160,'2026-06-11 16:23:33'),(1,170,'2026-06-11 16:23:33'),(1,171,'2026-06-11 16:23:33'),(1,172,'2026-06-11 16:23:33'),(1,173,'2026-06-11 16:23:33'),(1,174,'2026-06-11 16:23:33'),(1,175,'2026-06-11 16:23:33'),(1,180,'2026-06-11 16:23:33'),(1,181,'2026-06-11 16:23:33'),(1,182,'2026-06-11 16:23:33'),(1,183,'2026-06-11 16:23:33'),(1,184,'2026-06-11 16:23:33'),(1,185,'2026-06-11 16:23:33'),(1,186,'2026-06-11 16:23:33'),(1,187,'2026-06-11 16:23:33'),(1,190,'2026-06-11 16:23:33'),(1,191,'2026-06-11 16:23:33'),(1,192,'2026-06-11 16:23:33'),(1,193,'2026-06-11 16:23:33'),(1,194,'2026-06-11 16:23:33'),(1,195,'2026-06-11 16:23:33'),(1,196,'2026-06-11 16:23:33'),(1,210,'2026-06-11 16:23:33'),(1,211,'2026-06-11 16:23:33'),(1,212,'2026-06-11 16:23:33'),(1,213,'2026-06-11 16:23:33'),(1,214,'2026-06-11 16:23:33'),(1,215,'2026-06-11 16:23:33'),(1,216,'2026-06-11 16:23:33'),(1,220,'2026-06-11 16:23:33'),(1,221,'2026-06-11 16:23:33'),(1,222,'2026-06-11 16:23:33'),(1,223,'2026-06-11 16:23:33'),(1,224,'2026-06-11 16:23:33'),(1,225,'2026-06-11 16:23:33'),(1,226,'2026-06-11 16:23:33'),(1,230,'2026-06-12 10:46:52'),(1,231,'2026-06-12 10:46:52'),(1,232,'2026-06-12 10:46:52'),(1,233,'2026-06-12 10:46:52'),(1,234,'2026-06-12 10:46:52'),(1,235,'2026-06-12 10:46:52'),(1,240,'2026-06-12 10:46:52'),(1,241,'2026-06-12 10:46:52'),(1,242,'2026-06-12 10:46:52'),(1,243,'2026-06-12 10:46:52'),(1,244,'2026-06-12 10:46:52'),(1,245,'2026-06-12 10:46:52'),(2,1,'2026-06-11 16:23:33'),(3,1,'2026-06-11 16:23:33'),(4,1,'2026-06-11 16:23:33');
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
INSERT INTO `technical_files` VALUES (1,'装配作业指导书.pdf','/files/processes/GX-001.pdf','sop','V1.0',1,'工序 SOP 样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 15:38:06',0,NULL,NULL),(2,'调试规范.pdf','/files/processes/GX-002.pdf','sop','V1.0',1,'工序 SOP 样例',NULL,'2026-06-11 15:38:06',NULL,'2026-06-11 15:38:06',0,NULL,NULL),(3,'3- çç©ºçæ¥å·¥èºè§ç¨.docx','/uploads/processes/1781166456931-3-_çç©ºçæ¥å·¥èºè§ç¨.docx','process_sop',NULL,1,'生产工序上传文件',NULL,'2026-06-11 16:27:36',NULL,'2026-06-11 16:27:36',0,NULL,NULL),(4,'有名字.jpg','/uploads/processes/1781232543422-有名字.jpg','process_sop',NULL,1,'生产工序上传文件',NULL,'2026-06-12 10:49:03',NULL,'2026-06-12 10:49:03',0,NULL,NULL);
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
INSERT INTO `users` VALUES (1,1,'admin','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','系统管理员','admin@company.local',NULL,1,'2026-06-12 15:07:53','2026-06-11 11:47:00','2026-06-12 15:07:53',NULL),(2,2,'production_manager','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','生产主管','production.manager@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(3,2,'production_operator','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','生产操作员','production.operator@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL),(4,3,'quality_inspector','$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO','质量检验员','quality.inspector@company.local',NULL,1,NULL,'2026-06-11 11:47:00','2026-06-11 11:47:00',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-06-12 15:26:56
