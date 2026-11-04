"use client";

import { useState } from "react";
import type { OrderActionProps } from "~~/components/escrow/types";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const errorMessage = (e: any) => e?.shortMessage ?? e?.message ?? "交易失败";

export const PaymentButton = ({ orderId, order }: OrderActionProps) => {
  const [step, setStep] = useState<"idle" | "approve" | "deposit">("idle");
  const [error, setError] = useState<string | null>(null);

  const { data: escrowInfo } = useDeployedContractInfo({ contractName: "Escrow" });
  const { writeContractAsync: writeToken } = useScaffoldWriteContract({ contractName: "LTFToken" });
  const { writeContractAsync: writeEscrow } = useScaffoldWriteContract({ contractName: "Escrow" });

  const busy = step !== "idle";

  const pay = async () => {
    if (!escrowInfo?.address) {
      setError("找不到 Escrow 合约地址");
      return;
    }

    setError(null);
    try {
      // 第一步：approve，等到交易回执
      setStep("approve");
      await writeToken({
        functionName: "approve",
        args: [escrowInfo.address, order.amount],
      });

      // 第二步：approve 确认后再 deposit，避免 allowance 不足
      setStep("deposit");
      await writeEscrow({
        functionName: "deposit",
        args: [orderId],
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setStep("idle");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button className="btn btn-primary btn-sm" onClick={pay} disabled={busy}>
        {step === "approve" ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            等待 approve 确认…
          </>
        ) : step === "deposit" ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
            正在 deposit…
          </>
        ) : (
          "批准并付款"
        )}
      </button>
      {error ? <span className="text-xs text-error max-w-xs text-right">{error}</span> : null}
    </div>
  );
};
