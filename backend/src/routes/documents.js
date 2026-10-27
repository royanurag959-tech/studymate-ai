import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { documentProcessor } from '../services/documentProcessor.js';
import { sessionStore } from '../services/sessionStore.js';
import { config } from '../config.js';

const upload = multer({
  limits: { fileSize: config.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

export const documentsRouter = Router();

documentsRouter.post('/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded or file is empty.' });
    }

    const { originalname, buffer } = req.file;
    const sessionId = req.body.session_id || 'default-session';
    const derivedTopic = originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const topic = (req.body.topic && req.body.topic !== 'Plant Physiology & Cellular Respiration' && req.body.topic !== 'General Study Material' && req.body.topic !== 'General Topic')
      ? req.body.topic
      : derivedTopic;

    if (buffer.length === 0) {
      return res.status(400).json({ detail: 'The uploaded file is empty. Please provide notes with content.' });
    }

    const ext = path.extname(originalname).toLowerCase();
    if (!['.pdf', '.txt', '.md'].includes(ext)) {
      return res.status(400).json({
        detail: `Unsupported file format '${ext}'. StudyMate AI supports .pdf, .txt, and .md files.`,
      });
    }

    const docId = `doc-${uuidv4().slice(0, 8)}`;
    let fullText = '';
    let pages = [];
    let isScanned = false;

    if (ext === '.pdf') {
      const extracted = await documentProcessor.extractFromPdf(buffer, originalname);
      fullText = extracted.fullText;
      pages = extracted.pages;
      isScanned = extracted.isScanned;
    } else {
      const extracted = documentProcessor.extractFromTxt(buffer, originalname);
      fullText = extracted.fullText;
      pages = extracted.pages;
    }

    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const charCount = fullText.length;
    const pageCount = pages.length;

    let status = 'processed';
    let statusMsg = 'Successfully extracted and chunked.';

    if (isScanned || wordCount < 10) {
      status = 'warning_scanned';
      statusMsg =
        'OCR Notice: Extracted text is very short or appears to be a scanned image. For best results with Gemma 4, ensure your PDF contains selectable digital text.';
    }

    const chunks = documentProcessor.chunkDocument(docId, originalname, pages);

    const metadata = {
      id: docId,
      filename: originalname,
      file_type: ext.replace('.', ''),
      session_id: sessionId,
      topic,
      word_count: wordCount,
      char_count: charCount,
      page_count: pageCount,
      status,
      status_message: statusMsg,
      created_at: new Date().toISOString(),
    };

    sessionStore.addDocument(metadata, chunks);

    const currentSession = sessionStore.getSession(sessionId);
    if (currentSession && (currentSession.topic === 'General Study Material' || currentSession.topic === 'Plant Physiology & Cellular Respiration' || currentSession.document_count <= 1)) {
      sessionStore.updateSession(sessionId, derivedTopic, topic);
    }

    const previewText = fullText.slice(0, 400) + (fullText.length > 400 ? '...' : '');

    return res.json({
      document: metadata,
      extracted_preview: previewText,
      chunks_count: chunks.length,
    });
  } catch (err) {
    return res.status(422).json({ detail: `Failed to process document: ${err.message}` });
  }
});

documentsRouter.post('/notes', (req, res) => {
  const { title, content, topic, session_id } = req.body;
  const cleanContent = (content || '').trim();

  if (!cleanContent) {
    return res.status(400).json({ detail: 'Pasted notes cannot be empty.' });
  }

  const cleanTitle = (title || '').trim() || 'Pasted Notes';
  const sessionId = session_id || 'default-session';
  const activeTopic = (topic && topic !== 'Plant Physiology & Cellular Respiration' && topic !== 'General Study Material' && topic !== 'General Topic')
    ? topic
    : cleanTitle;

  const docId = `doc-${uuidv4().slice(0, 8)}`;
  const filename = `${cleanTitle}.txt`;
  const sanitized = documentProcessor.sanitizeUntrustedStudyText(cleanContent);
  const pages = [{ pageNumber: 1, text: sanitized }];

  const chunks = documentProcessor.chunkDocument(docId, filename, pages);
  const wordCount = sanitized.split(/\s+/).filter(Boolean).length;

  const metadata = {
    id: docId,
    filename,
    file_type: 'txt',
    session_id: sessionId,
    topic: activeTopic,
    word_count: wordCount,
    char_count: sanitized.length,
    page_count: 1,
    status: 'processed',
    status_message: 'Directly saved from notes editor.',
    created_at: new Date().toISOString(),
  };

  sessionStore.addDocument(metadata, chunks);

  const currentSession = sessionStore.getSession(sessionId);
  if (currentSession && (currentSession.topic === 'General Study Material' || currentSession.topic === 'Plant Physiology & Cellular Respiration' || currentSession.document_count <= 1)) {
    sessionStore.updateSession(sessionId, cleanTitle, activeTopic);
  }

  const previewText = sanitized.slice(0, 400) + (sanitized.length > 400 ? '...' : '');

  return res.json({
    document: metadata,
    extracted_preview: previewText,
    chunks_count: chunks.length,
  });
});

documentsRouter.get('/documents', (req, res) => {
  const sessionId = req.query.session_id || 'default-session';
  const docs = sessionStore.getDocumentsForSession(sessionId);
  return res.json(docs);
});

documentsRouter.delete('/documents/:id', (req, res) => {
  const sessionId = req.query.session_id || 'default-session';
  const deleted = sessionStore.deleteDocument(sessionId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ detail: 'Document not found.' });
  }
  return res.json({ message: 'Document deleted successfully.' });
});

documentsRouter.post('/documents/load-sample', (req, res) => {
  const sampleType = req.body.sample_type || 'photosynthesis';
  const sessionId = req.body.session_id || 'default-session';

  let filename = 'photosynthesis_notes.txt';
  let topic = 'Plant Physiology & Cellular Respiration';

  if (sampleType === 'networks') {
    filename = 'computer_networks_notes.txt';
    topic = 'Computer Networks & Internet Protocols';
  }

  const filePath = path.join(config.SAMPLE_NOTES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ detail: 'Sample notes file not found.' });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const docId = `doc-${uuidv4().slice(0, 8)}`;
  const pages = [{ pageNumber: 1, text: content }];
  const chunks = documentProcessor.chunkDocument(docId, filename, pages);

  const metadata = {
    id: docId,
    filename,
    file_type: 'txt',
    session_id: sessionId,
    topic,
    word_count: content.split(/\s+/).filter(Boolean).length,
    char_count: content.length,
    page_count: 1,
    status: 'processed',
    status_message: `Preloaded verified sample notes on ${topic}.`,
    created_at: new Date().toISOString(),
  };

  sessionStore.addDocument(metadata, chunks);
  sessionStore.updateSession(sessionId, undefined, topic);

  return res.json({
    message: `Successfully loaded sample notes for ${topic}.`,
    document: metadata,
    chunks_count: chunks.length,
  });
});
