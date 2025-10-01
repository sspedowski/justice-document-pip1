export async function summarizeChunks(chunks){
  const combined = chunks.map(c=>c.text).join('\n').trim();
  return { title:'Daily Digest (Auto)', body: combined || '*No content*' };
}
