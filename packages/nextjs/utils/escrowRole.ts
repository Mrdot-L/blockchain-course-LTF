import type { EscrowOrderView, HexAddress, Role } from "~~/components/escrow/types";

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export const getOrderRole = (order: EscrowOrderView | undefined, address?: HexAddress, arbiter?: HexAddress): Role => {
  if (!address) return "visitor";
  if (same(address, arbiter)) return "arbiter";
  if (!order) return "visitor";
  if (same(address, order.buyer)) return "buyer";
  if (same(address, order.seller)) return "seller";
  return "visitor";
};

export const getOverallRoles = (
  orders: Array<{ buyer: HexAddress; seller: HexAddress }>,
  address?: HexAddress,
  arbiter?: HexAddress,
): Role[] => {
  if (!address) return ["visitor"];
  if (same(address, arbiter)) return ["arbiter"];

  const roles = new Set<Role>();
  orders.forEach(order => {
    if (same(address, order.buyer)) roles.add("buyer");
    if (same(address, order.seller)) roles.add("seller");
  });

  return roles.size > 0 ? [...roles] : ["visitor"];
};
