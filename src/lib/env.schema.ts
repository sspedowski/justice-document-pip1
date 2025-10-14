import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars').optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars').optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Justice Dashboard'),

  // --- AI Integration ---
  OPENAI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  ELATION_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // --- RTDB Auth (default enabled in production) ---
  RTDB_REQUIRE_AUTH: z
    .enum(['true', 'false'])
    .default(process.env.NODE_ENV === 'production' ? 'true' : 'false'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('\n❌ Environment validation failed:\n');
    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
}

export const ENV = parsed.success ? parsed.data : {} as z.infer<typeof EnvSchema>;
