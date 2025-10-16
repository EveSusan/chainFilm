import { ethers } from "ethers";
import { RelayerSDKLoader } from "./RelayerSDKLoader";

export type FhevmInstance = any;

export async function createFhevmInstance(parameters: {
  provider: any;
  chainId?: number;
}): Promise<FhevmInstance> {
  const { provider, chainId } = parameters;

  // detect hardhat mock
  const isLocal = chainId === 31337;
  if (isLocal) {
    // dynamic import mock
    const mod = await import("./mock/fhevmMock");
    const rpcUrl = "http://localhost:8545";
    const metadata = await tryFetchRelayerMetadata(rpcUrl);
    if (!metadata) throw new Error("FHEVM mock metadata not available");
    return mod.fhevmMockCreateInstance({ rpcUrl, chainId: 31337, metadata });
  }

  // load UMD
  const loader = new RelayerSDKLoader();
  await loader.load();
  const relayerSDK = (window as any).relayerSDK;
  await relayerSDK.initSDK();

  const config = { ...relayerSDK.SepoliaConfig, network: (window as any).ethereum };
  // try cache-less create
  const instance = await relayerSDK.createInstance(config);
  return instance;
}

async function tryFetchRelayerMetadata(rpcUrl: string): Promise<{
  ACLAddress: `0x${string}`;
  InputVerifierAddress: `0x${string}`;
  KMSVerifierAddress: `0x${string}`;
} | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "fhevm_relayer_metadata", params: [] })
    });
    const json = await res.json();
    return json?.result ?? null;
  } catch {
    return null;
  }
}






