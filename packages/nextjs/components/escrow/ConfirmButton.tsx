"use client";

import { useState } from "react";
import type { OrderActionProps } from "~~/components/escrow/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const errorMessage = (e: any) => e?.shortMessage ?? e?.message ?? "交易失败";

export const ConfirmButton = ({ orderId }: OrderActionProps) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "Escrow" });

  const confirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await writeContractAsync({ functionName: "confirm", args: [orderId] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button className="btn btn-success btn-sm" onClick={confirm} disabled={busy}>
        {busy ? <span className="loading loading-spinner loading-xs"></span> : null}
        确认收货
      </button>
      {error ? <span className="text-xs text-error max-w-xs text-right">{error}</span> : null}
    </div>
  );
};
