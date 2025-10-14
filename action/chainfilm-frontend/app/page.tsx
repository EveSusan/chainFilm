"use client";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { FilmRegistryABI } from "@/abi/FilmRegistryABI";
import { FilmRegistryAddresses } from "@/abi/FilmRegistryAddresses";
import { LicenseManagerABI } from "@/abi/LicenseManagerABI";
import { LicenseManagerAddresses } from "@/abi/LicenseManagerAddresses";
import { RevenueManagerABI } from "@/abi/RevenueManagerABI";
import { RevenueManagerAddresses } from "@/abi/RevenueManagerAddresses";
import { useFhevm } from "@/fhevm/useFhevm";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FilmCard from "@/components/FilmCard";

function getByChain<T extends { [k: string]: any }>(map: T, chainId?: number) {
  if (!chainId) return undefined;
  const entry = map[chainId.toString() as keyof T];
  if (!entry || !("address" in entry)) return undefined;
  return entry.address as `0x${string}`;
}

export default function HomePage() {
  const [provider, setProvider] = useState<any>();
  const [eip1193, setEip1193] = useState<any>();
  const [chainId, setChainId] = useState<number>();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner>();
  const [account, setAccount] = useState<string>();
  const [activeTab, setActiveTab] = useState<'explore' | 'register' | 'dashboard'>('explore');

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setEip1193((window as any).ethereum);
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      p.getNetwork().then(n => setChainId(Number(n.chainId)));
      p.send("eth_requestAccounts", []).then(async () => {
        const s = await p.getSigner();
        setSigner(s);
        setAccount(await s.getAddress());
      });
      (window as any).ethereum.on?.("chainChanged", () => window.location.reload());
      (window as any).ethereum.on?.("accountsChanged", () => window.location.reload());
    }
  }, []);

  const { instance, status, error } = useFhevm({
    provider: eip1193,
    chainId,
    // 强制走 Sepolia Relayer SDK 路径，避免误触发本地 Mock
    initialMockChains: {},
    enabled: Boolean(eip1193)
  });

  const addresses = useMemo(() => ({
    registry: getByChain(FilmRegistryAddresses, chainId),
    license: getByChain(LicenseManagerAddresses, chainId),
    revenue: getByChain(RevenueManagerAddresses, chainId)
  }), [chainId]);

  const [title, setTitle] = useState("");
  const [metaCid, setMetaCid] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [hashUintStr, setHashUintStr] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [filmId, setFilmId] = useState<number>();
  const [balanceHandle, setBalanceHandle] = useState<string | undefined>(undefined);
  const [clearBalance, setClearBalance] = useState<string | undefined>(undefined);
  const [myFilms, setMyFilms] = useState<Array<{ filmId: number; title: string; ipfsCidMeta: string; createdAt: bigint; owner?: string }>>([]);
  const [exploreFilms, setExploreFilms] = useState<Array<{ filmId: number; title: string; owner: string }>>([]);
  const [licensePrice, setLicensePrice] = useState<string>("0.001");
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [licensedCount, setLicensedCount] = useState<number>(0);
  const [earningBalance, setEarningBalance] = useState<string>("0");
  const [withdrawFilmId, setWithdrawFilmId] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // 选择视频后，立即计算 SHA-256 并填入
  const onSelectVideo = async (file: File | null) => {
    setVideoFile(file);
    if (!file) {
      setHashUintStr("");
      return;
    }
    try {
      setLoading(true);
      setMessage('🧮 正在计算视频哈希...');
      const ab = await file.arrayBuffer();
      const buf = await crypto.subtle.digest('SHA-256', ab);
      const hex = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const uintStr = BigInt('0x' + hex).toString();
      setHashUintStr(uintStr);
      setMessage('✅ 已计算视频哈希');
    } catch (e:any) {
      setMessage('❌ 哈希计算失败: ' + e.message);
      setHashUintStr("");
    } finally {
      setLoading(false);
    }
  };

  const normalizeCid = (value: string) => {
    if (!value) return "";
    let s = value.trim();
    if (s.startsWith("ipfs://")) s = s.slice(7);
    s = s.replace(/^https?:\/\/[^/]+\/ipfs\//, "");
    s = s.replace(/^\/ipfs\//, "");
    return s;
  };

  const looksLikeCid = (value: string) => {
    const s = normalizeCid(value);
    return s.length > 30 && /^[a-zA-Z0-9]+$/.test(s);
  };

  const register = async () => {
    if (!instance || !signer || !addresses.registry || !account) return;
    if (!videoFile) { setMessage('请选择视频文件'); return; }
    setLoading(true);
    setMessage("📦 正在上传视频到 Pinata...");
    try {
      // 1) 上传视频
      const fd = new FormData();
      fd.append('file', videoFile);
      const up = await fetch('/api/pinata/upload', { method: 'POST', body: fd });
      if (!up.ok) throw new Error(await up.text());
      const upJson = await up.json();
      const videoCid = upJson.cid as string;

      // 2) 计算视频哈希
      setMessage('🧮 正在计算视频哈希...');
      const ab = await videoFile.arrayBuffer();
      const buf = await crypto.subtle.digest('SHA-256', ab);
      const hex = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const uintStr = BigInt('0x' + hex).toString();
      setHashUintStr(uintStr);

      // 3) 生成 metadata.json 并 pin
      setMessage('🧾 生成元数据并 Pin...');
      const meta = {
        title,
        description: 'Uploaded via ChainFilm',
        video: `ipfs://${videoCid}`,
        timestamp: Math.floor(Date.now()/1000)
      };
      const pj = await fetch('/api/pinata/pinjson', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meta) });
      if (!pj.ok) throw new Error(await pj.text());
      const pjJson = await pj.json();
      const normalizedCid = pjJson.cid as string; // use metadata cid

      // 4) 上链
      setMessage('🔐 正在加密影片信息并上链...');
      const input = instance.createEncryptedInput(addresses.registry, account);
      input.add256(BigInt(uintStr));
      const enc = await input.encrypt();
      const contract = new ethers.Contract(addresses.registry, FilmRegistryABI.abi, signer);
      const tx = await contract.registerFilm(title, normalizedCid, enc.handles[0], enc.inputProof, [account], [10000]);
      setMessage("⏳ 等待交易确认...");
      const rc = await tx.wait();
      setMessage("✅ 影片注册成功！");
      try {
        const l = await signer.provider!.getLogs({ address: addresses.registry, fromBlock: rc!.blockNumber, toBlock: rc!.blockNumber });
        const fid = Number(l[0]?.topics[1]);
        setFilmId(fid);
        setMessage(`✅ 影片已注册，FilmID: ${fid}`);
      } catch {}
      setTitle("");
      setMetaCid("");
      setHashUintStr("");
    } catch (e: any) {
      setMessage(`❌ 注册失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const purchase = async (fid: number) => {
    if (!signer || !addresses.license || !addresses.registry) return;
    setLoading(true);
    setMessage("💳 正在购买授权...");
    try {
      const lic = new ethers.Contract(addresses.license, LicenseManagerABI.abi, signer);
      const reg = new ethers.Contract(addresses.registry, FilmRegistryABI.abi, signer);

      // 1) 预检作品是否存在
      const f = await reg.films(fid);
      if (!f || !f.exists) {
        setMessage(`❌ 购买失败：作品 #${fid} 不存在`);
        setLoading(false);
        return;
      }

      // 2) 读取价格（避免与合约配置不一致）
      const price: bigint = (await lic.basePriceWei?.().catch(() => null)) ?? ethers.parseEther("0.001");
      setLicensePrice(ethers.formatEther(price));

      // 3) 先做静态调用，拿到更清晰的 revert 原因
      try {
        await lic.purchaseLicense.staticCall(fid, { value: price });
      } catch (err: any) {
        const msg = String(err?.reason || err?.shortMessage || err?.message || 'unknown error');
        // 某些 Sepolia 节点在 staticCall/estimateGas 不返回 revert 数据
        // 如果只是 "missing revert data"，继续尝试直接发送交易
        if (!/missing revert data/i.test(msg)) {
          setMessage(`❌ 购买前检查失败: ${msg}`);
          setLoading(false);
          return;
        }
      }

      // 4) 正式发送交易
      // 4) 估算 gas；如果节点不给出原因，设置一个保守的 gasLimit 以避免 estimateGas 报错
      let gasLimit: bigint | undefined = undefined;
      try {
        gasLimit = await lic.purchaseLicense.estimateGas(fid, { value: price });
      } catch {}
      const tx = await lic.purchaseLicense(fid, { value: price, gasLimit: gasLimit ?? 300000n });
      setMessage("⏳ 等待交易确认...");
      await tx.wait();
      setMessage(`✅ 授权购买成功！FilmID: ${fid}`);
      // 购买成功后建议跳转到播放页
      window.open(`/watch/${fid}`, '_blank');
    } catch (e: any) {
      setMessage(`❌ 购买失败: ${e?.reason || e?.shortMessage || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEncBalance = async () => {
    if (!provider || !addresses.revenue || !filmId || !account) return;
    setLoading(true);
    setMessage("📡 读取加密余额句柄...");
    try {
      const ro = new ethers.Contract(addresses.revenue, RevenueManagerABI.abi, provider);
      const handle = await ro.getBalanceHandle(filmId, account);
      setBalanceHandle(handle);
      setMessage(`✅ 已获取加密余额句柄`);
    } catch (e: any) {
      setMessage(`❌ 读取失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const decryptBalance = async () => {
    if (!instance || !addresses.revenue || !balanceHandle || !signer || !account) return;
    setLoading(true);
    setMessage("🔓 正在解密余额...");
    try {
      const kp = instance.generateKeypair();
      const eip = instance.createEIP712(kp.publicKey, [addresses.revenue], Math.floor(Date.now()/1000), 365);
      const sig = await signer.signTypedData(eip.domain, { UserDecryptRequestVerification: eip.types.UserDecryptRequestVerification }, eip.message);
      const res = await instance.userDecrypt(
        [{ handle: balanceHandle, contractAddress: addresses.revenue }],
        kp.privateKey,
        kp.publicKey,
        sig,
        [addresses.revenue],
        account as `0x${string}`,
        eip.message.startTimestamp,
        365
      );
      const bal = String(res[balanceHandle]);
      setClearBalance(bal);
      setMessage(`✅ 解密成功！余额: ${ethers.formatEther(bal)} ETH`);
    } catch (e: any) {
      setMessage(`❌ 解密失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load "My Films" by reading FilmRegistered events and then fetching details
  useEffect(() => {
    const run = async () => {
      if (!provider || !addresses.registry || !account) return;
      try {
        const reg = new ethers.Contract(addresses.registry, FilmRegistryABI.abi, provider);
        // ethers v6: create filter by event name
        const filter = (reg as any).filters?.FilmRegistered?.(null, account) || {
          address: addresses.registry,
          topics: [ethers.id("FilmRegistered(uint256,address)"), null, ethers.zeroPadValue(account, 32)]
        };
        const logs = await (reg as any).queryFilter ? await (reg as any).queryFilter(filter, 0n, "latest") : await provider.getLogs({ fromBlock: 0n, toBlock: "latest", ...filter });

        const filmIds: number[] = [];
        for (const l of logs) {
          const parsed = (reg as any).interface?.parseLog ? (reg as any).interface.parseLog(l) : null;
          const fid = Number(parsed ? parsed.args[0] : BigInt(l.topics[1]));
          if (!filmIds.includes(fid)) filmIds.push(fid);
        }

        const results: Array<{ filmId: number; title: string; ipfsCidMeta: string; createdAt: bigint; owner?: string }> = [];
        for (const fid of filmIds) {
          try {
            const f = await reg.films(fid);
            // tuple: owner, title, ipfsCidMeta, <bytes>, collaborators, sharesBps, createdAt, exists
            if (f && f.exists) {
              results.push({ filmId: fid, title: String(f.title), ipfsCidMeta: String(f.ipfsCidMeta), createdAt: BigInt(f.createdAt), owner: String(f.owner) });
            }
          } catch {}
        }
        setMyFilms(results);
        setCreatedCount(results.length);
      } catch {}
    };
    run();
  }, [provider, addresses.registry, account]);

  // Load Explore films (all owners)
  useEffect(() => {
    const run = async () => {
      if (!provider || !addresses.registry) return;
      try {
        const reg = new ethers.Contract(addresses.registry, FilmRegistryABI.abi, provider);
        // read price from license manager if available
        if (addresses.license) {
          try {
            const lic = new ethers.Contract(addresses.license, LicenseManagerABI.abi, provider);
            const p = await (lic as any).basePriceWei?.();
            if (p) setLicensePrice(ethers.formatEther(p));
          } catch {}
        }
        const filter = (reg as any).filters?.FilmRegistered?.(null, null) || {
          address: addresses.registry,
          topics: [ethers.id("FilmRegistered(uint256,address)"), null, null]
        };
        const logs = await (reg as any).queryFilter ? await (reg as any).queryFilter(filter, 0n, "latest") : await provider.getLogs({ fromBlock: 0n, toBlock: "latest", ...filter });

        // Keep most recent 12
        const last = logs.slice(-12).reverse();
        const items: Array<{ filmId: number; title: string; owner: string }> = [];
        for (const l of last) {
          try {
            const parsed = (reg as any).interface?.parseLog ? (reg as any).interface.parseLog(l) : null;
            const fid = Number(parsed ? parsed.args[0] : BigInt(l.topics[1]));
            const f = await reg.films(fid);
            if (f && f.exists) {
              items.push({ filmId: fid, title: String(f.title), owner: String(f.owner) });
            }
          } catch {}
        }
        setExploreFilms(items);
      } catch {}
    };
    run();
  }, [provider, addresses.registry]);

  // Load licensed count (number of films you purchased)
  useEffect(() => {
    const run = async () => {
      if (!provider || !addresses.license || !account) return;
      try {
        const lic = new ethers.Contract(addresses.license, LicenseManagerABI.abi, provider);
        const filter = (lic as any).filters?.Purchased?.(null, account) || {
          address: addresses.license,
          topics: [ethers.id("Purchased(uint256,address,uint256)"), null, ethers.zeroPadValue(account, 32)]
        };
        const logs = await (lic as any).queryFilter ? await (lic as any).queryFilter(filter, 0n, "latest") : await provider.getLogs({ fromBlock: 0n, toBlock: "latest", ...filter });
        const filmSet = new Set<number>();
        for (const l of logs) {
          const parsed = (lic as any).interface?.parseLog ? (lic as any).interface.parseLog(l) : null;
          const fid = Number(parsed ? parsed.args[0] : BigInt(l.topics[1]));
          filmSet.add(fid);
        }
        setLicensedCount(filmSet.size);
      } catch {}
    };
    run();
  }, [provider, addresses.license, account]);

  // Load earning balance from RevenueManager (收益余额，可提现)
  useEffect(() => {
    const run = async () => {
      if (!provider || !addresses.revenue || !account) return;
      try {
        const minimalAbi = [
          'function getUserAvailable(address user) view returns (uint256)'
        ];
        const revenueReader = new ethers.Contract(
          addresses.revenue,
          minimalAbi,
          provider
        );
        const wei: bigint = await revenueReader.getUserAvailable(account);
        setEarningBalance(ethers.formatEther(wei));
      } catch {
        setEarningBalance("0");
      }
    };
    run();
  }, [provider, addresses.revenue, account]);

  const withdraw = async () => {
    if (!addresses.revenue || !signer) return;
    try {
      setMessage("⏳ 发起提现...");
      const abi = ['function withdraw(uint256 filmId, uint256 amountWei)'];
      const revenue = new ethers.Contract(addresses.revenue, abi, signer);
      const wei = ethers.parseEther(withdrawAmount || '0');
      const tx = await revenue.withdraw(withdrawFilmId, wei);
      await tx.wait();
      setMessage("✅ 提现完成");
    } catch (e: any) {
      setMessage(`❌ 提现失败: ${e?.shortMessage || e?.message}`);
    }
  };

  if (!account) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15), transparent 50%)',
      }}>
        <div style={{
          background: 'var(--gradient-gold)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 120,
          marginBottom: 32,
          animation: 'fadeIn 1s ease-out'
        }}>
          🎬
        </div>
        <h1 style={{ fontSize: 64, marginBottom: 16, fontWeight: 900 }}>
          <span className="gold-text">ChainFilm</span>
        </h1>
        <p style={{ fontSize: 20, color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 500, lineHeight: 1.6 }}>
          基于 FHEVM 的去中心化微电影版权系统<br/>
          每一帧影像，都值得被记录
        </p>
        <button 
          className="btn-primary" 
          style={{ fontSize: 18, padding: '18px 48px' }}
          onClick={() => {
            if ((window as any).ethereum) {
              (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            }
          }}
        >
          🔗 连接 MetaMask 钱包
        </button>
        <div style={{
          marginTop: 60,
          display: 'flex',
          gap: 40,
          color: 'var(--text-secondary)',
          fontSize: 14
        }}>
          <div>🔐 完全隐私</div>
          <div>⚡ 链上存证</div>
          <div>💰 自动分润</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
      
      <div style={{ marginLeft: 280, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar account={account} chainId={chainId} status={status} />

        <main style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
          {activeTab === 'explore' && (
            <div className="fade-in">
              {/* Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(10, 14, 26, 0.8))',
                borderRadius: 24,
                padding: '60px 48px',
                marginBottom: 48,
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontSize: 200,
                  opacity: 0.1,
                  transform: 'rotate(15deg)',
                  lineHeight: 1
                }}>
                  🎬
                </div>
                <h1 style={{ fontSize: 48, marginBottom: 16, fontWeight: 900, position: 'relative', zIndex: 1 }}>
                  探索<span className="gold-text">优质影片</span>
                </h1>
                <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, position: 'relative', zIndex: 1 }}>
                  链上版权保护，完全透明分润，每一次播放都有记录
                </p>
              </div>

              {/* Filter Bar */}
              <div style={{
                display: 'flex',
                gap: 16,
                marginBottom: 32,
                flexWrap: 'wrap'
              }}>
                {['🔥 热门', '⭐ 最新', '📊 评分最高', '👀 观看最多'].map(filter => (
                  <button
                    key={filter}
                    className="btn-secondary"
                    style={{ padding: '12px 24px' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Film Grid - from chain */}
              {exploreFilms.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>暂无上链影片，去“上传作品”发布你的第一部影片吧。</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 32 }}>
                  {exploreFilms.map((it) => (
                    <FilmCard
                      key={it.filmId}
                      title={it.title || `Film #${it.filmId}`}
                      author={it.owner.slice(0, 6) + '...' + it.owner.slice(-4)}
                      rating={8.0}
                      reviews={0}
                      onPurchase={() => purchase(it.filmId)}
                    />
                  ))}
                </div>
              )}
              <div style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 12 }}>
                当前链上授权价格：{licensePrice} ETH
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="fade-in">
              <h1 style={{ fontSize: 42, marginBottom: 48, fontWeight: 900 }}>
                上传<span className="gold-text">新作品</span>
              </h1>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 48 }}>
                {/* Form */}
                <div className="card" style={{ padding: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 12, 
                        fontWeight: 600,
                        fontSize: 15,
                        color: 'var(--text-primary)'
                      }}>
                        📝 影片标题
                      </label>
                      <input 
                        className="input-field" 
                        placeholder="给你的作品起个响亮的名字" 
                        value={title} 
                        onChange={e=>setTitle(e.target.value)}
                        style={{ fontSize: 16 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
                        📦 选择视频（自动上传到 Pinata 并生成元数据）
                      </label>
                      <input type="file" accept="video/*" className="input-field" style={{ padding: 10 }} onChange={(e)=>onSelectVideo(e.target.files?.[0] ?? null)} />
                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                        选择视频文件后，点击“立即注册上链”将自动上传并生成 metadata.json
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
                        🔐 视频哈希 (自动计算)
                      </label>
                      <input className="input-field" placeholder="选择视频后可自动计算，无需手填" value={hashUintStr} readOnly />
                      <div style={{
                        marginTop: 12,
                        padding: 16,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        fontFamily: 'monospace'
                      }}>
                        示例命令（可在终端手动计算，浏览器已自动计算）：
                        node -e "console.log(BigInt('0x'+require('crypto').createHash('sha256').update('video_content').digest('hex')))"
                      </div>
                    </div>

                    <button 
                      className="btn-primary" 
                      onClick={register} 
                      disabled={!addresses.registry || !instance || loading || !title || !videoFile}
                      style={{ 
                        fontSize: 17, 
                        padding: '18px 36px',
                        marginTop: 12
                      }}
                    >
                      {loading ? '⏳ 处理中...' : '📤 立即注册上链'}
                    </button>
                  </div>
                </div>

                {/* Info Panel */}
                <div>
                  <div className="card" style={{ marginBottom: 24, padding: 28 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 16, fontWeight: 700 }}>
                      🔐 隐私保护
                    </h3>
                    <ul style={{ 
                      listStyle: 'none', 
                      color: 'var(--text-secondary)', 
                      fontSize: 14,
                      lineHeight: 2
                    }}>
                      <li>✓ 视频哈希完全加密</li>
                      <li>✓ 只有创作者可解密</li>
                      <li>✓ 链上版权存证</li>
                      <li>✓ 防篡改保护</li>
                    </ul>
                  </div>

                  <div className="card" style={{ padding: 28 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 16, fontWeight: 700 }}>
                      💰 收益分润
                    </h3>
                    <div style={{ 
                      background: 'rgba(212, 175, 55, 0.1)',
                      borderRadius: 12,
                      padding: 20,
                      marginBottom: 16
                    }}>
                      <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
                        <span className="gold-text">100%</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        自动分配给创作者
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      每次授权购买后，收益会自动按设定比例分配给所有合作者
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="fade-in">
              <h1 style={{ fontSize: 42, marginBottom: 48, fontWeight: 900 }}>
                我的<span className="gold-text">资产</span>
              </h1>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                  <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
                    <span className="gold-text">{createdCount}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>创作影片</div>
                </div>
                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                  <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
                    <span className="gold-text">{licensedCount}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>持有授权</div>
                </div>
                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                  <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
                    <span className="gold-text">{Number(earningBalance).toFixed(3)}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>收益余额（可提现）</div>
                </div>
              </div>

              {/* Withdraw panel */}
              <div className="card" style={{ padding: 24, marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>提现到钱包</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                  <input className="input-field" placeholder="影片 Film ID" value={withdrawFilmId || ''} onChange={(e)=>setWithdrawFilmId(Number(e.target.value))} />
                  <input className="input-field" placeholder="提现金额(ETH)" value={withdrawAmount} onChange={(e)=>setWithdrawAmount(e.target.value)} />
                  <button className="btn-primary" onClick={withdraw}>提现</button>
                </div>
                <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>当前收益余额：{Number(earningBalance).toFixed(6)} ETH</div>
              </div>

              {/* Balance Query */}
              <div className="card" style={{ padding: 40, marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, marginBottom: 28, fontWeight: 700 }}>
                  💰 收益查询与解密
                </h2>
                
                <div style={{ display: 'grid', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
                    <input 
                      className="input-field" 
                      placeholder="输入 Film ID 查询收益" 
                      value={filmId ?? ""} 
                      onChange={e=>setFilmId(Number(e.target.value))}
                      style={{ fontSize: 16 }}
                    />
                    <button 
                      className="btn-secondary" 
                      onClick={fetchEncBalance} 
                      disabled={!addresses.revenue || !filmId || loading}
                      style={{ padding: '14px 32px', whiteSpace: 'nowrap' }}
                    >
                      📡 读取密文余额
                    </button>
                  </div>

                  {balanceHandle && (
                    <>
                      <div style={{ 
                        background: 'rgba(212, 175, 55, 0.05)', 
                        border: '1px solid var(--gold-primary)', 
                        borderRadius: 12, 
                        padding: 24 
                      }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                          🔐 加密句柄
                        </div>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          fontSize: 13, 
                          wordBreak: 'break-all',
                          color: 'var(--gold-primary)',
                          lineHeight: 1.8
                        }}>
                          {balanceHandle}
                        </div>
                      </div>

                      <button 
                        className="btn-primary" 
                        onClick={decryptBalance} 
                        disabled={!instance || loading}
                        style={{ fontSize: 17, padding: '18px 36px' }}
                      >
                        {loading ? '⏳ 解密中...' : '🔓 解密查看明文余额'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* My Films */}
              <div className="card" style={{ padding: 40 }}>
                <h2 style={{ fontSize: 24, marginBottom: 24, fontWeight: 700 }}>
                  📋 我创作的影片
                </h2>
                {myFilms.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🎬</div>
                    <div style={{ fontSize: 16 }}>暂无影片数据</div>
                    <div style={{ fontSize: 14, marginTop: 8 }}>去"上传作品"页面注册你的第一部影片吧！</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {myFilms.map(f => (
                      <div key={f.filmId} className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Film ID: {f.filmId}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 6px' }}>{f.title || '未命名'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{f.ipfsCidMeta}</div>
                        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>创建时间: {new Date(Number(f.createdAt) * 1000).toLocaleString()}</div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                          <button className="btn-secondary" onClick={() => setFilmId(f.filmId)}>查询收益</button>
                          <button className="btn-primary" onClick={() => {
                            const cid = normalizeCid(f.ipfsCidMeta);
                            if (!looksLikeCid(cid)) { setMessage('❌ 元数据 CID 无效，无法打开'); return; }
                            const url = `https://ipfs.io/ipfs/${cid}`;
                            window.open(url, '_blank');
                          }}>打开元数据</button>
                          <button className="btn-secondary" onClick={() => window.open(`/watch/${f.filmId}`, '_blank')}>播放</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification - only show errors */}
      {message && (/^❌|失败|error|错误/i.test(message)) && (
        <div style={{
          position: 'fixed',
          bottom: 40,
          right: 40,
          background: 'var(--bg-card)',
          border: '1px solid var(--gold-primary)',
          borderRadius: 16,
          padding: '20px 28px',
          maxWidth: 450,
          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out',
          fontSize: 15,
          lineHeight: 1.6
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
