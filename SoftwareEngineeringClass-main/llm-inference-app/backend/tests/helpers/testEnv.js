/**
 * Default env for Jasmine so modules that construct SupabaseClient can load.
 * Override with real values in .env when running integration tests.
 */
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
}
if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'test-anon-key-for-jasmine';
}
