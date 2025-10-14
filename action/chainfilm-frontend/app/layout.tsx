import './globals.css';

export const metadata = {
  title: 'ChainFilm - 去中心化微电影版权系统',
  description: '每一帧影像，都值得被记录'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}


