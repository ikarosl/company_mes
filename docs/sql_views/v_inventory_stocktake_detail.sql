-- 库存盘点明细：统一物料库存与产品库存两类盘点对象
SET NAMES utf8mb4;
USE `company_test`;
DROP VIEW IF EXISTS `v_inventory_stocktake_detail`;
CREATE VIEW `v_inventory_stocktake_detail` AS
SELECT st.id stocktake_id,st.stocktake_no,st.inventory_type,st.inventory_batch_id,
  st.batch_no_snapshot,st.product_id_snapshot product_id,p.product_code,p.product_model,p.product_name,p.unit,
  p.category_id,c.product_attribute,c.product_type,
  CASE WHEN st.inventory_type='material' THEN mb.material_batch_no ELSE pi.inventory_batch_no END current_batch_no,
  CASE WHEN st.inventory_type='material' THEN mb.supplier_name ELSE NULL END supplier_name,
  CASE WHEN st.inventory_type='material' THEN mb.protocol_code ELSE NULL END protocol_code,
  CASE WHEN st.inventory_type='product' THEN pi.object_type ELSE NULL END product_object_type,
  CASE WHEN st.inventory_type='product' THEN pi.location ELSE NULL END location,
  st.before_quantity,st.counted_quantity,st.difference_quantity,st.difference_type,st.reason_type,
  st.status,st.after_quantity,st.operator_id,operator.display_name operator_name,st.operated_at,
  st.adjusted_by,adjuster.display_name adjusted_by_name,st.adjusted_at,st.file_url,st.remark,
  st.created_by,st.created_at,st.updated_by,st.updated_at
FROM inventory_stocktakes st
LEFT JOIN material_batches mb ON st.inventory_type='material' AND mb.id=st.inventory_batch_id
LEFT JOIN product_inventory_batches pi ON st.inventory_type='product' AND pi.id=st.inventory_batch_id
LEFT JOIN products p ON p.id=st.product_id_snapshot
LEFT JOIN product_categories c ON c.id=p.category_id
LEFT JOIN users operator ON operator.id=st.operator_id
LEFT JOIN users adjuster ON adjuster.id=st.adjusted_by
WHERE st.is_deleted=0;
