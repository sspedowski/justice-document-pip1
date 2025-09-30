import dynamic from 'next/dynamic';

const HealthStatus = dynamic(() => import('../components/HealthStatus'), { ssr: false });

export default function Home() {
  return (
    <main className="home-main">
      <h1 className="home-title">Justice Dashboard</h1>
      <p>Root Next.js app is live. API routes: /api/health, /api/version, /api/upload</p>
      <HealthStatus />
    </main>
  );
}

