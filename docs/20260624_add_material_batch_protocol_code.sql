-- Add the technical protocol code snapshot used for incoming material inspection.
SET NAMES utf8mb4;
USE `company_test`;

ALTER TABLE material_batches
  ADD COLUMN `protocol_code` varchar(50) DEFAULT NULL
    COMMENT '技术协议编码，作为来料检测依据'
    AFTER `supplier_name`,
  ADD KEY `idx_material_batches_protocol_code` (`protocol_code`);
