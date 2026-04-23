const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbFile = path.join(dataDir, 'db.json');

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ users: [], conversations: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

class FileStore {
  static async findUserByEmail(email) {
    const db = readDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async findUserById(userId) {
    const db = readDb();
    return db.users.find((u) => u.user_id === userId) || null;
  }

  static async createUser({ email, password_hash }) {
    const db = readDb();
    const user = {
      user_id: uuidv4(),
      email,
      password_hash,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    writeDb(db);
    return user;
  }

  static async createConversation(userId, title) {
    const db = readDb();
    const now = new Date().toISOString();
    const conversation = {
      conversation_id: uuidv4(),
      user_id: userId,
      title,
      created_at: now,
      updated_at: now,
      messages: []
    };
    db.conversations.unshift(conversation);
    writeDb(db);
    return conversation;
  }

  static async listConversations(userId, { search = '' } = {}) {
    const db = readDb();
    const query = search.trim().toLowerCase();
    let conversations = db.conversations.filter((c) => c.user_id === userId);

    if (query) {
      conversations = conversations.filter((conversation) => {
        const haystack = [
          conversation.title,
          ...conversation.messages.map((m) => m.content)
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    return conversations
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map((conversation) => ({
        conversationId: conversation.conversation_id,
        title: conversation.title,
        preview: conversation.messages[0]?.content || '',
        messageCount: conversation.messages.length,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
      }));
  }

  static async getConversation(userId, conversationId) {
    const db = readDb();
    const conversation = db.conversations.find(
      (c) => c.user_id === userId && c.conversation_id === conversationId
    );
    return conversation || null;
  }

  static async appendMessage(userId, conversationId, message) {
    const db = readDb();
    const conversation = db.conversations.find(
      (c) => c.user_id === userId && c.conversation_id === conversationId
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push({
      message_id: uuidv4(),
      role: message.role,
      content: message.content,
      created_at: new Date().toISOString()
    });

    if (!conversation.title || conversation.title === 'New Chat') {
      const firstUserMessage = conversation.messages.find((m) => m.role === 'user');
      if (firstUserMessage) {
        conversation.title = firstUserMessage.content.slice(0, 50).trim() || 'New Chat';
      }
    }

    conversation.updated_at = new Date().toISOString();
    writeDb(db);
    return conversation;
  }

  static async deleteConversation(userId, conversationId) {
    const db = readDb();
    const originalLength = db.conversations.length;
    db.conversations = db.conversations.filter(
      (c) => !(c.user_id === userId && c.conversation_id === conversationId)
    );
    if (db.conversations.length === originalLength) {
      throw new Error('Conversation not found');
    }
    writeDb(db);
  }
}

module.exports = FileStore;
