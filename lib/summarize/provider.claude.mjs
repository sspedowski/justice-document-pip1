// lib/summarize/provider.claude.mjs
import { summarizeWithClaude } from '../ai/claudeClient.mjs';

export async function summarizeViaClaude(text) {
  const { summary_bullets, tags } = await summarizeWithClaude(text);
  return {
    summary: summary_bullets.join('\n'),
    tags: tags ?? [],
    provider: 'claude',
    model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
  };
}
