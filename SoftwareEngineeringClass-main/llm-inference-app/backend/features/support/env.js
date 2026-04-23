/**
 * Load before other support files and step definitions so SupabaseClient can construct.
 */
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
}
if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'test-anon-key-cucumber';
}
