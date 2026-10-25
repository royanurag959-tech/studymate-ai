import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { v4 as uuidv4 } from 'uuid';

export class DocumentProcessor {
  constructor(maxChunkWords = 220, overlapWords = 40) {
    this.maxChunkWords = maxChunkWords;
    this.overlapWords = overlapWords;
  }

  sanitizeUntrustedStudyText(text) {
    if (!text) return '';
    // Remove control characters (except newline, tab)
    return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  }

  extractFromTxt(buffer, filename) {
    let fullText = '';
    try {
      fullText = buffer.toString('utf-8');
    } catch {
      fullText = buffer.toString('latin1');
    }

    fullText = this.sanitizeUntrustedStudyText(fullText);
    const pages = fullText.split('\x0c');
    let pageTuples = pages
      .map((p, idx) => ({ pageNumber: idx + 1, text: p.trim() }))
      .filter((p) => p.text.length > 0);

    if (pageTuples.length === 0) {
      pageTuples = [{ pageNumber: 1, text: fullText.trim() }];
    }

    return { fullText, pages: pageTuples, isScanned: false };
  }

  async extractFromPdf(buffer, filename) {
    try {
      const data = await pdfParse(buffer);
      const fullText = this.sanitizeUntrustedStudyText(data.text || '').trim();
      const numPages = data.numpages || 1;

      // Split pages by form feed if present, or create synthetic pages
      let pages = [];
      if (fullText.includes('\x0c')) {
        const rawPages = fullText.split('\x0c');
        pages = rawPages.map((p, i) => ({ pageNumber: i + 1, text: p.trim() }));
      } else {
        pages = [{ pageNumber: 1, text: fullText }];
      }

      const avgCharsPerPage = fullText.length / Math.max(numPages, 1);
      const isScanned = numPages > 0 && avgCharsPerPage < 30;

      return { fullText, pages, isScanned };
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  }

  chunkDocument(docId, filename, pages) {
    const chunks = [];

    for (const page of pages) {
      const { pageNumber, text } = page;
      if (!text || !text.trim()) continue;

      const rawParagraphs = text.split(/\n{2,}/);
      let currentSection = 'General Overview';
      let accumulatedWords = [];
      let chunkStartChar = 0;

      for (const para of rawParagraphs) {
        const cleanPara = para.trim();
        if (!cleanPara) continue;

        // Detect section headers
        const headerMatch = cleanPara.match(/^(?:#{1,4}\s+|[0-9]+\.\s+)?([A-Z][A-Za-z0-9\s\-_:]{3,50})$/);
        if (headerMatch && cleanPara.split(/\s+/).length < 10) {
          currentSection = headerMatch[1].trim();
        }

        const words = cleanPara.split(/\s+/);
        if (accumulatedWords.length + words.length <= this.maxChunkWords) {
          accumulatedWords.push(...words);
        } else {
          const chunkText = accumulatedWords.join(' ');
          if (chunkText.trim()) {
            chunks.push({
              id: uuidv4(),
              doc_id: docId,
              source_filename: filename,
              page_number: pageNumber,
              section_title: currentSection,
              content: chunkText,
              start_char: chunkStartChar,
              end_char: chunkStartChar + chunkText.length,
            });
          }

          const overlap =
            accumulatedWords.length > this.overlapWords
              ? accumulatedWords.slice(-this.overlapWords)
              : accumulatedWords;
          accumulatedWords = [...overlap, ...words];
          chunkStartChar += chunkText.length;
        }
      }

      if (accumulatedWords.length > 0) {
        const chunkText = accumulatedWords.join(' ');
        if (chunkText.trim()) {
          chunks.push({
            id: uuidv4(),
            doc_id: docId,
            source_filename: filename,
            page_number: pageNumber,
            section_title: currentSection,
            content: chunkText,
            start_char: chunkStartChar,
            end_char: chunkStartChar + chunkText.length,
          });
        }
      }
    }

    return chunks;
  }
}

export const documentProcessor = new DocumentProcessor();
