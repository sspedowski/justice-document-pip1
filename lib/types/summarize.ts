// Input payload for both JSON + SSE routes
export interface SummarizeRequest {
  text: string;
}

// ----- Streaming summarize SSE types -----
export type SummarizePhase = 'queued' | 'fetching' | 'chunking' | 'summarizing';

export interface SummarizeProgressFrame {
  stage: 'progress';
  phase?: SummarizePhase;
  message?: string;
  pct?: number;
  requestId?: string;
  elapsedMs?: number;
}

export interface SummarizeResultFrame {
  stage: 'result';
  ok: boolean;
  summary?: string;
  tags?: string[];
  provider?: string;
  model?: string;
  partial?: boolean;
  error?: string;
  requestId?: string;
  elapsedMs?: number;
}

export interface SummarizeEndFrame {
  stage: 'end';
  ok: boolean;
  requestId?: string;
  elapsedMs?: number;
}

export type SSEFrame =
  | SummarizeProgressFrame
  | SummarizeResultFrame
  | SummarizeEndFrame;

// Utility type for EventSource parsing on the client
export interface ParsedSSE<T = SSEFrame> {
  event?: string;
  data?: T;
}

// Exhaustive guard helper
export function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

// ----- JSON summarize endpoint types -----
export interface SummarizeJsonRequest {
  text: string;
}

export interface SummarizeJsonSuccess {
  ok: true;
  summary: string;
  tags: string[];
  provider: string;
  model: string;
  requestId: string;
  elapsedMs: number;
}

export interface SummarizeJsonError {
  ok: false;
  error: string;
  requestId?: string;
}

export type SummarizeJsonResponse = SummarizeJsonSuccess | SummarizeJsonError;
