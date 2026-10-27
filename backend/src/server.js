import fs from 'fs';
import path from 'path';
import { app } from './app.js';
import { config } from './config.js';
import { documentProcessor } from './services/documentProcessor.js';
import { sessionStore } from './services/sessionStore.js';

async function bootstrap() {
  app.listen(config.PORT, () => {
    console.log(`🚀 StudyMate AI Node.js Backend listening on port ${config.PORT}`);
    console.log(`📡 Health Check: http://localhost:${config.PORT}/api/health`);
  });
}

bootstrap();
