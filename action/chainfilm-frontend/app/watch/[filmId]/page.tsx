"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import { FilmRegistryABI } from "@/abi/FilmRegistryABI";
import { FilmRegistryAddresses } from "@/abi/FilmRegistryAddresses";
import { LicenseManagerABI } from "@/abi/LicenseManagerABI";
import { LicenseManagerAddresses } from "@/abi/LicenseManagerAddresses";

function getByChain<T extends { [k: string]: any }>(map: T, chainId?: number) {
  if (!chainId) return undefined;
  const entry = map[chainId.toString() as keyof T];
  if (!entry || !("address" in entry)) return undefined;
  return entry.address as `0x${string}`;
}

export default function PlayerPage() {
  const { filmId } = useParams<{ filmId: string }>();
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [chainId, setChainId] = useState<number>();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner>();
  const [account, setAccount] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [owner, setOwner] = useState<string>();
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !(window as any).ethereum) return;
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      const n = await p.getNetwork();
      setChainId(Number(n.chainId));
      await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      setSigner(s);
      setAccount(await s.getAddress());
    })();
  }, []);

  const addresses = useMemo(() => ({
    registry: getByChain(FilmRegistryAddresses, chainId),
    license: getByChain(LicenseManagerAddresses, chainId)
  }), [chainId]);

  useEffect(() => {
    const run = async () => {
      if (!provider || !addresses.registry || !addresses.license || !account) return;
      try {
        setLoading(true);
        setMessage("正在读取作品信息...");
        const registry = new ethers.Contract(addresses.registry, FilmRegistryABI.abi, provider);
        const lic = new ethers.Contract(addresses.license, LicenseManagerABI.abi, provider);
        const f = await registry.films(Number(filmId));
        setOwner(f.owner);

        // 许可检查
        const ok = await lic.getLicenseStatus(Number(filmId), account);
        setAuthorized(ok || f.owner.toLowerCase() === account.toLowerCase());

        // 从 metadata 取视频 CID
        const cid = String(f.ipfsCidMeta || "");
        const url = `https://ipfs.io/ipfs/${cid}`;
        const meta = await fetch(url).then(r => r.json());
        const v = String(meta?.video || "");
        const final = v.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${v.slice(7)}` : v;
        setVideoUrl(final);
        setMessage("");
      } catch (e: any) {
        setMessage("读取失败: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [provider, addresses.registry, addresses.license, account, filmId]);

  const purchase = async () => {
    if (!signer || !addresses.license) return;
    try {
      setLoading(true);
      setMessage("正在购买授权...");
      const lic = new ethers.Contract(addresses.license, LicenseManagerABI.abi, signer);
      const tx = await lic.purchaseLicense(Number(filmId), { value: ethers.parseEther("0.001") });
      await tx.wait();
      setAuthorized(true);
      setMessage("购买成功");
    } catch (e: any) {
      setMessage("购买失败: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      <h2 style={{ fontSize: 28, marginBottom: 20 }}>影片播放</h2>
      {message && <div style={{ marginBottom: 16, color: '#aaa' }}>{message}</div>}

      {loading ? (
        <div>加载中...</div>
      ) : authorized ? (
        videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border-color)' }}
          />
        ) : (
          <div>无法读取视频链接</div>
        )
      ) : (
        <div style={{
          padding: 24,
          border: '1px solid var(--border-color)',
          borderRadius: 12
        }}>
          <div style={{ marginBottom: 12 }}>尚未获得该影片的播放授权</div>
          <button className="btn-primary" onClick={purchase}>购买授权并播放</button>
        </div>
      )}
    </div>
  );
}






