// lib/ai/claudeClient.mjs
import { readFile } from 'node:fs/promises';

const API_URL = 'https://api.anthropic.com/v1/messages';

function getConfig() {
  const apiKey = process.env.CLAUDE_API_KEY || '';
  const model = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
  const maxTokens = Number(process.env.CLAUDE_MAX_TOKENS || 800);
  return { apiKey, model, maxTokens };
}

export async function summarizeWithClaude(text) {
  const { apiKey, model, maxTokens } = getConfig();

  // Mock path for CI / dev without key
  if (!apiKey) {
    return {
      summary_bullets: [
        'Mock summary: integration test path (no CLAUDE_API_KEY set).',
        `Text length: ${text?.length ?? 0} chars`,
      ],
      tags: ['mock', 'summary', 'no-key'],
    };
  }

  // Load prompt file at runtime
  const promptTxt = await readFile('prompts/claude/summarize.prompt.txt', 'utf8');

  const userContent =
    `TEXT START\n${text ?? ''}\nTEXT END\n` +
    `\nReturn JSON per the prompt spec.`;

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: promptTxt },
      { role: 'user', content: userContent },
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${errTxt.slice(0, 800)}`);
  }

  // Anthropic messages API format: { content: [{ type: "text", text: "..." }], ... }
  const data = await res.json();
  const content = (data?.content?.[0]?.text ?? '').trim();

  // Parse the model's JSON
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Helpful failure with head preview
    throw new Error(
      `Claude returned non-JSON or malformed JSON. Head: ${String(content).slice(0,160)}`
    );
  }

  // Minimal shape check
  if (!Array.isArray(parsed.summary_bullets)) {
    throw new Error('Claude JSON missing "summary_bullets" array.');
  }
  return parsed;
}
