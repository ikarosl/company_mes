--
开发人员：Emily 2026-6-11
描述：完成产品分类，产品信息，工艺路线，工艺管理
数据库操作：新建了表：
| process_route_steps |
| process_routes |
| product_categories |
| products |
| technical_files |
完成情况：基本 CRUD 功能和业务逻辑,建立产品物料清单
未完成：日志，导入导出
存在问题： 1.产品分类和产品信息中的规格参数待定；（已解决） 2.工序编号暂时手动，没有设计编好规则； 3.文件上传功能暂时可以上传，存储位置为 D:\Hzbeat\company_mes\apps\backend\uploads，文件名字乱码；（已解决） 4.工序路线中没有选择适用产品（关联 ID，显示产品名称）的功能；---应该是适用产品类型 （已解决）5.产品信息暂不支持搜索规格参数 6.上传的文件不能删除 7.产品信息不要库存那一栏，工艺路线那一栏待定。8.还需要工序表。
--

--
开发人员：Emily 2026-6-11
描述：完成库存管理、工单管理
数据库操作：新建了表：
| route_step_materials 工序用料关联表 |
| product_materials 产品物料清单表 |
| material_batches 物料批次表 |
| work_orders   工单表 |
完成情况：基本 CRUD 功能和业务逻辑
未完成：日志，导入导出
存在问题： 1.库存管理中的盘点和预留可以取消了，保留使用就可以（用于查看）2.工单管理中没有客户名称和订单号以及相关的搜索。3.工单管理不涉及选择工艺路线，这是任务管理（生产批次时选择工艺路线）。
--

--
开发人员：Emily 2026-6-11
描述：完成任务管理
数据库操作：
删除表（表字段设计修改）：
| route_step_materials 工序用料关联表 |
| product_materials 产品物料清单表 |
新建了表：
| route_step_materials 工序用料关联表 |
| product_materials 产品物料清单表 |
| batch_step_records 批次报工记录表 |
完成情况：生成任务批次、派工、物料需求
未完成：
存在问题：1. 所有已经被用到其他表的数据不建议删除，只做停用。

任务管理页添加一个任务时，

--
开发人员：silent 2026-6-17
描述：
    1、完成员工端报工
    2、修改任务管理页新增任务弹窗，如果选择一个已完全分配的工单，现在会在前端提前做一次验证。
    3、数据库字段做出修改，按照新字段改动了相关代码
数据库操作：
修改表：
batch_step_records：
    total_quantity -> output_quantity
    qualified_quantity -> return_quantity
    defective_quantity -> abnormal_quantity
完成情况：员工端报工
未完成：报工时数量的验证
存在问题：已完全分配的工单被选择分配任务需要落实到在工单管理的生产批次弹窗，一样提前做验证提示不可再分配。

