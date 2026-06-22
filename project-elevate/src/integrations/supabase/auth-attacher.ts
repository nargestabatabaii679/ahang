// Auth attacher — no-op when Supabase is not configured.
import { createMiddleware } from '@tanstack/react-start'

export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => next({ headers: {} })
)
