import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuizView = ({
  topic,
  sessionId,
  hasDocuments,
  onGenerateQuiz,
  onEvaluateAnswer,
  onNavigateToNotes,
}) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // Student answer state for current question
  const [selectedOption, setSelectedOption] = useState('');
  const [shortAnswerInput, setShortAnswerInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Completed quiz summary state
  const [quizFinished, setQuizFinished] = useState(false);
  const [resultsHistory, setResultsHistory] = useState([]);

  const handleStartQuiz = async (count = 4) => {
    setIsGenerating(true);
    setGenerateError(null);
    setQuizFinished(false);
    setResultsHistory([]);
    setCurrentIndex(0);
    resetQuestionState();

    try {
      const qList = await onGenerateQuiz(count);
      if (qList.length === 0) {
        setGenerateError(
          'Your notes are too brief or no documents are uploaded yet to generate a grounded quiz. Please add study notes first.'
        );
      } else {
        setQuestions(qList);
      }
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetQuestionState = () => {
    setSelectedOption('');
    setShortAnswerInput('');
    setShowHint(false);
    setEvaluation(null);
    setShowExplanation(false);
  };

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQ || isEvaluating) return;

    const answer =
      currentQ.question_type === 'short_answer'
        ? shortAnswerInput.trim()
        : selectedOption.trim();

    if (!answer) return;

    setIsEvaluating(true);
    try {
      const evalResp = await onEvaluateAnswer(
        currentQ.id,
        currentQ.question,
        currentQ.question_type,
        answer,
        currentQ.correct_answer,
        currentQ.concept,
        currentQ.source_excerpt
      );

      setEvaluation(evalResp);
      setShowExplanation(true);

      // Save to results history
      setResultsHistory((prev) => [
        ...prev,
        { question: currentQ, studentAnswer: answer, evaluation: evalResp },
      ]);
    } catch (err) {
      alert(`Error evaluating answer: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      resetQuestionState();
    } else {
      setQuizFinished(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const totalQuestions = resultsHistory.length;
  const correctCount = resultsHistory.filter((r) => r.evaluation.is_correct).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Practice Quiz & Feedback</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test your recall with questions grounded exclusively in your uploaded study material.
            </p>
          </div>

          {!quizFinished && questions.length === 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartQuiz(4)}
                disabled={isGenerating || !hasDocuments}
                className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGenerating ? 'Generating Quiz...' : 'Generate New Quiz (4 Qs)'}</span>
              </button>
            </div>
          )}
        </div>

        {generateError && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-amber-50 p-3.5 text-xs text-amber-800 border border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{generateError}</span>
            </div>
            <button
              onClick={onNavigateToNotes}
              className="font-bold text-teal-700 hover:underline shrink-0"
            >
              Upload Notes
            </button>
          </div>
        )}
      </div>

      {/* Start Quiz Prompt / Empty State */}
      {!quizFinished && questions.length === 0 && !isGenerating && !generateError && (
        <div className="rounded-xl bg-white p-10 shadow-xs border border-slate-200/80 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-4">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Adaptive Practice Quizzes</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Gemma 4 examines your uploaded notes on "{topic}" and creates multiple-choice, true/false, and short-answer questions. Every question is backed by an excerpt from your notes.
          </p>

          <button
            onClick={() => handleStartQuiz(4)}
            disabled={!hasDocuments}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Practice Quiz</span>
          </button>
          {!hasDocuments && (
            <p className="text-xs text-amber-600 mt-3">
              Please upload or load sample study notes first to generate questions.
            </p>
          )}
        </div>
      )}

      {/* Generating Loader */}
      {isGenerating && (
        <div className="rounded-xl bg-white p-12 text-center border border-slate-200">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Generating Grounded Quiz with Gemma 4...</h4>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing your study material to ensure zero hallucinations.
          </p>
        </div>
      )}

      {/* Active Question Card (One Question at a Time) */}
      {!quizFinished && currentQ && !isGenerating && (
        <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-6">
          {/* Question Header & Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="capitalize rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 text-[11px] font-semibold">
                {currentQ.question_type.replace('_', ' ')}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
              Concept: {currentQ.concept}
            </span>
            <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1">
              {currentQ.question}
            </h3>
          </div>

          {/* Question Options or Short Answer Input */}
          <div className="space-y-3">
            {currentQ.question_type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => !evaluation && setSelectedOption(opt)}
                      disabled={!!evaluation}
                      className={`w-full rounded-xl p-4 text-left text-sm font-medium transition-all flex items-start gap-3 border ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/60 text-teal-950 font-semibold ring-1 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="mt-0.5 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.question_type === 'true_false' && (
              <div className="grid grid-cols-2 gap-3">
                {['True', 'False'].map((val) => {
                  const isSelected = selectedOption === val;
                  return (
                    <button
                      key={val}
                      onClick={() => !evaluation && setSelectedOption(val)}
                      disabled={!!evaluation}
                      className={`rounded-xl py-3.5 text-center text-sm font-bold border transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.question_type === 'short_answer' && (
              <div>
                <textarea
                  rows={3}
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  disabled={!!evaluation}
                  placeholder="Type your answer based on your notes..."
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}
          </div>

          {/* Hint Section */}
          {showHint && (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3.5 text-xs text-amber-800 border border-amber-200/80 animate-fade-in">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Helpful Hint: </span>
                <span>{currentQ.hint}</span>
              </div>
            </div>
          )}

          {/* Evaluation & Supportive Feedback */}
          {evaluation && (
            <div
              className={`rounded-xl p-4.5 border space-y-3 ${
                evaluation.is_correct
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {evaluation.is_correct ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-900">Correct! Nice Work!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-900">Needs Review</span>
                  </>
                )}
              </div>

              <p className="text-xs leading-relaxed">{evaluation.feedback}</p>

              {/* Targeted Explanation */}
              {showExplanation && (
                <div className="mt-3 rounded-lg bg-white p-3.5 text-xs border border-slate-200/80 space-y-2 text-slate-800 shadow-2xs">
                  <div>
                    <span className="font-bold text-slate-900">Explanation from Notes:</span>
                    <p className="mt-1 leading-relaxed">{evaluation.correction_explanation}</p>
                  </div>

                  {evaluation.supporting_evidence && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-semibold text-teal-800 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> Supporting Evidence:
                      </span>
                      <blockquote className="mt-1 border-l-2 border-teal-500 pl-2 font-serif italic text-slate-700">
                        "{evaluation.supporting_evidence}"
                      </blockquote>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Source: {currentQ.source_filename}
                        {currentQ.page_number ? ` • Page ${currentQ.page_number}` : ''}
                      </span>
                    </div>
                  )}

                  {!evaluation.is_correct && evaluation.revision_recommendation && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-800 font-medium">
                      <span>💡 Revision Tip: </span>
                      <span>{evaluation.revision_recommendation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Button Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {!evaluation ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>{showHint ? 'Hint Revealed' : 'Need a Hint?'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={
                    isEvaluating ||
                    (currentQ.question_type === 'short_answer'
                      ? !shortAnswerInput.trim()
                      : !selectedOption)
                  }
                  className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm disabled:opacity-40 transition-all"
                >
                  <span>{isEvaluating ? 'Evaluating...' : 'Submit Answer'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm transition-all"
                >
                  <span>
                    {currentIndex + 1 < questions.length ? 'Next Question' : 'View Final Results'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed Quiz Results Screen */}
      {quizFinished && (
        <div className="rounded-xl bg-white p-6 md:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-3">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Quiz Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Grounded evaluation based on "{topic}" study notes
            </p>

            {/* Score Ring / Pill */}
            <div className="my-5 inline-flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 px-8 py-4">
              <span className="text-3xl font-black text-slate-900">{scorePercent}%</span>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">
                {correctCount} of {totalQuestions} answered correctly
              </span>
            </div>
          </div>

          {/* Breakdown Review of Each Question */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Question-by-Question Review
            </h4>

            {resultsHistory.map((res, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-slate-50/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {res.evaluation.is_correct ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <p className="font-bold text-slate-900 text-sm">{res.question.question}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      res.evaluation.is_correct
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {res.evaluation.is_correct ? 'Correct' : 'Needs Review'}
                  </span>
                </div>

                <div className="pl-6 space-y-1 text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Your Answer:</span>{' '}
                    {res.studentAnswer}
                  </p>
                  {!res.evaluation.is_correct && (
                    <p>
                      <span className="font-semibold text-slate-700">Correct Answer:</span>{' '}
                      {res.question.correct_answer}
                    </p>
                  )}
                  <blockquote className="border-l-2 border-teal-400 pl-2 italic text-slate-600 font-serif my-1">
                    "{res.question.source_excerpt}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onNavigateToNotes}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Review Notes
            </button>
            <button
              onClick={() => handleStartQuiz(4)}
              className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Practice Another Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
