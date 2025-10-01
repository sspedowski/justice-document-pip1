export function buildDigestPrompt(items: string[]): string {
  const bullets = items.map((s, i) => `${i + 1}) ${s}`).join('\n');
  return `You are a release-notes assistant. Summarize these items as a concise engineering daily digest:
${bullets}

Return clear sections:
1) SHIPPED
2) FAILING PIPELINES
3) NEXT PRIORITIES`;
}
