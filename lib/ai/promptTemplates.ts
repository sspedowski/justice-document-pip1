interface BuildArgs { mode: 'summarize' | 'explain' | 'pr-notes' | 'scaffold' | 'review-assist' | 'digest'; payload: any }

export function buildPrompt(args: BuildArgs) {
  const { mode, payload } = args;
  switch (mode) {
    case 'summarize': {
      const system = 'You are a concise legal+technical summarizer. Output a markdown summary with bullet sections.';
      const user = `Summarize the following text focusing on key parties, dates, issues, actions, risks, and open questions.\n\nTEXT:\n${payload.text}`;
      return { system, user };
    }
    case 'explain': {
      const system = 'You explain errors/logs clearly, proposing minimal actionable fixes.';
      const logs = payload.logs || payload.text || '';
      const user = `Explain the root cause, likely contributing factors, and concrete next debugging steps.\n\nLOGS:\n${logs}`;
      return { system, user };
    }
    case 'pr-notes': {
      const system = 'You draft pull request notes: summary, rationale, risks, test coverage, follow-ups.';
      const diff = payload.diff || payload.summary || '';
      const user = `Generate PR notes with sections: Summary, Motivation, Key Changes, Risks/Mitigations, Tests, Follow Ups.\n\nDIFF OR SUMMARY:\n${diff}`;
      return { system, user };
    }
    case 'scaffold': {
      const system = 'You output a concise React (TypeScript) skeleton. Avoid extraneous commentary.';
      const desc = payload.description || '';
      const user = `Create a React component skeleton (no business logic) for: ${desc}`;
      return { system, user };
    }
    case 'review-assist': {
      const system = 'You are a code reviewer focused on security, performance, and test coverage. Be precise and actionable.';
      const diff = payload.diff || payload.summary || '';
      const prTitle = payload.title || '';
      const prBody = payload.body || '';
      const user = [
        'Analyze this pull request and provide:',
        '',
        '**Test Ideas** (table format: Case | Area/Unit)',
        '- 4–6 test cases covering edge cases, security, and integration',
        '- Format as markdown table',
        '',
        '**Security/Performance Watchouts**',
        '- Max 3 bullets',
        '- Flag: auth/authz changes, SQL injection risks, N+1 queries, memory leaks, missing rate limits',
        '- Skip if none found',
        '',
        'Be concise. Use Slack-friendly markdown.',
        '',
        `PR Title: ${prTitle}`,
        `PR Body: ${prBody}`,
        '',
        'DIFF:',
        diff
      ].join('\n');
      return { system, user };
    }
    case 'digest': {
      const prs = Array.isArray(payload.prs) ? payload.prs : [];
      const failures = Array.isArray(payload.failures) ? payload.failures : [];

      const prLines = prs.map((p: any) =>
        `- ${p.title || ''} (PR #${p.number || ''}) ${p.url || ''} ${p.mergedAt ? `— merged ${p.mergedAt}` : ''}`
      ).join('\n');

      const failLines = failures.map((f: any) =>
        `- ${f.name || ''} (${f.event || ''}) ${f.url || ''} — ${f.conclusion || 'failure'}`
      ).join('\n');

      const user = [
        'Create a concise engineering daily digest for Slack.',
        '',
        'Sections:',
        '1) SHIPPED (merged PRs, grouped, 3–7 bullets)',
        '2) FAILING PIPELINES (top failures + likely cause, 3 bullets max)',
        '3) NEXT PRIORITIES (3 bullets, imperative, owner if obvious)',
        '',
        'Tone: crisp, factual. Use Slack-friendly markdown. Avoid speculation.',
        '',
        'Merged PRs (last 24h):',
        prLines || '- (none)',
        '',
        'Recent failing runs:',
        failLines || '- (none)'
      ].join('\n');

      return {
        system: 'You are a chief-of-staff summarizing engineering activity. Be precise and concise.',
        user
      };
    }
  }
}
