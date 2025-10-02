// Generic "done/error/streaming" stages your pipeline emits.
// Add/remove stages here to keep the app coherent.
export type Stage =
  | 'start'
  | 'queued'
  | 'provider'
  | 'progress'
  | 'result'
  | 'end'
  | 'done'
  | 'error';

export type ProviderName = 'claude' | 'mock';

// Input payload for both JSON + SSE routes
export interface SummarizeRequest {
  text: string;
}

// Base frame for all SSE messages
export interface BaseFrame {
  stage: Stage;
  requestId?: string;
  elapsedMs?: number;
}

export interface StartFrame extends BaseFrame {
  stage: 'start';
}

export interface ProviderFrame extends BaseFrame {
  stage: 'provider';
  name: ProviderName;
  model?: string;
}

export interface ProgressFrame extends BaseFrame {
  stage: 'progress';
  pct?: number;          // 0..100
  hint?: string;
}

export interface ResultFrame extends BaseFrame {
  stage: 'result';
  partial?: string;      // running text accumulation (optional)
}

export interface EndFrame extends BaseFrame {
  stage: 'end';
}

export interface DoneFrame extends BaseFrame {
  stage: 'done';
  ok: true;
  summary: string;
  tags: string[];
  provider?: ProviderName;
  model?: string;
}

export interface ErrorFrame extends BaseFrame {
  stage: 'error';
  ok?: false;
  error: string;
}

export type SSEFrame =
  | StartFrame
  | ProviderFrame
  | ProgressFrame
  | ResultFrame
  | EndFrame
  | DoneFrame
  | ErrorFrame;

// Utility type for EventSource parsing on the client
export interface ParsedSSE<T = SSEFrame> {
  event?: string;
  data?: T;
}

// Exhaustive guard for discriminated unions - prevents future drift
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
