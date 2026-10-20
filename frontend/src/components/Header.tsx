import React from 'react';
import { Menu, BookOpen, ShieldCheck, Upload, Sparkles } from 'lucide-react';
import { StudySession, AIStatus } from '../types';

interface HeaderProps {
  currentSession: StudySession | undefined;
  aiStatus: AIStatus | null;
  onOpenMobileSidebar: () => void;
  onQuickUpload: () => void;
  onViewDemoNotice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  aiStatus,
  onOpenMobileSidebar,
  onQuickUpload,
  onViewDemoNotice,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="truncate max-w-[200px] md:max-w-xs">{currentSession?.name || 'Study Session'}</span>
            </h2>
            <span className="hidden sm:inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 border border-teal-200/60">
              Topic: {currentSession?.topic || 'General'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Gemma 4 Status Pill */}
        <button
          onClick={onViewDemoNotice}
          className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200 transition-colors"
          title="Click for Gemma 4 connection info"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>Gemma 4:</span>
          <span className={aiStatus?.is_live_connected ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
            {aiStatus?.is_live_connected ? 'Live API' : 'Grounded Demo'}
          </span>
        </button>

        <button
          onClick={onQuickUpload}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden xs:inline">Upload Notes</span>
        </button>
      </div>
    </header>
  );
};
