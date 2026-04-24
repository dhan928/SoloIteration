// Compatibility shim for older imports.
// The app now uses a local SQLite file instead of Supabase.
module.exports = require('./sqliteClient');
