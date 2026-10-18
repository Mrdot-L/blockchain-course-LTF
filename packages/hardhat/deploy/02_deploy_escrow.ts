import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const ARBITER = "0xfdc6E5b9367449B4369003fb5B16ea0789013a26";
const deployEscrow: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  await hre.deployments.deploy("Escrow", { from: deployer, args: [ARBITER], log: true, autoMine: true });
};

export default deployEscrow;
deployEscrow.tags = ["EscrowLTF202430552557"];
