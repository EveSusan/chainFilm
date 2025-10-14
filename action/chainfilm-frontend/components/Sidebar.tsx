"use client";

export default function Sidebar({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { key: 'explore', icon: '🎬', label: '探索影片' },
    { key: 'register', icon: '📤', label: '上传作品' },
    { key: 'dashboard', icon: '💰', label: '我的资产' },
  ];

  return (
    <aside style={{
      width: 280,
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      padding: '32px 20px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
          🎬 <span className="gold-text">ChainFilm</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          每一帧影像<br/>都值得被记录
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              width: '100%',
              background: activeTab === tab.key ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: activeTab === tab.key ? '1px solid var(--gold-primary)' : '1px solid transparent',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 16,
              fontWeight: 600,
              color: activeTab === tab.key ? 'var(--gold-primary)' : 'var(--text-secondary)',
              textAlign: 'left',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: 24 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px',
        background: 'rgba(212, 175, 55, 0.05)',
        borderRadius: 12,
        fontSize: 12,
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 8 }}>🔐 基于 FHEVM</div>
        <div>完全隐私保护</div>
      </div>
    </aside>
  );
}





