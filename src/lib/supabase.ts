import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com service role — usar apenas em Server Components / Route Handlers.
 * Nunca expor no cliente!
 */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const STORAGE_BUCKET = "attachments"
export const SIGNED_URL_EXPIRY = 60 * 60 // 1 hora em segundos
