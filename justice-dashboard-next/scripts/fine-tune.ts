import fs from 'fs'
import OpenAI from 'openai'
import { FineTuningJobEvent } from 'openai/resources/fine-tuning'
import 'dotenv/config'

// OPENAI_API_KEY must be set in environment
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment')
  }

  const dataPath = process.env.FT_DATA_PATH || './scripts/data.jsonl'
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Training file not found at ${dataPath}`)
  }

  console.log('Uploading training file:', dataPath)
  const file = await client.files.create({
    file: fs.createReadStream(dataPath),
    purpose: 'fine-tune',
  })
  console.log('Uploaded file ID:', file.id)

  const baseModel = process.env.FT_BASE_MODEL || 'gpt-4o-mini-2024-07-18'
  console.log('Starting fine-tune with base model:', baseModel)
  let job = await client.fineTuning.jobs.create({
    model: baseModel,
    training_file: file.id,
  })
  console.log('Fine-tuning job ID:', job.id)

  const seen: Record<string, FineTuningJobEvent> = {}
  console.log('Tracking events...')
  while (job.status === 'running' || job.status === 'validating_files') {
    job = await client.fineTuning.jobs.retrieve(job.id)
    const { data } = await client.fineTuning.jobs.listEvents(job.id, { limit: 100 })
    for (const ev of data.reverse()) {
      if (seen[ev.id]) continue
      seen[ev.id] = ev
      const ts = new Date(ev.created_at * 1000)
      console.log(`- ${ts.toISOString()}: ${ev.message}`)
    }
    await new Promise((r) => setTimeout(r, 5000))
  }

  console.log('Final job status:', job.status)
  if (job.fine_tuned_model) {
    console.log('New fine-tuned model:', job.fine_tuned_model)
    console.log('Set OPENAI_FINETUNED_MODEL to this value for inference')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

