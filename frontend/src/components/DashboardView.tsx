import React from 'react';
import {
  FileText,
  Bot,
  HelpCircle,
  TrendingUp,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock,
  Compass
} from 'lucide-react';
import { ProgressStats, StudySession } from '../types';
import { LandingHero } from './LandingHero';

interface DashboardViewProps {
  progress: ProgressStats | null;
  currentSession: StudySession | undefined;
  onNavigate: (tab: string) => void;
  onLoadSample: (type: 'photosynthesis' | 'networks') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  currentSession,
  onNavigate,
  onLoadSample,
}) => {
  const stats = [
    {
      label: 'Uploaded Documents',
      value: progress?.total_documents ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      actionTab: 'notes',
    },
    {
      label: 'Questions Explored',
      value: progress?.total_questions_asked ?? 0,
      icon: Bot,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100',
      actionTab: 'tutor',
    },
    {
      label: 'Practice Quizzes',
      value: progress?.total_quizzes_taken ?? 0,
      icon: HelpCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      actionTab: 'quiz',
    },
    {
      label: 'Average Quiz Score',
      value: `${progress?.average_quiz_score ?? 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      actionTab: 'progress',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Landing Hero Banner */}
      <LandingHero
        onStartLearning={() => onNavigate('tutor')}
        onLoadSample={onLoadSample}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(stat.actionTab)}
              className="cursor-pointer rounded-xl bg-white p-5 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor} ${stat.borderColor} border`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recommended Revision & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Topics Practiced & Recommended Revision */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Academic Topic */}
          <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Current Study Focus</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Active Topic
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {currentSession?.topic || 'Plant Physiology & Cellular Respiration'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Session: {currentSession?.name || 'Default Session'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('tutor')}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Ask Tutor <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Concepts Recommended for Revision */}
          <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Concepts Recommended for Revision</h3>
              </div>
              <span className="text-xs text-slate-500">Based on quiz responses</span>
            </div>

            {progress?.concepts_to_revise && progress.concepts_to_revise.length > 0 ? (
              <div className="space-y-3">
                {progress.concepts_to_revise.map((concept, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{concept}</p>
                        <p className="text-xs text-slate-500">Practice questions suggested revision for this concept.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('quiz')}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                    >
                      Practice
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-emerald-500/70 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Revision Items Pending</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Take a practice quiz on your study notes to identify areas where targeted feedback can accelerate your learning.
                </p>
                <button
                  onClick={() => onNavigate('quiz')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Generate Practice Quiz
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900 mb-4">Quick Learning Actions</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('tutor')}
                className="w-full flex items-center justify-between rounded-lg p-3 text-left border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-900">Ask AI Tutor</p>
                    <p className="text-xs text-slate-500">Ask questions from your notes</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />
              </button>

              <button
                onClick={() => onNavigate('evidence')}
                className="w-full flex items-center justify-between rounded-lg p-3 text-left border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                    <Search className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-cyan-900">Evidence Inspector</p>
                    <p className="text-xs text-slate-500">Inspect citations & source coverage</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-600" />
              </button>

              <button
                onClick={() => onNavigate('quiz')}
                className="w-full flex items-center justify-between rounded-lg p-3 text-left border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <HelpCircle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-900">Practice Quiz</p>
                    <p className="text-xs text-slate-500">Test with grounded MCQs & hints</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => onNavigate('notes')}
                className="w-full flex items-center justify-between rounded-lg p-3 text-left border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-900">Upload / Paste Notes</p>
                    <p className="text-xs text-slate-500">Add PDFs or lecture notes</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            </div>

            {progress?.recent_activity && progress.recent_activity.length > 0 ? (
              <div className="space-y-3">
                {progress.recent_activity.slice(0, 5).map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-1 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">{act.title}</p>
                      <p className="text-slate-400 text-[11px]">{act.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No activity yet in this session.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
