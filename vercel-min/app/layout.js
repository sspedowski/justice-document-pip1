export const metadata = {
  title: "Justice Dashboard — Minimal",
  description: "Simple working upload + health check"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial', margin: 0, background: '#0b1020', color: '#e8f0fe' }}>
        <div style={{ maxWidth: 880, margin: '40px auto', padding: '24px', background: '#101631', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
