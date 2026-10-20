import re
import uuid
import random
from typing import List, Dict, Any, Optional
from ..models.schemas import DocumentChunk, QuizQuestion, QuizEvaluateRequest, QuizEvaluateResponse

class QuizService:
    """
    Generates and evaluates practice quizzes grounded strictly in the supplied study notes.
    """

    def generate_quiz_from_chunks(
        self,
        chunks: List[DocumentChunk],
        topic: str,
        num_questions: int = 4,
        allowed_types: Optional[List[str]] = None
    ) -> List[QuizQuestion]:
        """
        Parses factual sentences from chunks and synthesizes grounded questions.
        """
        if not chunks:
            return []

        if not allowed_types:
            allowed_types = ["multiple_choice", "true_false", "short_answer"]

        questions: List[QuizQuestion] = []
        sentences_with_chunks = []

        for chunk in chunks:
            # Split into clean factual sentences (at least 35 characters)
            raw_sentences = re.split(r'(?<=[.!?])\s+', chunk.content)
            for s in raw_sentences:
                clean_s = s.strip()
                if len(clean_s) >= 45 and not clean_s.endswith("?"):
                    sentences_with_chunks.append((clean_s, chunk))

        if not sentences_with_chunks:
            return []

        # Shuffle candidate sentences deterministically or randomly
        random.seed(42 + len(chunks))
        selected_candidates = random.sample(sentences_with_chunks, min(len(sentences_with_chunks), num_questions * 2))

        q_idx = 1
        for sentence, chunk in selected_candidates:
            if len(questions) >= num_questions:
                break

            q_type = allowed_types[(q_idx - 1) % len(allowed_types)]
            concept_name = chunk.section_title or topic

            if q_type == "multiple_choice":
                # Look for key phrase or noun to form a question
                words = [w.strip('.,;:') for w in sentence.split() if len(w) > 4]
                if not words:
                    continue
                key_word = words[len(words) // 2]
                
                # Create plausible distractors
                distractors = [
                    f"Secondary {key_word.lower()} bypass",
                    f"External {key_word.lower()} degradation",
                    f"Static equilibrium buffer"
                ]
                options = [sentence] + [
                    sentence.replace(key_word, d, 1) if key_word in sentence else f"Alternative hypothesis: {d}"
                    for d in distractors[:3]
                ]
                random.shuffle(options)
                
                # Question prompt
                q_text = f"According to your study notes on '{concept_name}', which of the following statements is accurate?"
                hint_text = f"Review the section on '{concept_name}' in {chunk.source_filename}."
                explanation_text = f"Directly supported by the notes: \"{sentence}\""

                questions.append(
                    QuizQuestion(
                        id=f"q-{uuid.uuid4().hex[:8]}",
                        question_type="multiple_choice",
                        question=q_text,
                        options=options,
                        correct_answer=sentence,
                        hint=hint_text,
                        explanation=explanation_text,
                        source_excerpt=sentence,
                        source_filename=chunk.source_filename,
                        page_number=chunk.page_number,
                        concept=concept_name
                    )
                )
                q_idx += 1

            elif q_type == "true_false":
                is_true = (q_idx % 2 == 1)
                statement = sentence if is_true else f"Contrary to the notes, {sentence[:1].lower() + sentence[1:]} is entirely independent of the underlying mechanism."
                correct_ans = "True" if is_true else "False"
                q_text = f"True or False: {statement}"
                hint_text = f"Check the factual details stated in {chunk.source_filename} under {concept_name}."
                explanation_text = f"The source material states: \"{sentence}\". Therefore, this statement is {correct_ans}."

                questions.append(
                    QuizQuestion(
                        id=f"q-{uuid.uuid4().hex[:8]}",
                        question_type="true_false",
                        question=q_text,
                        options=["True", "False"],
                        correct_answer=correct_ans,
                        hint=hint_text,
                        explanation=explanation_text,
                        source_excerpt=sentence,
                        source_filename=chunk.source_filename,
                        page_number=chunk.page_number,
                        concept=concept_name
                    )
                )
                q_idx += 1

            elif q_type == "short_answer":
                q_text = f"Based on the notes on '{concept_name}', summarize the primary role or mechanism described regarding: \"{sentence[:60]}...\""
                hint_text = f"Focus on the exact definition provided in {chunk.source_filename}."
                explanation_text = f"The notes state: \"{sentence}\""

                questions.append(
                    QuizQuestion(
                        id=f"q-{uuid.uuid4().hex[:8]}",
                        question_type="short_answer",
                        question=q_text,
                        options=None,
                        correct_answer=sentence,
                        hint=hint_text,
                        explanation=explanation_text,
                        source_excerpt=sentence,
                        source_filename=chunk.source_filename,
                        page_number=chunk.page_number,
                        concept=concept_name
                    )
                )
                q_idx += 1

        return questions

    def evaluate_answer(self, req: QuizEvaluateRequest) -> QuizEvaluateResponse:
        student_ans = req.student_answer.strip()
        correct_ans = req.correct_answer.strip()

        is_correct = False
        score = 0.0

        if req.question_type in ["multiple_choice", "true_false"]:
            is_correct = student_ans.lower() == correct_ans.lower()
            score = 1.0 if is_correct else 0.0
        else:
            # Short answer: calculate token overlap with correct answer or source excerpt
            student_tokens = set(re.findall(r'[a-zA-Z0-9]+', student_ans.lower()))
            correct_tokens = set(re.findall(r'[a-zA-Z0-9]+', (correct_ans + " " + req.source_excerpt).lower()))
            common = student_tokens.intersection(correct_tokens)
            overlap_ratio = len(common) / max(len(student_tokens), 1)

            if overlap_ratio >= 0.45 or len(common) >= 4:
                is_correct = True
                score = 1.0
            elif overlap_ratio >= 0.25 or len(common) >= 2:
                is_correct = False
                score = 0.5
            else:
                is_correct = False
                score = 0.0

        if is_correct:
            feedback = f"Great work! You accurately understood the concept of '{req.concept}' as outlined in your study material."
            concept_understood = req.concept
            correction_explanation = f"Your answer aligns with the notes: \"{req.source_excerpt}\""
            targeted_hint = "You have this concept mastered! You can move on to the next practice question."
            revision_recommendation = f"Review completed for '{req.concept}'. Keep your momentum going!"
            next_practice = f"Can you explain how '{req.concept}' connects to other parts of the topic?"
        else:
            feedback = f"Not quite, but this is a great learning opportunity. Let's look at what your notes say about '{req.concept}'."
            concept_understood = f"Needs review: {req.concept}"
            correction_explanation = (
                f"The correct understanding based on your notes is:\n\"{correct_ans}\"\n\n"
                f"Supporting passage from notes: \"{req.source_excerpt}\""
            )
            targeted_hint = f"Pay close attention to key terms mentioned in the section on '{req.concept}'."
            revision_recommendation = f"Re-read the section on '{req.concept}' in your uploaded notes."
            next_practice = f"Would you like another practice question focusing specifically on '{req.concept}'?"

        return QuizEvaluateResponse(
            is_correct=is_correct,
            score=score,
            feedback=feedback,
            concept_understood=concept_understood,
            correction_explanation=correction_explanation,
            targeted_hint=targeted_hint,
            revision_recommendation=revision_recommendation,
            next_practice_prompt=next_practice,
            supporting_evidence=req.source_excerpt
        )

quiz_service = QuizService()
