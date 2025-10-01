export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { anthropic, getModelId } from '@/lib/ai/client';
import { buildPrompt } from '@/lib/ai/promptTemplates';
import { redactSecrets } from '@/lib/ai/redact';
import { summarizeLargeText, toReadableMarkdown } from '@/lib/ai/hierarchicalSummarizer';

const BodySchema = z.object({
  mode: z.enum(['summarize','explain','pr-notes','scaffold','review-assist','digest']),
  model: z.enum(['sonnet','opus']).optional(),
  payload: z.record(z.string(), z.any()).default({}),
  options: z.object({}).optional()
});

function bad(message: string, status = 400) { return new Response(JSON.stringify({ error: message }), { status, headers: { 'content-type': 'application/json' } }); }

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { mode, model = 'sonnet', payload } = BodySchema.parse(json);
    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) return bad('Anthropic API key missing (set ANTHROPIC_API_KEY)');

    if (mode === 'summarize') {
      const text: string = String(payload.text || payload.documentText || '');
      if (!text) return bad('Provide `text` or `documentText` for summarize');
      const SIMPLE_THRESH = 9000;
      if (text.length <= SIMPLE_THRESH) {
        const { system, user } = buildPrompt({ mode: 'summarize', payload: { text } });
        const msg = await anthropic.messages.create({ model: getModelId(model), max_tokens: 1200, temperature: 0.1, system, messages: [{ role: 'user', content: user }] });
        const result = msg.content?.map((c:any)=> ('text' in c ? c.text : '')).join('') || '';
        return new Response(JSON.stringify({ mode, strategy: 'single', result, usage: msg.usage, timingMs: 0 }), { headers: { 'content-type': 'application/json' } });
      }
      const summary = await summarizeLargeText(text, { model });
      const result = toReadableMarkdown(summary);
      return new Response(JSON.stringify({ mode, strategy: 'hierarchical', result, summary }), { headers: { 'content-type': 'application/json' } });
    }

    switch(mode) {
      case 'explain': {
        if (!payload.logs && !payload.text) return bad('Provide `logs` or `text` for explain');
        const { system, user } = buildPrompt({ mode, payload: redactSecrets(payload) });
        const msg = await anthropic.messages.create({ model: getModelId(model), max_tokens: 1200, temperature: 0.1, system, messages: [{ role: 'user', content: user }] });
        const result = msg.content?.map((c:any)=> ('text' in c ? c.text : '')).join('') || '';
        return new Response(JSON.stringify({ result, model: getModelId(model), usage: msg.usage }), { headers: { 'content-type': 'application/json' } });
      }
      case 'pr-notes': {
        if (!payload.diff && !payload.summary) return bad('Provide `diff` or `summary` for pr-notes');
        const { system, user } = buildPrompt({ mode, payload });
        const msg = await anthropic.messages.create({ model: getModelId(model), max_tokens: 800, temperature: 0.1, system, messages: [{ role: 'user', content: user }] });
        const result = msg.content?.map((c:any)=> ('text' in c ? c.text : '')).join('') || '';
        return new Response(JSON.stringify({ result, model: getModelId(model), usage: msg.usage }), { headers: { 'content-type': 'application/json' } });
      }
      case 'scaffold': {
        const desc = String(payload.description || '');
        if (!desc) return bad('Provide `description` for scaffold');
        const { system, user } = buildPrompt({ mode, payload });
        const msg = await anthropic.messages.create({ model: getModelId(model), max_tokens: 1600, temperature: 0.2, system, messages: [{ role: 'user', content: user }] });
        const result = msg.content?.map((c:any)=> ('text' in c ? c.text : '')).join('') || '';
        return new Response(JSON.stringify({ result, model: getModelId(model), usage: msg.usage }), { headers: { 'content-type': 'application/json' } });
      }
      case 'review-assist': {
        if (!payload.diff && !payload.summary) return bad('Provide `diff` or `summary` for review-assist');
        const { system, user } = buildPrompt({ mode, payload });
        const msg = await anthropic.messages.create({ model: getModelId(model), max_tokens: 1200, temperature: 0.1, system, messages: [{ role: 'user', content: user }] });
        const result = msg.content?.map((c:any)=> ('text' in c ? c.text : '')).join('') || '';
        return new Response(JSON.stringify({ result, model: getModelId(model), usage: msg.usage }), { headers: { 'content-type': 'application/json' } });
      }
      case 'digest': {
        const { system, user } = buildPrompt({ mode, payload });
        const msg = await anthropic.messages.create({ model: getModelId(model), max_tokens: 900, temperature: 0.1, system, messages: [{ role: 'user', content: user }] });
        const result = msg.content?.map((c:any)=> ('text' in c ? c.text : '')).join('') || '';
        return new Response(JSON.stringify({ result, model: getModelId(model), usage: msg.usage }), { headers: { 'content-type': 'application/json' } });
      }
    }
    return bad('Unsupported mode');
  } catch (err:any) {
    console.error('[api/ai] error', err);
    const status = err?.status ?? 500;
    return bad('AI service error. Try again or reduce input size.', status);
  }
}
