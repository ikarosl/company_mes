USE company_test;

-- Production batch single-status migration.
-- New status flow:
-- pending: generated batch
-- material_pending: generated material demand
-- material_assigned: material batches assigned
-- doing: executing
-- completed: completed
-- cancelled: cancelled

UPDATE production_batches
SET status = CASE
  WHEN status = 'cancelled' THEN 'cancelled'
  WHEN status = 'completed' OR production_status = 'completed' THEN 'completed'
  WHEN status = 'doing' OR production_status = 'doing' THEN 'doing'
  WHEN material_status IN ('assigned', 'ready', 'outbound') THEN 'material_assigned'
  WHEN material_status IN ('unassigned', 'partial_assigned', 'shortage', 'returned') THEN 'material_pending'
  WHEN material_status = 'ungenerated' THEN 'pending'
  WHEN dispatch_status = 'assigned' THEN 'material_pending'
  ELSE 'pending'
END
WHERE is_deleted = 0;

ALTER TABLE production_batches
  DROP CHECK chk_production_batches_status,
  DROP CHECK chk_production_batches_material_status,
  DROP CHECK chk_production_batches_dispatch_status,
  DROP CHECK chk_production_batches_production_status,
  DROP CHECK chk_production_batches_inspection_status;

ALTER TABLE production_batches
  DROP COLUMN material_status,
  DROP COLUMN dispatch_status,
  DROP COLUMN production_status,
  DROP COLUMN inspection_status;

ALTER TABLE production_batches
  ADD CONSTRAINT chk_production_batches_status
  CHECK (status IN ('pending', 'material_pending', 'material_assigned', 'doing', 'completed', 'cancelled'));
