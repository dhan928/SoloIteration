const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');

class SqliteClient {
  constructor() {
    this.dbPath = config.database.file;
    this.schemaPath = path.join(__dirname, 'schema_sqlite.sql');

    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });

    this.db = new sqlite3.Database(this.dbPath);
    this.ready = this.initialize();
  }

  async initialize() {
    const schema = fs.readFileSync(this.schemaPath, 'utf8');
    await this.exec(schema);
  }

  async ensureReady() {
    return this.ready;
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function onRun(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || null);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  parseJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  async createUser({ userId, email, passwordHash, createdAt }) {
    await this.ensureReady();
    await this.run(
      `
        INSERT INTO users (user_id, email, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `,
      [userId, email, passwordHash, createdAt]
    );

    return this.findUserById(userId);
  }

  async findUserByEmail(email) {
    await this.ensureReady();
    return this.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async findUserById(userId) {
    await this.ensureReady();
    return this.get('SELECT * FROM users WHERE user_id = ?', [userId]);
  }

  async updateUserPassword(userId, passwordHash) {
    await this.ensureReady();
    await this.run('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, userId]);
  }

  async createSingleInference({ recordId, userId, prompt, model, createdAt }) {
    await this.ensureReady();
    await this.run(
      `
        INSERT INTO inference_records (
          record_id, user_id, mode, prompt, selected_models, results, status, created_at
        ) VALUES (?, ?, 'single', ?, ?, ?, 'pending', ?)
      `,
      [recordId, userId, prompt, JSON.stringify([model]), JSON.stringify([]), createdAt]
    );

    return this.findRecordById(recordId, userId);
  }

  async updateSingleInferenceResult(recordId, userId, result, status, completedAt = null) {
    await this.ensureReady();
    await this.run(
      `
        UPDATE inference_records
        SET results = ?, status = ?, completed_at = ?
        WHERE record_id = ? AND user_id = ?
      `,
      [JSON.stringify([result]), status, completedAt, recordId, userId]
    );
  }

  async listSingleInferences(userId, limit = 50, offset = 0) {
    await this.ensureReady();
    return this.all(
      `
        SELECT * FROM inference_records
        WHERE user_id = ? AND mode = 'single'
        ORDER BY datetime(created_at) DESC
        LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );
  }

  async countSingleInferences(userId) {
    await this.ensureReady();
    const row = await this.get(
      `SELECT COUNT(*) AS total FROM inference_records WHERE user_id = ? AND mode = 'single'`,
      [userId]
    );
    return row ? row.total : 0;
  }

  async createComparison({ recordId, userId, prompt, models, createdAt }) {
    const results = models.map((model) => ({
      model,
      response: null,
      status: 'pending',
      executionTimeMs: null,
      errorMessage: null
    }));

    await this.ensureReady();
    await this.run(
      `
        INSERT INTO inference_records (
          record_id, user_id, mode, prompt, selected_models, results, status, created_at
        ) VALUES (?, ?, 'compare', ?, ?, ?, 'pending', ?)
      `,
      [recordId, userId, prompt, JSON.stringify(models), JSON.stringify(results), createdAt]
    );

    return this.findRecordById(recordId, userId);
  }

  async updateComparisonResults(recordId, userId, results, status, completedAt = null) {
    await this.ensureReady();
    await this.run(
      `
        UPDATE inference_records
        SET results = ?, status = ?, completed_at = ?
        WHERE record_id = ? AND user_id = ?
      `,
      [JSON.stringify(results), status, completedAt, recordId, userId]
    );
  }

  async listComparisons(userId, limit = 50, offset = 0) {
    await this.ensureReady();
    return this.all(
      `
        SELECT * FROM inference_records
        WHERE user_id = ? AND mode = 'compare'
        ORDER BY datetime(created_at) DESC
        LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );
  }

  async countComparisons(userId) {
    await this.ensureReady();
    const row = await this.get(
      `SELECT COUNT(*) AS total FROM inference_records WHERE user_id = ? AND mode = 'compare'`,
      [userId]
    );
    return row ? row.total : 0;
  }

  async findRecordById(recordId, userId) {
    await this.ensureReady();
    return this.get(
      'SELECT * FROM inference_records WHERE record_id = ? AND user_id = ?',
      [recordId, userId]
    );
  }

  async deleteRecord(recordId, userId) {
    await this.ensureReady();
    await this.run('DELETE FROM inference_records WHERE record_id = ? AND user_id = ?', [recordId, userId]);
  }

  normalizeRecord(row) {
    if (!row) {
      return null;
    }

    return {
      recordId: row.record_id,
      userId: row.user_id,
      mode: row.mode,
      prompt: row.prompt,
      selectedModels: this.parseJson(row.selected_models, []),
      results: this.parseJson(row.results, []),
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at || null
    };
  }
}

module.exports = new SqliteClient();
