class LlmService {
  static async generateReply(prompt, conversation = null) {
    const trimmed = (prompt || '').trim();
    const lower = trimmed.toLowerCase();
    const recentMessages = (conversation?.messages || []).slice(-6);
    const previousUserPrompts = recentMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .slice(-2);

    let response;

    if (/\bhello\b|\bhi\b|\bhey\b/.test(lower)) {
      response = 'Hey — I am ready. Ask me a question and I will keep the conversation going in this thread.';
    } else if (lower.includes('summarize')) {
      response = `Here is a quick summary of your request: ${trimmed.replace(/summarize[:\s]*/i, '').trim() || 'you want a concise overview.'}`;
    } else if (lower.includes('help') || lower.startsWith('how')) {
      response = `Here is a practical way to approach that:\n\n1. Break the problem into smaller pieces.\n2. Decide what output you need first.\n3. Test one step at a time.\n\nYour latest question was: "${trimmed}".`;
    } else if (trimmed.endsWith('?')) {
      response = `My best answer: ${trimmed.replace(/\?+$/, '')} depends on the context, but the main idea is to start with the simplest working version, then refine it.`;
    } else {
      response = `You said: "${trimmed}". I saved that in this conversation and you can keep going from here.`;
    }

    if (previousUserPrompts.length > 1) {
      response += `\n\nI am also keeping context from earlier messages in this thread, including: ${previousUserPrompts.join(' | ')}.`;
    }

    return response;
  }
}

module.exports = LlmService;
