/** 交期提示等级：与 Element Plus Tag 颜色类型保持一致。 */
export type DeliveryTagType = 'danger' | 'warning' | 'primary' | 'success' | 'info';

/** 交期展示信息，daysRemaining 小于 0 表示已逾期。 */
export interface DeliveryMeta {
  label: string;
  type: DeliveryTagType;
  daysRemaining: number | null;
  urgent: boolean;
}

/**
 * 计算未完成单据的交期风险。
 * - 已完成/关闭/取消只展示结果，不再触发逾期告警。
 * - 日期按本地日历日计算，避免 UTC 时区造成前后一天偏差。
 */
export const getDeliveryMeta = (
  planEndDate: string | null,
  status: string,
  terminalStatuses: readonly string[],
): DeliveryMeta => {
  if (!planEndDate) {
    return { label: '未设置', type: 'info', daysRemaining: null, urgent: false };
  }
  if (terminalStatuses.includes(status)) {
    return { label: '已结束', type: 'info', daysRemaining: null, urgent: false };
  }

  const [year, month, day] = planEndDate.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);

  if (daysRemaining < 0) {
    return { label: `已逾期 ${Math.abs(daysRemaining)} 天`, type: 'danger', daysRemaining, urgent: true };
  }
  if (daysRemaining === 0) {
    return { label: '今日到期', type: 'danger', daysRemaining, urgent: true };
  }
  if (daysRemaining <= 3) {
    return { label: `剩余 ${daysRemaining} 天`, type: 'warning', daysRemaining, urgent: true };
  }
  if (daysRemaining <= 7) {
    return { label: `剩余 ${daysRemaining} 天`, type: 'primary', daysRemaining, urgent: false };
  }
  return { label: `剩余 ${daysRemaining} 天`, type: 'success', daysRemaining, urgent: false };
};
