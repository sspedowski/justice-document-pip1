declare module 'ai' {
  export const streamText: (cfg: any) => any;
}
declare module '@ai-sdk/openai' {
  export const openai: (modelId: string) => any;
}