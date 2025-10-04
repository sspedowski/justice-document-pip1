export const dynamic = 'force-static';

export default function Dashboard() {
  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Justice Dashboard</h1>
      <p className="text-gray-600">Welcome. Choose a task below:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <a className="text-blue-600 underline" href="/summarize-demo">Streaming Summarize (SSE) demo</a>
        </li>
        <li>
          <a className="text-blue-600 underline" href="/api/health">API Health</a>
        </li>
        <li>
          
          <a className="text-blue-600 underline" href="/legacy/index.html">Legacy dashboard (static)</a>
        </li>
      </ul>
    </main>
  );
}
