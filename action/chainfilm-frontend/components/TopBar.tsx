"use client";

export default function TopBar({ 
  account, 
  chainId, 
  status 
}: { 
  account?: string; 
  chainId?: number;
  status: string;
}) {
  return (
    <div style={{
      height: 80,
      background: 'rgba(10, 14, 26, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Left: Search or Title */}
      <div style={{ flex: 1 }}>
        <input 
          placeholder="🔍 搜索影片..." 
          className="input-field"
          style={{ 
            maxWidth: 400,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.1)'
          }}
        />
      </div>

      {/* Right: Status & Account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* FHEVM Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>FHEVM</span>
          <span className={`status-badge status-${status}`} style={{ fontSize: 11 }}>
            {status}
          </span>
        </div>

        {/* Chain Badge */}
        {chainId && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e'
            }} />
            {chainId === 11155111 ? 'Sepolia' : chainId === 31337 ? 'Localhost' : `Chain ${chainId}`}
          </div>
        )}

        {/* Account */}
        {account && (
          <div style={{
            background: 'var(--gradient-gold)',
            borderRadius: 12,
            padding: '12px 24px',
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--bg-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--bg-dark)'
            }} />
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}





