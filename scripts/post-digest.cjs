const fs = require('fs');
const path = require('path');

async function main() {
  const webhook = process.env.SLACK_WEBHOOK;
  if (!webhook) {
    console.error('SLACK_WEBHOOK not set');
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), 'data', 'digest-latest.txt');
  const text = fs.readFileSync(file, 'utf8');
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Slack post failed:', res.status, body);
    process.exit(2);
  }
  console.log('Posted digest to Slack');
}

main().catch((e) => {
  console.error(e);
  process.exit(3);
});
