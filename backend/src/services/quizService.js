import { v4 as uuidv4 } from 'uuid';

export class QuizService {
  generateQuizFromChunks(chunks, topic, numQuestions = 4, allowedTypes = ['multiple_choice', 'true_false', 'short_answer']) {
    if (!chunks || chunks.length === 0) return [];

    const questions = [];
    const sentencesWithChunks = [];

    for (const chunk of chunks) {
      const rawSentences = chunk.content.split(/(?<=[.!?])\s+/);
      for (const s of rawSentences) {
        const cleanS = s.trim();
        if (cleanS.length >= 45 && !cleanS.endsWith('?')) {
          sentencesWithChunks.push({ sentence: cleanS, chunk });
        }
      }
    }

    if (sentencesWithChunks.length === 0) return [];

    // Deterministic selection
    const step = Math.max(1, Math.floor(sentencesWithChunks.length / numQuestions));
    let qIdx = 1;

    for (let i = 0; i < sentencesWithChunks.length && questions.length < numQuestions; i += step) {
      const { sentence, chunk } = sentencesWithChunks[i];
      const qType = allowedTypes[(qIdx - 1) % allowedTypes.length];
      const derivedDocName = (chunk.source_filename || '').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const conceptName = chunk.section_title || (topic && topic !== 'General Study Material' && topic !== 'Plant Physiology & Cellular Respiration' ? topic : derivedDocName) || 'Study Material';

      if (qType === 'multiple_choice') {
        const words = sentence.split(/\s+/).filter((w) => w.length > 4);
        const keyWord = words[Math.floor(words.length / 2)] || 'process';

        const distractors = [
          `Secondary ${keyWord.toLowerCase()} bypass`,
          `External ${keyWord.toLowerCase()} degradation`,
          `Static equilibrium buffer`,
        ];

        const options = [
          sentence,
          ...distractors.map((d) =>
            sentence.includes(keyWord)
              ? sentence.replace(keyWord, d)
              : `Alternative hypothesis: ${d}`
          ),
        ];

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        questions.push({
          id: `q-${uuidv4().slice(0, 8)}`,
          question_type: 'multiple_choice',
          question: `According to your study notes on '${conceptName}', which of the following statements is accurate?`,
          options,
          correct_answer: sentence,
          hint: `Review the section on '${conceptName}' in ${chunk.source_filename}.`,
          explanation: `Directly supported by the notes: "${sentence}"`,
          source_excerpt: sentence,
          source_filename: chunk.source_filename,
          page_number: chunk.page_number,
          concept: conceptName,
        });
        qIdx++;
      } else if (qType === 'true_false') {
        const isTrue = qIdx % 2 === 1;
        const statement = isTrue
          ? sentence
          : `Contrary to the notes, ${sentence.charAt(0).toLowerCase() + sentence.slice(1)} is entirely independent of the underlying mechanism.`;
        const correctAns = isTrue ? 'True' : 'False';

        questions.push({
          id: `q-${uuidv4().slice(0, 8)}`,
          question_type: 'true_false',
          question: `True or False: ${statement}`,
          options: ['True', 'False'],
          correct_answer: correctAns,
          hint: `Check the factual details stated in ${chunk.source_filename} under ${conceptName}.`,
          explanation: `The source material states: "${sentence}". Therefore, this statement is ${correctAns}.`,
          source_excerpt: sentence,
          source_filename: chunk.source_filename,
          page_number: chunk.page_number,
          concept: conceptName,
        });
        qIdx++;
      } else if (qType === 'short_answer') {
        questions.push({
          id: `q-${uuidv4().slice(0, 8)}`,
          question_type: 'short_answer',
          question: `Based on the notes on '${conceptName}', summarize the primary role or mechanism described regarding: "${sentence.slice(0, 60)}..."`,
          options: null,
          correct_answer: sentence,
          hint: `Focus on the exact definition provided in ${chunk.source_filename}.`,
          explanation: `The notes state: "${sentence}"`,
          source_excerpt: sentence,
          source_filename: chunk.source_filename,
          page_number: chunk.page_number,
          concept: conceptName,
        });
        qIdx++;
      }
    }

    return questions;
  }

  evaluateAnswer({ questionId, question, questionType, studentAnswer, correctAnswer, concept, sourceExcerpt }) {
    const studentAns = (studentAnswer || '').trim();
    const correctAns = (correctAnswer || '').trim();

    let isCorrect = false;
    let score = 0.0;

    if (questionType === 'multiple_choice' || questionType === 'true_false') {
      isCorrect = studentAns.toLowerCase() === correctAns.toLowerCase();
      score = isCorrect ? 1.0 : 0.0;
    } else {
      // Short answer token overlap
      const studentTokens = new Set((studentAns.toLowerCase().match(/[a-zA-Z0-9]+/g) || []));
      const targetTokens = new Set(
        ((correctAns + ' ' + (sourceExcerpt || '')).toLowerCase().match(/[a-zA-Z0-9]+/g) || [])
      );
      const common = [...studentTokens].filter((t) => targetTokens.has(t));
      const overlapRatio = common.length / Math.max(studentTokens.size, 1);

      if (overlapRatio >= 0.45 || common.length >= 4) {
        isCorrect = true;
        score = 1.0;
      } else if (overlapRatio >= 0.25 || common.length >= 2) {
        isCorrect = false;
        score = 0.5;
      } else {
        isCorrect = false;
        score = 0.0;
      }
    }

    if (isCorrect) {
      return {
        is_correct: true,
        score,
        feedback: `Great work! You accurately understood the concept of '${concept}' as outlined in your study material.`,
        concept_understood: concept,
        correction_explanation: `Your answer aligns with the notes: "${sourceExcerpt}"`,
        targeted_hint: 'You have this concept mastered! You can move on to the next practice question.',
        revision_recommendation: `Review completed for '${concept}'. Keep your momentum going!`,
        next_practice_prompt: `Can you explain how '${concept}' connects to other parts of the topic?`,
        supporting_evidence: sourceExcerpt,
      };
    } else {
      return {
        is_correct: false,
        score,
        feedback: `Not quite, but this is a great learning opportunity. Let's look at what your notes say about '${concept}'.`,
        concept_understood: `Needs review: ${concept}`,
        correction_explanation: `The correct understanding based on your notes is:\n"${correctAns}"\n\nSupporting passage from notes: "${sourceExcerpt}"`,
        targeted_hint: `Pay close attention to key terms mentioned in the section on '${concept}'.`,
        revision_recommendation: `Re-read the section on '${concept}' in your uploaded notes.`,
        next_practice_prompt: `Would you like another practice question focusing specifically on '${concept}'?`,
        supporting_evidence: sourceExcerpt,
      };
    }
  }
}

export const quizService = new QuizService();
