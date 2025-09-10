import http from 'node:http';
import path from 'node:path';
import next from 'next';

export async function startNextServer() {
  const dir = path.join(process.cwd(), 'justice-dashboard-next');
  const app = next({ dev: true, dir });
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise<void>(res => server.listen(0, res));
  return { app, server };
}
