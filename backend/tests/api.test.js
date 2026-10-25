import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { documentProcessor } from '../src/services/documentProcessor.js';
import { sessionStore } from '../src/services/sessionStore.js';

describe('StudyMate AI Node.js Backend Test Suite', () => {
  before(() => {
    // Setup test session with verified notes
    const sampleNotes =
      '# Chloroplast Structure\n' +
      'The chloroplast contains stroma and thylakoid membranes.\n\n' +
      '## Light-Dependent Reactions\n' +
      'The light-dependent reactions occur specifically within the thylakoid membrane and convert radiant solar energy ' +
      'into chemical energy in the form of ATP and NADPH. The Oxygen-Evolving Complex catalyzes the photolysis of water molecules: ' +
      '2 H2O -> 4 H+ + 4 e- + O2. Molecular oxygen is released as a byproduct.\n\n' +
      '## RuBisCO and Calvin Cycle\n' +
      'RuBisCO is the enzyme responsible for fixing atmospheric CO2 to RuBP in the stroma.';

    const pages = [{ pageNumber: 1, text: sampleNotes }];
    const chunks = documentProcessor.chunkDocument('doc-test-1', 'test_notes.txt', pages);

    sessionStore.createSession('Test QA Session', 'Plant Physiology');
    sessionStore.addDocument(
      {
        id: 'doc-test-1',
        filename: 'test_notes.txt',
        file_type: 'txt',
        session_id: 'default-session',
        topic: 'Plant Physiology',
        word_count: sampleNotes.split(/\s+/).length,
        char_count: sampleNotes.length,
        page_count: 1,
        status: 'processed',
        status_message: 'Verified test notes',
        created_at: new Date().toISOString(),
      },
      chunks
    );
  });

  // Test 1: Upload valid notes and extract text
  it('Test 1: Uploads valid notes and extracts text successfully', async () => {
    const res = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('Photosynthesis generates ATP and oxygen from water and light energy.'), 'sample_bio.txt')
      .field('session_id', 'default-session')
      .field('topic', 'Plant Physiology');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.document.filename, 'sample_bio.txt');
    assert.strictEqual(res.body.document.status, 'processed');
    assert.ok(res.body.chunks_count >= 1);
  });

  // Test 2: Grounded Q&A with supporting evidence
  it('Test 2: Answers question directly supported by notes with exact evidence', async () => {
    const res = await request(app).post('/api/ask').send({
      session_id: 'default-session',
      topic: 'Plant Physiology',
      question: 'What reaction does the Oxygen-Evolving Complex catalyze?',
      language: 'english',
      depth: 'detailed',
      level: 'intermediate',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.has_sufficient_evidence, true);
    assert.ok(res.body.supporting_evidence.length > 0);
    assert.ok(res.body.answer.toLowerCase().includes('photolysis') || res.body.answer.toLowerCase().includes('water'));
    assert.ok(res.body.source_coverage_percent > 0);
  });

  // Test 3: Insufficient evidence refusal
  it('Test 3: Honestly refuses absent question with required limitation statement', async () => {
    const res = await request(app).post('/api/ask').send({
      session_id: 'default-session',
      topic: 'Plant Physiology',
      question: 'What is Quantum Chromodynamics and quark confinement?',
      language: 'english',
      depth: 'detailed',
      level: 'intermediate',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.has_sufficient_evidence, false);
    const requiredPhrase = "I couldn't find sufficient evidence in your supplied notes to answer this question confidently.";
    assert.ok(res.body.answer.includes(requiredPhrase));
    assert.strictEqual(res.body.supporting_evidence.length, 0);
    assert.strictEqual(res.body.source_coverage_percent, 0.0);
  });

  // Test 4: Practice Quiz Generation using only supported material
  it('Test 4: Generates quiz using only supported material', async () => {
    const res = await request(app).post('/api/quiz/generate').send({
      session_id: 'default-session',
      topic: 'Plant Physiology',
      num_questions: 3,
      types: ['multiple_choice', 'true_false', 'short_answer'],
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.questions.length >= 1);
    for (const q of res.body.questions) {
      assert.ok(q.question);
      assert.ok(q.correct_answer);
      assert.ok(q.hint);
      assert.ok(q.explanation);
      assert.ok(q.source_excerpt);
    }
  });

  // Test 5: Submit wrong answer, receive supportive explanation & hint
  it('Test 5: Evaluates wrong answer with supportive explanation and targeted hint', async () => {
    const res = await request(app).post('/api/quiz/evaluate').send({
      session_id: 'default-session',
      question_id: 'q-test-1',
      question: 'What is RuBisCO?',
      question_type: 'multiple_choice',
      student_answer: 'It is a membrane lipid in the cytoplasm',
      correct_answer: 'RuBisCO is the enzyme responsible for fixing atmospheric CO2 to RuBP in the stroma.',
      concept: 'RuBisCO',
      source_excerpt: 'RuBisCO is the enzyme responsible for fixing atmospheric CO2 to RuBP in the stroma.',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.is_correct, false);
    assert.strictEqual(res.body.score, 0.0);
    assert.ok(res.body.feedback);
    assert.ok(res.body.correction_explanation);
    assert.ok(res.body.targeted_hint);
    assert.ok(res.body.revision_recommendation);
  });

  // Test 6: Handle empty notes and invalid files
  it('Test 6: Validates and rejects empty notes, invalid extensions, and blank pasted text', async () => {
    // Empty upload
    const emptyRes = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from(''), 'empty.txt');
    assert.strictEqual(emptyRes.status, 400);

    // Unsupported extension
    const invalidExtRes = await request(app)
      .post('/api/documents')
      .attach('file', Buffer.from('binary-content'), 'bad.exe');
    assert.strictEqual(invalidExtRes.status, 400);

    // Blank paste
    const blankPasteRes = await request(app).post('/api/notes').send({
      title: 'Blank',
      content: '   ',
      topic: 'Test',
      session_id: 'default-session',
    });
    assert.strictEqual(blankPasteRes.status, 400);
  });

  // Test 7 & 10: Security, status, and API key isolation
  it('Test 7 & 10: AI status endpoint does not leak secrets or private keys', async () => {
    const res = await request(app).get('/api/ai/status');
    assert.strictEqual(res.status, 200);
    const bodyStr = JSON.stringify(res.body);
    assert.ok(!bodyStr.includes('your_gemma_api_key'));
    assert.strictEqual(res.body.anti_hallucination_guardrails, 'active');
  });

  // Test 8: Sessions and progress persistence
  it('Test 8: Manages session lifecycle and tracks learning progress accurately', async () => {
    const createRes = await request(app).post('/api/sessions').send({
      name: 'Computer Networks Session',
      topic: 'TCP/IP Protocols',
    });
    assert.strictEqual(createRes.status, 200);
    const sessId = createRes.body.id;

    const listRes = await request(app).get('/api/sessions');
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.body.some((s) => s.id === sessId));

    const progRes = await request(app).get(`/api/progress?session_id=${sessId}`);
    assert.strictEqual(progRes.status, 200);
    assert.strictEqual(progRes.body.current_topic, 'TCP/IP Protocols');

    const delRes = await request(app).delete(`/api/sessions/${sessId}`);
    assert.strictEqual(delRes.status, 200);
  });

  // Multi-lingual & Adaptive levels
  it('Tests Hindi/Hinglish mode and beginner level adjustments', async () => {
    const res = await request(app).post('/api/ask').send({
      session_id: 'default-session',
      topic: 'Plant Physiology',
      question: 'Where do light-dependent reactions occur?',
      language: 'hinglish',
      depth: 'step_by_step',
      level: 'beginner',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.language, 'hinglish');
    assert.ok(res.body.answer.toLowerCase().includes('notes') || res.body.answer.toLowerCase().includes('thylakoid'));
  });
});
