"use client";

import { FormEvent, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const errorMessage = (e: any) => e?.shortMessage ?? e?.message ?? "交易失败";

export const CreateOrderForm = ({ disabled }: { disabled?: boolean }) => {
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("30");
  const [minutes, setMinutes] = useState("30");
  const [description, setDescription] = useState("实验3订单");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: tokenInfo } = useDeployedContractInfo({ contractName: "LTFToken" });
  const { data: escrowInfo } = useDeployedContractInfo({ contractName: "Escrow" });
  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "Escrow" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAddress(seller)) {
      setError("卖家地址格式不正确");
      return;
    }
    if (!tokenInfo?.address) {
      setError("找不到 LTFToken 合约地址");
      return;
    }

    let amountWei: bigint;
    try {
      amountWei = parseUnits(amount, 18);
    } catch {
      setError("金额格式不正确");
      return;
    }
    if (amountWei <= 0n) {
      setError("金额必须大于 0");
      return;
    }

    const minutesNumber = Number(minutes);
    if (!Number.isFinite(minutesNumber) || minutesNumber <= 0) {
      setError("到期时间必须是大于 0 的分钟数");
      return;
    }

    // 页面填的是分钟数，链上要的是秒级 Unix 时间戳
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Math.floor(minutesNumber * 60));

    setBusy(true);
    try {
      await writeContractAsync({
        functionName: "createOrder",
        args: [seller as `0x${string}`, tokenInfo.address, amountWei, deadline, description.trim()],
      });
      setSuccess(`订单已创建：${amount} LTF，${minutes} 分钟后到期`);
      setDescription("实验3订单");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">创建托管订单</h2>
        <p className="text-xs opacity-60">
          托管合约 <Address address={escrowInfo?.address} size="xs" />
          ，结算代币 <Address address={tokenInfo?.address} size="xs" />
        </p>

        <form className="flex flex-col gap-3 mt-2" onSubmit={submit}>
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">卖家地址</span>
            </div>
            <input
              className="input input-bordered w-full font-mono text-sm"
              placeholder="0x..."
              value={seller}
              onChange={e => setSeller(e.target.value.trim())}
              disabled={busy || disabled}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">金额（LTF）</span>
              </div>
              <input
                className="input input-bordered w-full"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={busy || disabled}
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">多少分钟后到期</span>
              </div>
              <input
                className="input input-bordered w-full"
                type="number"
                min="1"
                step="1"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                disabled={busy || disabled}
              />
            </label>
          </div>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">描述</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={busy || disabled}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={busy || disabled}>
            {busy ? <span className="loading loading-spinner loading-sm"></span> : null}
            创建订单
          </button>
        </form>

        {error ? <div className="alert alert-error text-sm mt-2">{error}</div> : null}
        {success ? <div className="alert alert-success text-sm mt-2">{success}</div> : null}
      </div>
    </div>
  );
};
