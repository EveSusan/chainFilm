"use client";

export default function Header({ account, chainId }: { account?: string; chainId?: number }) {
  return (
    <header style={{
      background: 'rgba(10, 14, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
      padding: '20px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32, fontWeight: 900 }}>
            🎬 <span className="gold-text">ChainFilm</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            每一帧影像，都值得被记录
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {chainId && (
            <div className="status-badge status-ready">
              {chainId === 11155111 ? 'Sepolia' : chainId === 31337 ? 'Localhost' : `Chain ${chainId}`}
            </div>
          )}
          {account && (
            <div style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--gold-primary)',
              borderRadius: 8,
              padding: '10px 20px',
              fontFamily: 'monospace',
              fontSize: 14
            }}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}





