export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Justice Dashboard</h1>
      <p>
        Root Next.js app is live. API routes remain under <code>/api/*</code>.
      </p>
      <ul style={{ marginTop: 12 }}>
        <li>
          Health: <code>/api/health</code>
        </li>
        <li>
          Version: <code>/api/version</code>
        </li>
        <li>
          Upload (if kept): <code>/api/upload</code>
        </li>
      </ul>
    </main>
  );
}

