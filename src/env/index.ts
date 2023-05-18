import { config } from 'dotenv'

import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config()
}


const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('test'),
  DATABASE_CLIENT: z.enum(['sqlite', 'pg']),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('Invalide env variables!', _env.error.format())

  throw new Error('Invalide env variables.')
}

export const env = _env.data