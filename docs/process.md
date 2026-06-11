--
开发人员：Emily 2026-6-11
描述：完成产品分类，产品信息，工艺路线，工艺管理
数据库操作：新建了表：
| process_route_steps    |
| process_routes         |
| product_categories     |
| products               |
| technical_files        |
完成情况：基本CRUD功能和业务逻辑
未完成：日志，导入导出
存在问题：
1.产品分类和产品信息中的规格参数待定；（已解决）
2.工序编号暂时手动，没有设计编好规则；
3.文件上传功能暂时可以上传，存储位置为D:\Hzbeat\company_mes\apps\backend\uploads，文件名字乱码；（已解决）
4.工序路线中没有选择适用产品（关联ID，显示产品名称）的功能；（已解决）
--