import { ethers } from "hardhat";

async function main() {
  const revenueAddr = process.env.REVENUE_ADDR || "0x45B310d2A84FedDd56277E619a12748007D9B9bD"; // last deployed
  const basePrice = process.env.BASE_PRICE_ETH || "0.001";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
  console.log("Revenue:", revenueAddr, "BasePrice:", basePrice, "ETH");

  const LicenseManager = await ethers.getContractFactory("LicenseManager");
  const latest = await ethers.provider.getBlock("latest");
  const base: bigint = latest?.baseFeePerGas ?? ethers.parseUnits("20", "gwei");
  const priority: bigint = ethers.parseUnits("1", "gwei");
  const maxFee: bigint = base + priority + ethers.parseUnits("1", "gwei");
  const overrides: any = {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priority,
  };

  const contract = await LicenseManager.deploy(
    revenueAddr,
    await deployer.getAddress(),
    ethers.parseEther(basePrice),
    overrides
  );
  await contract.waitForDeployment();
  console.log("LicenseManager deployed at", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


