const FileStore = require('../database/fileStore');
const LlmService = require('./llmService');

class ConversationService {
  static async listConversations(userId, { search = '' } = {}) {
    return FileStore.listConversations(userId, { search });
  }

  static async createConversation(userId, prompt) {
    const title = prompt.slice(0, 50).trim() || 'New Chat';
    const conversation = await FileStore.createConversation(userId, title);
    const result = await this.sendMessage(userId, conversation.conversation_id, prompt);
    return result.conversation;
  }

  static async getConversation(userId, conversationId) {
    const conversation = await FileStore.getConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return {
      conversationId: conversation.conversation_id,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: conversation.messages.map((message) => ({
        messageId: message.message_id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at
      }))
    };
  }

  static async sendMessage(userId, conversationId, prompt) {
    const conversation = await FileStore.getConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await FileStore.appendMessage(userId, conversationId, {
      role: 'user',
      content: prompt
    });

    const updatedConversation = await FileStore.getConversation(userId, conversationId);
    const assistantReply = await LlmService.generateReply(prompt, updatedConversation);

    const finalConversation = await FileStore.appendMessage(userId, conversationId, {
      role: 'assistant',
      content: assistantReply
    });

    return {
      conversation: {
        conversationId: finalConversation.conversation_id,
        title: finalConversation.title,
        createdAt: finalConversation.created_at,
        updatedAt: finalConversation.updated_at,
        messages: finalConversation.messages.map((message) => ({
          messageId: message.message_id,
          role: message.role,
          content: message.content,
          createdAt: message.created_at
        }))
      },
      assistantReply
    };
  }

  static async deleteConversation(userId, conversationId) {
    return FileStore.deleteConversation(userId, conversationId);
  }
}

module.exports = ConversationService;
