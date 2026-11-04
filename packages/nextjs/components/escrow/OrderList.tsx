"use client";

import { OrderRow } from "~~/components/escrow/OrderRow";
import type { HexAddress } from "~~/components/escrow/types";

type OrderListProps = {
  orderIds: bigint[];
  currentAddress?: HexAddress;
  arbiter?: HexAddress;
  isLoading: boolean;
  progress: number;
  error: string | null;
};

export const OrderList = ({ orderIds, currentAddress, arbiter, isLoading, progress, error }: OrderListProps) => {
  if (error) {
    return (
      <div className="alert alert-error">
        <span>读取订单失败：{error}</span>
      </div>
    );
  }

  if (isLoading && orderIds.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="font-semibold">正在从 OrderCreated 事件重建订单列表…</p>
          <p className="text-sm opacity-70">POTOS 每次只能扫 10 个区块，首次加载需要一点时间（{progress}%）</p>
          <progress className="progress progress-primary w-full max-w-md" value={progress} max={100}></progress>
        </div>
      </div>
    );
  }

  if (orderIds.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <p className="text-lg font-semibold">还没有订单</p>
          <p className="text-sm opacity-70">在左侧表单创建第一笔托管订单</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orderIds.map(id => (
        <OrderRow key={id.toString()} orderId={id} currentAddress={currentAddress} arbiter={arbiter} />
      ))}
    </div>
  );
};
