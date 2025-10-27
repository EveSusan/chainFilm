import * as fs from "fs";
import * as path from "path";

const CONTRACTS = ["FilmRegistry", "RightsNFT", "RevenueManager", "LicenseManager"]; 
const rel = "../chainfilm-hardhat"; // sibling hardhat project
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

const dir = path.resolve(rel);
const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  if (!fs.existsSync(chainDeploymentDir)) return undefined;
  const jsonString = fs.readFileSync(path.join(chainDeploymentDir, `${contractName}.json`), "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  return obj;
}

const localhost = Object.fromEntries(CONTRACTS.map(name => [name, readDeployment("localhost", 31337, name)]));
const sepolia   = Object.fromEntries(CONTRACTS.map(name => [name, readDeployment("sepolia", 11155111, name)]));

for (const name of CONTRACTS) {
  const loc = localhost[name];
  const sep = sepolia[name];
  if (!loc && !sep) continue;
  const abi = (loc?.abi || sep?.abi);
  const addresses = {
    "11155111": { address: sep?.address || "0x0000000000000000000000000000000000000000", chainId: 11155111, chainName: "sepolia" },
    "31337": { address: loc?.address || "0x0000000000000000000000000000000000000000", chainId: 31337, chainName: "hardhat" }
  };

  const abiTs = `export const ${name}ABI = ${JSON.stringify({ abi }, null, 2)} as const;\n`;
  const addrTs = `export const ${name}Addresses = ${JSON.stringify(addresses, null, 2)} as const;\n`;

  fs.writeFileSync(path.join(outdir, `${name}ABI.ts`), `/* auto-generated */\n${abiTs}`, "utf-8");
  fs.writeFileSync(path.join(outdir, `${name}Addresses.ts`), `/* auto-generated */\n${addrTs}`, "utf-8");
  console.log(`Generated ${name} ABI & Addresses`);
}





