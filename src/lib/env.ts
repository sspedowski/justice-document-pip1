import { z } from 'zod';
import { ENV as rawEnv } from './env.schema';

// Re-export a narrowed, typed view for app usage
const EnvView = z.object({
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string(),
  RTDB_REQUIRE_AUTH: z.string().optional(),
});

export const env = EnvView.parse(rawEnv);
