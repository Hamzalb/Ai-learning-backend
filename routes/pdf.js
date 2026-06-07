const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, getDocumentById, generateDocumentSummary, deleteDocument } = require('../controllers/pdfController');
const { protect } = require('../middleware/auth');
const { uploadRateLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/upload', uploadRateLimiter, upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/:id/summarize', generateDocumentSummary);
router.delete('/:id', deleteDocument);

module.exports = router;
