"use client";

import { formatUnits } from "viem";
import { ConfirmButton } from "~~/components/escrow/ConfirmButton";
import { DisputeButton } from "~~/components/escrow/DisputeButton";
import { PaymentButton } from "~~/components/escrow/PaymentButton";
import { ResolveButton } from "~~/components/escrow/ResolveButton";
import { RoleBadge } from "~~/components/escrow/RoleBadge";
import type { EscrowOrderView, HexAddress } from "~~/components/escrow/types";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getOrderRole } from "~~/utils/escrowRole";
import { escrowStatusDescription, escrowStatusLabel } from "~~/utils/escrowStatus";

const STATUS_BADGE: Record<number, string> = {
  0: "badge-info",
  1: "badge-warning",
  2: "badge-success",
  3: "badge-neutral",
  4: "badge-error",
};

const formatDeadline = (deadline: bigint) => {
  const seconds = Number(deadline);
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  return `${new Date(seconds * 1000).toISOString().slice(0, 19).replace("T", " ")} UTC`;
};

const normalizeOrder = (raw: any, id: bigint): EscrowOrderView | undefined => {
  if (!raw) return undefined;
  return {
    id,
    buyer: (raw.buyer ?? raw[0]) as HexAddress,
    seller: (raw.seller ?? raw[1]) as HexAddress,
    token: (raw.token ?? raw[2]) as HexAddress,
    amount: BigInt(raw.amount ?? raw[3] ?? 0n),
    deadline: BigInt(raw.deadline ?? raw[4] ?? 0n),
    status: Number(raw.status ?? raw[5] ?? 0),
    description: String(raw.description ?? raw[6] ?? ""),
  };
};

type OrderRowProps = {
  orderId: bigint;
  currentAddress?: HexAddress;
  arbiter?: HexAddress;
};

export const OrderRow = ({ orderId, currentAddress, arbiter }: OrderRowProps) => {
  const { data: rawOrder } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "getOrder",
    args: [orderId],
  });

  const order = normalizeOrder(rawOrder, orderId);
  const role = getOrderRole(order, currentAddress, arbiter);
  const isBuyer = role === "buyer";
  const isParty = role === "buyer" || role === "seller";
  const isArbiter = role === "arbiter";

  if (!order) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="skeleton h-6 w-40"></div>
          <div className="skeleton h-20 w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="card-title text-lg">订单 #{order.id.toString()}</h2>
            <span className={`badge ${STATUS_BADGE[order.status] ?? "badge-neutral"}`}>
              {escrowStatusLabel(order.status)}
            </span>
            <RoleBadge roles={[role]} compact />
          </div>
          <span className="text-xs opacity-60">{escrowStatusDescription(order.status)}</span>
        </div>

        {order.description ? <p className="text-sm opacity-80">备注：{order.description}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="opacity-60">买家</span>
            <Address address={order.buyer} size="sm" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="opacity-60">卖家</span>
            <Address address={order.seller} size="sm" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="opacity-60">金额</span>
            <span className="font-mono">{formatUnits(order.amount, 18)} LTF</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="opacity-60">截止时间</span>
            <span className="font-mono">{formatDeadline(order.deadline)}</span>
          </div>
        </div>

        <div className="card-actions justify-end mt-2">
          {order.status === 0 && isBuyer ? <PaymentButton orderId={order.id} order={order} /> : null}
          {order.status === 1 && isBuyer ? <ConfirmButton orderId={order.id} order={order} /> : null}
          {order.status === 1 && isParty ? <DisputeButton orderId={order.id} order={order} /> : null}
          {order.status === 4 && isArbiter ? <ResolveButton orderId={order.id} order={order} /> : null}
          {order.status === 0 && !isBuyer ? <span className="text-xs opacity-60">等待买家付款</span> : null}
          {order.status === 1 && !isParty && !isArbiter ? (
            <span className="text-xs opacity-60">等待买家确认收货或发起争议</span>
          ) : null}
          {order.status === 4 && !isArbiter ? <span className="text-xs opacity-60">等待仲裁人裁决</span> : null}
        </div>
      </div>
    </div>
  );
};
