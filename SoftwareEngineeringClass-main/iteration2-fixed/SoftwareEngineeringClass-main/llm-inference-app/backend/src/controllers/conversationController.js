const { validationResult } = require('express-validator');
const ConversationService = require('../services/conversationService');

class ConversationController {
  static async list(req, res) {
    try {
      const data = await ConversationService.listConversations(req.user.userId, {
        search: req.query.search || ''
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to load conversations' });
    }
  }

  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });
      }
      const conversation = await ConversationService.createConversation(req.user.userId, req.body.prompt);
      return res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to create conversation' });
    }
  }

  static async getById(req, res) {
    try {
      const conversation = await ConversationService.getConversation(req.user.userId, req.params.conversationId);
      return res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      const status = error.message === 'Conversation not found' ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation Error', errors: errors.array() });
      }
      const data = await ConversationService.sendMessage(
        req.user.userId,
        req.params.conversationId,
        req.body.prompt
      );
      return res.status(201).json({ success: true, data });
    } catch (error) {
      const status = error.message === 'Conversation not found' ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async remove(req, res) {
    try {
      await ConversationService.deleteConversation(req.user.userId, req.params.conversationId);
      return res.status(200).json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
      const status = error.message === 'Conversation not found' ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

module.exports = ConversationController;
