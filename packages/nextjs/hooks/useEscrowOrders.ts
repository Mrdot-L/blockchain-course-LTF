"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeEventLog } from "viem";
import { useBlockNumber, usePublicClient } from "wagmi";
import { useDeployedContractInfo, useSelectedNetwork } from "~~/hooks/scaffold-eth";

/**
 * Escrow 在 POTOS 测试网上的部署区块。
 * POTOS 的 eth_getLogs 一次只能扫 10 个区块，这里按 10 块一批并发查询。
 */
export const ESCROW_DEPLOY_BLOCK = 2_673_020n;
const BLOCKS_BATCH_SIZE = 10n;
const CONCURRENCY = 20;
const CACHE_KEY = "escrow-orders-v1";

export type EscrowOrderCreatedEvent = {
  id: bigint;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: string;
};

export function useEscrowOrders() {
  const selectedNetwork = useSelectedNetwork();
  const publicClient = usePublicClient({ chainId: selectedNetwork.id });
  const { data: deployed } = useDeployedContractInfo({ contractName: "Escrow" });
  const { data: latestBlock } = useBlockNumber({ watch: true, chainId: selectedNetwork.id });

  // 首次加载会把 10 万级区块按 10 块一批扫完，用 sessionStorage 缓存，
  // 避免验收演示时每次刷新都重新扫描。缓存与当前 Escrow 部署绑定。
  const [cached] = useState<{ orders?: any[]; lastScanned?: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState<EscrowOrderCreatedEvent[]>(() =>
    (cached?.orders ?? []).map((item: any) => ({
      id: BigInt(item.id),
      buyer: item.buyer,
      seller: item.seller,
      blockNumber: BigInt(item.blockNumber),
      logIndex: Number(item.logIndex),
      transactionHash: item.transactionHash,
    })),
  );
  const [isLoading, setIsLoading] = useState(!cached);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ordersRef = useRef<EscrowOrderCreatedEvent[]>(orders);
  const latestBlockRef = useRef<bigint | null>(null);
  const lastScannedRef = useRef<bigint | null>(cached?.lastScanned ? BigInt(cached.lastScanned) : null);
  const scanningRef = useRef(false);
  const mountedRef = useRef(true);

  latestBlockRef.current = latestBlock === undefined ? null : BigInt(latestBlock);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const scan = useCallback(async () => {
    if (!publicClient || !deployed?.address || !deployed?.abi || latestBlockRef.current === null) return;
    if (scanningRef.current) return;

    scanningRef.current = true;
    setError(null);

    try {
      // 扫到当前最新块；如果扫描期间又出了新块，循环再补一次增量
      while (true) {
        const latest = latestBlockRef.current;
        if (latest === null) break;

        const start = lastScannedRef.current === null ? ESCROW_DEPLOY_BLOCK : lastScannedRef.current + 1n;
        if (start > latest) break;

        const batches: { from: bigint; to: bigint }[] = [];
        for (let from = start; from <= latest; from += BLOCKS_BATCH_SIZE) {
          const to = from + BLOCKS_BATCH_SIZE - 1n;
          batches.push({ from, to: to > latest ? latest : to });
        }

        const found: EscrowOrderCreatedEvent[] = [];
        let done = 0;

        for (let i = 0; i < batches.length; i += CONCURRENCY) {
          const chunk = batches.slice(i, i + CONCURRENCY);
          const logsByBatch = await Promise.all(
            chunk.map(batch =>
              publicClient
                .getLogs({
                  address: deployed.address,
                  fromBlock: batch.from,
                  toBlock: batch.to,
                })
                .catch(() => []),
            ),
          );

          logsByBatch.forEach(logs => {
            logs.forEach(log => {
              try {
                const decoded = decodeEventLog({
                  abi: deployed.abi as any,
                  data: log.data,
                  topics: log.topics as any,
                }) as any;

                if (decoded.eventName !== "OrderCreated") return;

                found.push({
                  id: BigInt(decoded.args.id),
                  buyer: decoded.args.buyer,
                  seller: decoded.args.seller,
                  blockNumber: BigInt(log.blockNumber ?? 0n),
                  logIndex: Number(log.logIndex ?? 0),
                  transactionHash: log.transactionHash,
                });
              } catch {
                // 非 OrderCreated 事件或 ABI 解码失败，直接跳过
              }
            });
          });

          done += chunk.length;
          if (mountedRef.current && batches.length > 0) {
            setProgress(Math.round((done / batches.length) * 100));
          }
        }

        lastScannedRef.current = latest;

        const mergedOrders = (() => {
          const merged = new Map<string, EscrowOrderCreatedEvent>();
          [...ordersRef.current, ...found].forEach(item => {
            merged.set(`${item.transactionHash}-${item.logIndex}`, item);
          });
          return [...merged.values()].sort((a, b) =>
            a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1,
          );
        })();

        ordersRef.current = mergedOrders;

        if (mountedRef.current) {
          setOrders(mergedOrders);
          try {
            window.sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                orders: mergedOrders.map(item => ({
                  ...item,
                  id: item.id.toString(),
                  blockNumber: item.blockNumber.toString(),
                })),
                lastScanned: latest.toString(),
              }),
            );
          } catch {
            // sessionStorage 不可用时忽略
          }
        }

        if (latestBlockRef.current === null || latestBlockRef.current <= lastScannedRef.current) break;
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.shortMessage ?? e?.message ?? "读取 OrderCreated 事件失败");
      }
    } finally {
      scanningRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }, [publicClient, deployed?.address, deployed?.abi]);

  useEffect(() => {
    scan();
  }, [scan, latestBlock]);

  return { orders, isLoading, progress, error, rescan: scan };
}
