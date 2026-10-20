import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  BarChart2,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import { ProgressStats, StudySession } from '../types';

interface ProgressViewProps {
  progress: ProgressStats | null;
  currentSession: StudySession | undefined;
  onNavigateToQuiz: () => void;
  onNavigateToNotes: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  currentSession,
  onNavigateToQuiz,
  onNavigateToNotes,
}) => {
  const chartData = progress?.topic_breakdown || [
    { name: 'Light Reactions', mastery: 85 },
    { name: 'Calvin Cycle', mastery: 70 },
    { name: 'ATP Synthase', mastery: 90 },
    { name: 'Cellular Respiration', mastery: 65 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Learning Progress & Mastery</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time analytics and revision recommendations derived from your session activity.
            </p>
          </div>

          <span className="self-start sm:self-center inline-flex items-center rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200">
            Topic: {currentSession?.topic || 'Plant Physiology'}
          </span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Average Quiz Score</p>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {progress?.average_quiz_score ?? 0}%
          </p>
          <span className="text-[11px] text-teal-600 font-medium mt-1 inline-block">
            {progress?.total_quizzes_taken ?? 0} practice sessions
          </span>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Active Documents</p>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {progress?.total_documents ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            Verified study material
          </span>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Concepts Mastered</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {progress?.concepts_mastered?.length ?? 0}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
            Answered accurately
          </span>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Revision Needs</p>
          <p className="text-3xl font-black text-amber-600 mt-2">
            {progress?.concepts_to_revise?.length ?? 0}
          </p>
          <span className="text-[11px] text-amber-700 font-medium mt-1 inline-block">
            Targeted for review
          </span>
        </div>
      </div>

      {/* Recharts Topic Mastery Visualization */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Topic Concept Mastery Breakdown</h3>
          </div>
          <span className="text-xs text-slate-500">Target: 80%+</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Mastery Score']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
              <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.mastery >= 75 ? '#0D9488' : '#F59E0B'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Concept Analysis: Mastered vs To Revise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concepts Mastered */}
        <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Mastered Concepts</h3>
          </div>

          {progress?.concepts_mastered && progress.concepts_mastered.length > 0 ? (
            <div className="space-y-2">
              {progress.concepts_mastered.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-emerald-50/70 p-3 border border-emerald-100 text-xs"
                >
                  <span className="font-semibold text-emerald-950">{c}</span>
                  <span className="text-emerald-700 font-bold">100%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Answer quiz questions correctly to record mastered concepts.
            </p>
          )}
        </div>

        {/* Concepts Recommended for Revision */}
        <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Recommended for Revision</h3>
            </div>
            {progress?.concepts_to_revise && progress.concepts_to_revise.length > 0 && (
              <button
                onClick={onNavigateToQuiz}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                Practice Now
              </button>
            )}
          </div>

          {progress?.concepts_to_revise && progress.concepts_to_revise.length > 0 ? (
            <div className="space-y-2">
              {progress.concepts_to_revise.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-amber-50/70 p-3 border border-amber-200 text-xs"
                >
                  <div>
                    <span className="font-semibold text-amber-950">{c}</span>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Review notes section to reinforce understanding.
                    </p>
                  </div>
                  <button
                    onClick={onNavigateToNotes}
                    className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 border border-amber-300 hover:bg-amber-100"
                  >
                    View Notes
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No concepts currently flagged for revision.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
