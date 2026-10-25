import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Search,
  HelpCircle,
  TrendingUp,
  Settings,
  Sparkles,
  BookOpen,
  FolderPlus,
  X,
} from 'lucide-react';

export const Sidebar = ({
  currentTab,
  setCurrentTab,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  onNewSession,
  aiStatus,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notes', label: 'My Notes', icon: FileText },
    { id: 'tutor', label: 'AI Tutor', icon: Bot },
    { id: 'evidence', label: 'Evidence Inspector', icon: Search },
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle },
    { id: 'progress', label: 'Learning Progress', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                StudyMate <span className="text-teal-400 text-xs px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-800">AI</span>
              </h1>
              <p className="text-xs text-slate-400">Gemma 4 Study Companion</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Study Session Switcher */}
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Session
            </label>
            <button
              onClick={onNewSession}
              title="Create new study session"
              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <select
            value={currentSessionId}
            onChange={(e) => setCurrentSessionId(e.target.value)}
            className="w-full rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 truncate"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border-l-4 border-teal-400 pl-3'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Model Status Card */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                Gemma 4 Engine
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  aiStatus?.is_live_connected
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {aiStatus?.is_live_connected ? 'Live API' : 'Grounded Demo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {aiStatus?.model_id || 'google/gemma-4-it'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
              Anti-hallucination guardrails active
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
