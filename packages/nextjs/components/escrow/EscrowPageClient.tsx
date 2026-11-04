"use client";

import { useAccount } from "wagmi";
import { CreateOrderForm } from "~~/components/escrow/CreateOrderForm";
import { OrderList } from "~~/components/escrow/OrderList";
import { RoleBadge } from "~~/components/escrow/RoleBadge";
import type { HexAddress } from "~~/components/escrow/types";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useEscrowOrders } from "~~/hooks/useEscrowOrders";
import { getOverallRoles } from "~~/utils/escrowRole";

export const EscrowPageClient = () => {
  const { address, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const { data: arbiter } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "arbiter",
  });

  const { orders, isLoading, progress, error, rescan } = useEscrowOrders();

  const roles = getOverallRoles(orders, address as HexAddress | undefined, arbiter as HexAddress | undefined);
  const orderIds = orders.map(order => order.id);
  const wrongNetwork = !!chain && chain.id !== targetNetwork.id;

  return (
    <div className="flex flex-col grow px-4 py-8 gap-6 w-full max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold m-0">托管交易 Escrow</h1>
          <p className="text-sm opacity-70 mt-1">
            买家创建订单并把 LTFToken 托管进合约，确认收货后放款给卖家；有争议时由仲裁人裁决。
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="opacity-60">当前账户</span>
            {address ? <Address address={address} size="sm" /> : <span className="badge badge-warning">未连接</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-60">我的角色</span>
            <RoleBadge roles={roles} compact />
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-60">仲裁人</span>
            <Address address={arbiter} size="xs" />
          </div>
          <span className="text-xs opacity-50">
            网络：{targetNetwork.name}（chainId {targetNetwork.id}）
          </span>
        </div>
      </header>

      {wrongNetwork ? (
        <div className="alert alert-warning">
          <span>钱包连接的网络不是 {targetNetwork.name}，请先在 MetaMask 中切换网络。</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CreateOrderForm disabled={!address} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              订单列表
              <span className="ml-2 badge badge-ghost badge-sm">{orderIds.length} 笔</span>
            </h2>
            <button className="btn btn-ghost btn-xs" onClick={() => rescan()} disabled={isLoading}>
              {isLoading ? <span className="loading loading-spinner loading-xs"></span> : null}
              刷新事件
            </button>
          </div>

          <OrderList
            orderIds={orderIds}
            currentAddress={address as HexAddress | undefined}
            arbiter={arbiter as HexAddress | undefined}
            isLoading={isLoading}
            progress={progress}
            error={error}
          />
        </div>
      </div>

      <footer className="text-xs opacity-60 border-t border-base-300 pt-4">
        订单列表来自链上 OrderCreated 事件，按区块与日志顺序排列；每行状态通过 getOrder 实时读取。
      </footer>
    </div>
  );
};
