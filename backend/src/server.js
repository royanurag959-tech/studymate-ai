import fs from 'fs';
import path from 'path';
import { app } from './app.js';
import { config } from './config.js';
import { documentProcessor } from './services/documentProcessor.js';
import { sessionStore } from './services/sessionStore.js';

async function bootstrap() {
  // Pre-populate default session with verified sample biology notes
  try {
    const samplePath = path.join(config.SAMPLE_NOTES_DIR, 'photosynthesis_notes.txt');
    if (fs.existsSync(samplePath)) {
      const content = fs.readFileSync(samplePath, 'utf-8');
      const docId = 'doc-default-photo';
      const pages = [{ pageNumber: 1, text: content }];
      const chunks = documentProcessor.chunkDocument(docId, 'photosynthesis_notes.txt', pages);

      const metadata = {
        id: docId,
        filename: 'photosynthesis_notes.txt',
        file_type: 'txt',
        session_id: 'default-session',
        topic: 'Plant Physiology & Cellular Respiration',
        word_count: content.split(/\s+/).filter(Boolean).length,
        char_count: content.length,
        page_count: 1,
        status: 'processed',
        status_message: 'Preloaded verified study notes on Plant Physiology.',
        created_at: new Date().toISOString(),
      };

      sessionStore.addDocument(metadata, chunks);
      console.log('✅ Preloaded sample notes into default study session.');
    }
  } catch (err) {
    console.warn('Warning: Could not pre-populate sample notes:', err.message);
  }

  app.listen(config.PORT, () => {
    console.log(`🚀 StudyMate AI Node.js Backend listening on port ${config.PORT}`);
    console.log(`📡 Health Check: http://localhost:${config.PORT}/api/health`);
  });
}

bootstrap();
