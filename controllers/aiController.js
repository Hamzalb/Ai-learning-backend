const Chat = require('../models/Chat');
const User = require('../models/User');
const { chatWithAI, generateSummary, explainInLebanese, chatStream, summarizeUrl } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

const sendMessage = async (req, res) => {
  const { message, chatId, language, subject } = req.body;

  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return sendError(res, 'Chat session not found.', 404);
    }
  } else {
    chat = await Chat.create({
      userId: req.user._id,
      language: language || req.user.preferences?.language || 'arabic',
      subject: subject || 'general',
      title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      messages: []
    });
  }

  chat.messages.push({ role: 'user', content: message });

  const historyMessages = chat.messages.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const aiResponse = await chatWithAI(historyMessages, chat.language, chat.subject);

  chat.messages.push({ role: 'assistant', content: aiResponse });
  await chat.save();

  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalChats': chat.messages.length === 2 ? 1 : 0 },
    lastActive: Date.now()
  });

  sendSuccess(res, {
    chatId: chat._id,
    message: aiResponse,
    chat
  }, 'Message sent successfully.');
};

const streamMessage = async (req, res) => {
  const { message, chatId, language } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
  }

  const historyMessages = chat
    ? chat.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
    : [];

  historyMessages.push({ role: 'user', content: message });

  const stream = await chatStream(historyMessages, language || 'arabic');
  let fullResponse = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  if (chat) {
    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: fullResponse });
    await chat.save();
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

const getChats = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const chats = await Chat.find({ userId: req.user._id, isArchived: false })
    .select('title subject language createdAt updatedAt messages')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Chat.countDocuments({ userId: req.user._id, isArchived: false });

  const chatsWithCount = chats.map(chat => ({
    _id: chat._id,
    title: chat.title,
    subject: chat.subject,
    language: chat.language,
    messageCount: chat.messages.length,
    lastMessage: chat.messages[chat.messages.length - 1]?.content?.substring(0, 100),
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  }));

  sendSuccess(res, { chats: chatsWithCount, total, page: Number(page), limit: Number(limit) });
};

const getChatById = async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
  if (!chat) return sendError(res, 'Chat not found.', 404);
  sendSuccess(res, { chat });
};

const deleteChat = async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!chat) return sendError(res, 'Chat not found.', 404);
  sendSuccess(res, null, 'Chat deleted successfully.');
};

const summarize = async (req, res) => {
  const { text, language } = req.body;

  if (!text || text.trim().length < 100) {
    return sendError(res, 'Text must be at least 100 characters for summarization.', 400);
  }

  const summary = await generateSummary(text, language || 'lebanese');
  sendSuccess(res, { summary }, 'Summary generated successfully.');
};

const explainConcept = async (req, res) => {
  const { concept, subject, language } = req.body;

  if (!concept) {
    return sendError(res, 'Concept is required.', 400);
  }

  let explanation;
  if (language === 'lebanese') {
    explanation = await explainInLebanese(concept, subject);
  } else {
    const messages = [{ role: 'user', content: `اشرح لي: ${concept}${subject ? ` في مادة ${subject}` : ''}` }];
    explanation = await chatWithAI(messages, language || 'arabic', subject);
  }

  sendSuccess(res, { explanation }, 'Concept explained successfully.');
};

const summarizeUrlEndpoint = async (req, res) => {
  const { url, language } = req.body;
  if (!url || !url.startsWith('http')) return sendError(res, 'Valid URL is required.', 400);
  const summary = await summarizeUrl(url, language || 'arabic');
  sendSuccess(res, { summary, url }, 'URL summarized successfully.');
};

module.exports = {
  sendMessage,
  streamMessage,
  getChats,
  getChatById,
  deleteChat,
  summarize,
  summarizeUrlEndpoint,
  explainConcept
};
