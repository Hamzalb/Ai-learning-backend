const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const User = require('../models/User');
const { extractText, cleanText } = require('../services/ocrService');
const { generateSummary } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

const uploadDocument = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded.', 400);
  }

  const { title, subject } = req.body;
  const { filename, originalname, size, mimetype, path: filePath } = req.file;

  const doc = await Document.create({
    title: title || originalname.replace(/\.[^/.]+$/, ''),
    filename,
    originalName: originalname,
    fileUrl: `/uploads/${filename}`,
    fileSize: size,
    mimeType: mimetype,
    subject: subject || 'General',
    userId: req.user._id,
    processingStatus: 'processing'
  });

  extractAndProcess(doc._id, filePath, mimetype).catch(err => {
    console.error('OCR processing error:', err);
  });

  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalDocuments': 1 },
    lastActive: Date.now()
  });

  sendSuccess(res, { document: doc }, 'File uploaded successfully. Processing started.', 201);
};

const extractAndProcess = async (docId, filePath, mimeType) => {
  try {
    const result = await extractText(filePath, mimeType);
    const cleaned = cleanText(result.text || '');

    await Document.findByIdAndUpdate(docId, {
      extractedText: cleaned,
      pageCount: result.pages || 1,
      processingStatus: cleaned.length > 10 ? 'completed' : 'failed'
    });
  } catch (error) {
    console.error(`OCR failed for doc ${docId}:`, error.message);
    try {
      await Document.findByIdAndUpdate(docId, { processingStatus: 'failed' });
    } catch (updateErr) {
      console.error('Failed to update doc status:', updateErr.message);
    }
  }
};

const getDocuments = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const docs = await Document.find({ userId: req.user._id })
    .select('-extractedText')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Document.countDocuments({ userId: req.user._id });

  sendSuccess(res, { documents: docs, total, page: Number(page), limit: Number(limit) });
};

const getDocumentById = async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) return sendError(res, 'Document not found.', 404);
  sendSuccess(res, { document: doc });
};

const generateDocumentSummary = async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) return sendError(res, 'Document not found.', 404);

  if (doc.processingStatus !== 'completed') {
    return sendError(res, 'Document is still being processed. Please wait.', 400);
  }

  if (!doc.extractedText || doc.extractedText.length < 100) {
    return sendError(res, 'Not enough text content to generate a summary.', 400);
  }

  const { language = 'lebanese' } = req.body;
  const summary = await generateSummary(doc.extractedText, language);

  await Document.findByIdAndUpdate(doc._id, { summary });

  sendSuccess(res, { summary }, 'Summary generated successfully.');
};

const deleteDocument = async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) return sendError(res, 'Document not found.', 404);

  const filePath = path.join(__dirname, '../uploads', doc.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Document.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalDocuments': -1 }
  });

  sendSuccess(res, null, 'Document deleted successfully.');
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  generateDocumentSummary,
  deleteDocument
};
