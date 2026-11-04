"use client";

import { useState } from "react";
import type { OrderActionProps } from "~~/components/escrow/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const errorMessage = (e: any) => e?.shortMessage ?? e?.message ?? "交易失败";

export const ResolveButton = ({ orderId }: OrderActionProps) => {
  const [busy, setBusy] = useState<"seller" | "buyer" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "Escrow" });

  const resolve = async (sellerWins: boolean) => {
    setError(null);
    setBusy(sellerWins ? "seller" : "buyer");
    try {
      await writeContractAsync({ functionName: "resolve", args: [orderId, sellerWins] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-success btn-sm" onClick={() => resolve(true)} disabled={busy !== null}>
          {busy === "seller" ? <span className="loading loading-spinner loading-xs"></span> : null}
          判给卖家
        </button>
        <button className="btn btn-warning btn-sm" onClick={() => resolve(false)} disabled={busy !== null}>
          {busy === "buyer" ? <span className="loading loading-spinner loading-xs"></span> : null}
          退给买家
        </button>
      </div>
      {error ? <span className="text-xs text-error max-w-xs text-right">{error}</span> : null}
    </div>
  );
};
