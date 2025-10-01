/**
 * Placeholder AI client. Swap for your model provider later.
 */
export async function callAI(prompt: string): Promise<string> {
  // No external calls in this minimal PR; just echo prompt.
  return `[[AI RESPONSE]]\n${prompt}`;
}
