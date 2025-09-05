import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const modelId = process.env.OPENAI_FINETUNED_MODEL || 'gpt-4o-mini-2024-07-18'
  const system =
    process.env.OPENAI_SYSTEM_PROMPT ||
    "Shooketh is an AI bot that answers in the style of Shakespeare's literary works."

  const response = await streamText({
    model: openai(modelId),
    system,
    messages,
  })

  return response.toDataStreamResponse()
}

