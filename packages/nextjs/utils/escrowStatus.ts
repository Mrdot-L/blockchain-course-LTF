export const ESCROW_STATUS_LABEL: Record<number, string> = {
  0: "待付款",
  1: "已付款",
  2: "已完成",
  3: "已退款",
  4: "争议中",
};

export const escrowStatusLabel = (status: number) => ESCROW_STATUS_LABEL[status] ?? `未知状态 (${status})`;

export const escrowStatusDescription = (status: number) => {
  switch (status) {
    case 0:
      return "买家已创建订单，等待付款";
    case 1:
      return "代币已托管在 Escrow 合约";
    case 2:
      return "买家确认收货，代币已转给卖家";
    case 3:
      return "买家已退款，代币已退回";
    case 4:
      return "订单存在争议，等待仲裁人裁决";
    default:
      return "未知状态";
  }
};
