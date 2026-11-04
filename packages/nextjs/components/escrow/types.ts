export type HexAddress = `0x${string}`;

export type EscrowOrderView = {
  id: bigint;
  buyer: HexAddress;
  seller: HexAddress;
  token: HexAddress;
  amount: bigint;
  deadline: bigint;
  status: number;
  description: string;
};

export type Role = "buyer" | "seller" | "arbiter" | "visitor";

export type OrderActionProps = {
  orderId: bigint;
  order: EscrowOrderView;
  currentAddress?: HexAddress;
  arbiter?: HexAddress;
};
