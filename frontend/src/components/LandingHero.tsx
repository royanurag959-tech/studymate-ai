import React from 'react';
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, CheckCircle2, FileSearch, BrainCircuit } from 'lucide-react';

interface LandingHeroProps {
  onStartLearning: () => void;
  onLoadSample: (type: 'photosynthesis' | 'networks') => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartLearning,
  onLoadSample,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-6 md:p-10 text-white shadow-xl border border-slate-800 mb-8">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/20 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span>Hacktoberfest Hackday 2026 — Track 1: Best Use of Gemma 4</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Your Notes. Your AI Tutor.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-100">
            Better Learning.
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-300 mb-6 leading-relaxed">
          Learn from your own study material with evidence-backed answers, interactive quizzes, and personalized feedback.
        </p>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-800/80 p-2.5 border border-slate-700/60">
            <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">Zero Hallucinations (Strict Notes Grounding)</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-800/80 p-2.5 border border-slate-700/60">
            <FileSearch className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">Verifiable Passages & Direct Excerpts</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-800/80 p-2.5 border border-slate-700/60">
            <BrainCircuit className="h-4 w-4 text-teal-400 shrink-0" />
            <span className="text-xs font-medium text-slate-200">Adaptive English & Hinglish Tutoring</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStartLearning}
            className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <span>Start Learning</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onLoadSample('photosynthesis')}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs md:text-sm font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-teal-400" />
            <span>Load Biology Sample Notes</span>
          </button>

          <button
            onClick={() => onLoadSample('networks')}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs md:text-sm font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>Load Networks Sample Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
