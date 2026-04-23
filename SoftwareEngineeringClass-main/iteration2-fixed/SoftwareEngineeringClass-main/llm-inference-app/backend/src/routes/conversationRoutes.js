const express = require('express');
const { body } = require('express-validator');
const ConversationController = require('../controllers/conversationController');
const handleValidationErrors = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', ConversationController.list);
router.post(
  '/',
  [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 1 })
      .withMessage('Prompt must not be empty')
  ],
  handleValidationErrors,
  ConversationController.create
);
router.get('/:conversationId', ConversationController.getById);
router.post(
  '/:conversationId/messages',
  [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 1 })
      .withMessage('Prompt must not be empty')
  ],
  handleValidationErrors,
  ConversationController.sendMessage
);
router.delete('/:conversationId', ConversationController.remove);

module.exports = router;
