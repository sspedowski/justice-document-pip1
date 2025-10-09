// Type declarations for frames.mjs

export interface SummarizeFrame {
  stage: 'start' | 'queued' | 'fetching' | 'chunking' | 'summarizing' | 'result' | 'provider' | 'done' | 'end';
  progress?: number;
  result?: string;
  summary?: string;
  tags?: string[];
  provider?: string;
  model?: string;
  name?: string;
  ok?: boolean;
  error?: string;
}

export interface SummarizeOptions {
  text?: string;
  delayMs?: number;
}

export function summarizeFrames(opts?: SummarizeOptions): AsyncGenerator<SummarizeFrame, void, unknown>;

export function frameToSSE(frame: SummarizeFrame): string;
