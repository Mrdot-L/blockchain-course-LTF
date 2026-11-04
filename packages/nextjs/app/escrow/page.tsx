import { EscrowPageClient } from "~~/components/escrow/EscrowPageClient";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "托管交易 Escrow",
  description: "路线 B：基于 Escrow 合约的托管交易页面",
});

const EscrowPage = () => {
  return <EscrowPageClient />;
};

export default EscrowPage;
