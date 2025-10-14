# Claude AI Integration Guide

This document describes how to configure and use the Anthropic Claude integration for AI-powered summarization in the Justice Dashboard.

## Overview

The Justice Dashboard supports Claude as an AI provider for generating intelligent summaries of case notes, evidence, and other text content. Claude integration is **optional** and works alongside existing functionality.

## Configuration

> Tip: Claude usage is optional. Set `CLAUDE_API_KEY` only when you want to enable it.

### 1. Obtain an API Key

1. Sign up for an [Anthropic account](https://www.anthropic.com/)
2. Generate an API key from your [Anthropic Console](https://console.anthropic.com/)
3. Keep your API key secure and never commit it to version control

### 2. Set Environment Variables

Add the following variables to your `.env.local` file (for local development) or your deployment environment:

```bash
# Required: Your Anthropic API key
CLAUDE_API_KEY=sk-ant-api03-...

# Optional: Choose a Claude model (default: claude-3-haiku-20240307)
CLAUDE_MODEL=claude-3-haiku-20240307

# Optional: Maximum tokens in response (default: 800)
CLAUDE_MAX_TOKENS=800
```

### Available Models

- `claude-3-haiku-20240307` - Fast, cost-effective (recommended for production)
- `claude-3-sonnet-20240229` - Balanced performance and capability
- `claude-3-opus-20240229` - Most capable, slower and more expensive

See [Anthropic's model documentation](https://docs.anthropic.com/claude/docs/models-overview) for the latest models and pricing.

## How It Works

### Feature Flag Behavior

The Claude integration uses **feature flag** behavior based on the presence of `CLAUDE_API_KEY`:

- **With API key**: Requests are sent to Claude API for intelligent summarization
- **Without API key**: Falls back to a deterministic mock response for testing and CI

This design ensures:
- Tests pass in CI/CD without requiring API credentials
- Developers can work locally without an API key
- Production deployments can enable Claude by simply setting the environment variable

### Mock Fallback

When `CLAUDE_API_KEY` is not set, the system returns a mock response:

```json
{
  "summary_bullets": [
    "Mock summary: integration test path (no CLAUDE_API_KEY set).",
    "Text length: 123 chars"
  ],
  "tags": ["mock", "summary", "no-key"]
}
```

This allows the application to function and tests to pass without external API dependencies.

## Prompt Engineering

### Prompt File Location

The Claude prompt is stored in version control at:

```
prompts/claude/summarize.prompt.txt
```

### Editing the Prompt

The prompt file defines how Claude processes and summarizes text. You can customize it to:

- Change the output format
- Adjust the level of detail
- Add domain-specific instructions
- Modify the JSON schema

**Important**: Changes to the prompt file affect all users. Test thoroughly before deploying prompt changes.

### Current Prompt Specification

The current prompt instructs Claude to:

1. Generate 3-6 bullet points covering key facts, actors, dates/times, and contradictions
2. Produce 3-6 lowercase, hyphenated tags
3. Return structured JSON in a specific schema
4. Never invent facts when information is missing

## Privacy and Data Handling

### Data Sent to Claude

When using Claude integration, the following data is sent to Anthropic's API:

- The text content you want to summarize (case notes, evidence descriptions, etc.)
- The system prompt from `prompts/claude/summarize.prompt.txt`

**No other data** (user information, metadata, session data, etc.) is sent to Claude.

### Privacy Considerations

- **PII Warning**: Only send text to Claude that you have permission to process via a third-party API
- Review [Anthropic's Privacy Policy](https://www.anthropic.com/legal/privacy)
- Review [Anthropic's Commercial Terms](https://www.anthropic.com/legal/commercial-terms)
- Consider data residency and compliance requirements for your jurisdiction
- For sensitive cases, consider using the mock fallback (no API key) or implementing additional filtering

### API Data Retention

- Anthropic may retain API data for up to 30 days for Trust & Safety purposes
- Data is not used for model training by default
- See Anthropic's documentation for current data retention policies

## Testing

### Running Tests Locally

```bash
# Run Node core tests (includes Claude mock test)
npm run test:unit-node
```

### Claude Mock Test

The test suite includes `tests-node/claude.mock.test.mjs` which verifies:

- Mock response works without API key
- Correct data structure is returned
- Integration with the frames generator

### Testing with Real API

To test with a real Claude API key locally:

1. Set `CLAUDE_API_KEY` in `.env.local`
2. Run the development server: `npm run dev`
3. Make a request to the stream endpoint:

```bash
curl -i -N -X POST \
  -H 'Accept: text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Your test case notes here..."}' \
  http://localhost:3020/api/summarize/stream
```

## Streaming (Future Enhancement)

The current implementation uses Claude's non-streaming API. Future enhancements may include:

- Streaming responses using Claude's streaming API
- Real-time token-by-token updates in the UI
- Progress indicators during generation

The existing SSE infrastructure (`/api/summarize/stream`) is already designed to support streaming frames.

## Troubleshooting

### Common Issues

**Tests failing with "Claude API error 401"**
- Ensure `CLAUDE_API_KEY` is not set in your test environment
- The mock fallback should activate automatically when the key is absent

**"Claude returned non-JSON or malformed JSON"**
- Check the model's output in the error message
- The prompt may need adjustment
- Try increasing `CLAUDE_MAX_TOKENS` if responses are being truncated

**"Claude JSON missing 'summary_bullets' array"**
- The model did not follow the expected JSON schema
- Review and refine the prompt in `prompts/claude/summarize.prompt.txt`

### Support

For issues specific to:
- **This integration**: Open an issue in the Justice Dashboard repository
- **Claude API**: Contact [Anthropic Support](https://support.anthropic.com/)

## Cost Estimation

Claude API usage is billed by tokens (input + output). Approximate costs with Haiku:

- Input: $0.25 per million tokens (~750k words)
- Output: $1.25 per million tokens (~750k words)

A typical 500-word case note summary:
- Input: ~700 tokens
- Output: ~200 tokens
- Cost: ~$0.0004 per summary

See [Anthropic's pricing page](https://www.anthropic.com/pricing) for current rates.

## Best Practices

1. **Start with Haiku**: Use `claude-3-haiku-20240307` for cost-effective production use
2. **Monitor usage**: Track API costs in the Anthropic Console
3. **Version control prompts**: Always commit prompt changes with clear descriptions
4. **Test prompt changes**: Use the mock fallback for rapid iteration, then validate with real API
5. **Set reasonable limits**: Use `CLAUDE_MAX_TOKENS` to prevent unexpectedly long responses
6. **Handle errors gracefully**: The integration includes error handling with informative messages

## Future Enhancements

Potential improvements to this integration:

- [ ] Streaming support for real-time updates
- [ ] Multiple prompt templates for different content types
- [ ] Caching frequently-summarized content
- [ ] Usage analytics and cost tracking
- [ ] A/B testing different models/prompts
- [ ] Fine-tuned models for legal domain
