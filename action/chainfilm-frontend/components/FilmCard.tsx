"use client";

export default function FilmCard({ 
  title, 
  author, 
  rating, 
  reviews,
  onPurchase 
}: { 
  title: string;
  author: string;
  rating: number;
  reviews: number;
  onPurchase?: () => void;
}) {
  return (
    <div className="card fade-in" style={{ 
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer'
    }}>
      {/* 优秀论文标签 */}
      {rating >= 9 && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'var(--gradient-gold)',
          color: 'var(--bg-dark)',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 10
        }}>
          优秀论文
        </div>
      )}
      
      {/* 视频缩略图区域 */}
      <div style={{
        width: '100%',
        height: 200,
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(10, 14, 26, 0.8))',
        borderRadius: 12,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 48,
        transition: 'transform 0.3s ease'
      }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} 
         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
        🎬
      </div>

      <h3 style={{ fontSize: 20, marginBottom: 12, fontWeight: 700 }}>{title}</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--gradient-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--bg-dark)'
        }}>
          作
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{author}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="gold-text" style={{ fontSize: 24, fontWeight: 900 }}>{rating}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>/10</span>
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{reviews} 次评审</span>
      </div>

      <button className="btn-primary" style={{ width: '100%' }} onClick={onPurchase}>
        购买播放授权
      </button>
    </div>
  );
}





