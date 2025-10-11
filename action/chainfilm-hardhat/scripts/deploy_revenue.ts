import { ethers } from "hardhat";

async function main() {
  const registryAddr = process.env.REGISTRY_ADDR || "0x0Ae97E5b406D473581fE7773F340e26B0917EF8f"; // last deployed
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
  console.log("Registry:", registryAddr);

  const RevenueManager = await ethers.getContractFactory("RevenueManager");
  const latest = await ethers.provider.getBlock("latest");
  const base: bigint = latest?.baseFeePerGas ?? ethers.parseUnits("20", "gwei");
  const priority: bigint = ethers.parseUnits("1", "gwei");
  // 略高于当前 baseFee，避免 pending，但尽量控制成本
  const maxFee: bigint = base + priority + ethers.parseUnits("1", "gwei");
  const overrides: any = {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priority,
  };
  const contract = await RevenueManager.deploy(registryAddr, overrides);
  await contract.waitForDeployment();
  console.log("RevenueManager deployed at", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


