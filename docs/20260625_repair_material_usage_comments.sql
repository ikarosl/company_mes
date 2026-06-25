-- Repair comments if the migration was executed through a non-UTF-8 terminal pipeline.
SET NAMES utf8mb4;
USE `company_test`;

ALTER TABLE batch_material_usages
  MODIFY COLUMN id bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '物料操作流水ID',
  MODIFY COLUMN batch_id bigint unsigned NOT NULL COMMENT '生产批次ID',
  MODIFY COLUMN material_batch_id bigint unsigned NOT NULL COMMENT '物料批次ID',
  MODIFY COLUMN reserved_quantity decimal(12,4) NOT NULL DEFAULT '0.0000'
    COMMENT '本次预留数量，仅reserve使用',
  MODIFY COLUMN product_materials_id bigint unsigned NOT NULL COMMENT '产品物料清单ID',
  MODIFY COLUMN operation_type varchar(50) NOT NULL COMMENT 'reserve/issue/return',
  MODIFY COLUMN used_quantity decimal(12,4) NOT NULL DEFAULT '0.0000'
    COMMENT '本次领料或退料数量',
  MODIFY COLUMN unit varchar(50) DEFAULT NULL COMMENT '单位',
  MODIFY COLUMN recorded_by bigint unsigned DEFAULT NULL COMMENT '记录人ID',
  MODIFY COLUMN recorded_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  MODIFY COLUMN remark text COMMENT '备注',
  MODIFY COLUMN created_by bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  MODIFY COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  MODIFY COLUMN updated_by bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  MODIFY COLUMN updated_at datetime DEFAULT NULL COMMENT '更新时间',
  MODIFY COLUMN is_deleted tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  MODIFY COLUMN deleted_by bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  MODIFY COLUMN deleted_at datetime DEFAULT NULL COMMENT '删除时间',
  COMMENT = '生产批次物料预留、领料与退料流水表';
