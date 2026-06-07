const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return {
    text: data.text,
    pages: data.numpages,
    info: data.info
  };
};

const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, 'ara+eng', {
    logger: () => {}
  });
  return {
    text: result.data.text,
    confidence: result.data.confidence
  };
};

const extractText = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(filePath);
  }

  if (mimeType.startsWith('image/')) {
    return extractTextFromImage(filePath);
  }

  throw new Error('Unsupported file type for text extraction');
};

const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
};

module.exports = { extractText, cleanText };
