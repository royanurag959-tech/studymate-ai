import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Database,
  Trash2,
  FolderPlus,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Edit2,
  RotateCcw,
} from 'lucide-react';

export const SettingsView = ({
  sessions,
  currentSessionId,
  aiStatus,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onResetSession,
  onRefreshAIStatus,
}) => {
  // New session modal / form
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTopic, setNewTopic] = useState('');

  // Rename session state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // Reset confirmation
  const [confirmResetId, setConfirmResetId] = useState(null);

  // Status check loading
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newTopic.trim()) return;
    await onCreateSession(newName, newTopic);
    setNewName('');
    setNewTopic('');
    setIsCreating(false);
  };

  const handleRename = async (id) => {
    if (!editName.trim()) return;
    await onRenameSession(id, editName);
    setEditingId(null);
  };

  const handleCheckAI = async () => {
    setIsCheckingAI(true);
    setCheckResult(null);
    try {
      await onRefreshAIStatus();
      setCheckResult('AI provider status verified successfully.');
    } catch (err) {
      setCheckResult(`Error checking status: ${err.message}`);
    } finally {
      setIsCheckingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-900">Application & AI Settings</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure Gemma 4 inference providers, manage study sessions, and review data privacy controls.
        </p>
      </div>

      {/* Gemma 4 AI Configuration Card */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Gemma 4 Inference Provider</h3>
          </div>
          <button
            onClick={handleCheckAI}
            disabled={isCheckingAI}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingAI ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isCheckingAI ? 'Checking...' : 'Check Status'}</span>
          </button>
        </div>

        {checkResult && (
          <div className="rounded-lg bg-teal-50 p-3 text-xs text-teal-800 border border-teal-200">
            {checkResult}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
            <div>
              <span className="font-semibold text-slate-500">Current Mode:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold ${
                    aiStatus?.is_live_connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {aiStatus?.is_live_connected ? 'Live Gemma 4 Inference' : 'Grounded Demo Simulator'}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500">Model Identifier:</span>
              <p className="font-mono text-slate-800 mt-0.5">{aiStatus?.model_id || 'google/gemma-4-it'}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">Anti-Hallucination Guardrails:</span>
              <p className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Strict Evidence Enforcement Active
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Lock className="h-4 w-4 text-teal-600" />
              <span>Backend Security Architecture</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              API keys are strictly managed on the backend and never exposed to the frontend browser.
              To switch between providers (Hugging Face, Groq, OpenRouter, or local Ollama), configure
              <code className="mx-1 px-1 py-0.5 bg-slate-200 rounded font-mono text-slate-800">
                GEMMA_API_KEY
              </code>
              in <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-slate-800">backend/.env</code>.
            </p>
          </div>
        </div>

        {/* Supported Providers List */}
        <div>
          <span className="text-xs font-semibold text-slate-700 block mb-2">Supported Inference Adapters:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {aiStatus?.supported_providers?.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-200 p-2.5 bg-white flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">{p.sample_model}</p>
                </div>
                <span className="text-[10px] text-teal-700 font-semibold mt-1">Config: {p.env_key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Session Management Card */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Study Sessions ({sessions.length})</h3>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>New Session</span>
          </button>
        </div>

        {/* Create Session Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Create New Study Session</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Midterm Bio Revision"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Topic</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Cell Membrane Transport"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Sessions List */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {sessions.map((s) => {
            const isSelected = s.id === currentSessionId;
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isSelected ? 'bg-teal-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded border border-teal-500 px-2 py-1 text-xs text-slate-900"
                      />
                      <button
                        onClick={() => handleRename(s.id)}
                        className="rounded bg-teal-600 px-2 py-1 text-xs font-bold text-white hover:bg-teal-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      {isSelected && (
                        <span className="rounded bg-teal-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                          Active
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">Topic: {s.topic}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!isSelected && (
                    <button
                      onClick={() => onSelectSession(s.id)}
                      className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Switch
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingId(s.id);
                      setEditName(s.name);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Rename"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmResetId(s.id)}
                    className="p-1 text-amber-600 hover:text-amber-800"
                    title="Reset session data"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>

                  {sessions.length > 1 && (
                    <button
                      onClick={() => onDeleteSession(s.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmResetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h4 className="text-base font-bold text-slate-900">Reset Study Session?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will clear all uploaded documents, questions asked, and quiz history for this session.
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmResetId(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onResetSession(confirmResetId);
                  setConfirmResetId(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm"
              >
                Yes, Reset Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transparency & Local Privacy Statement */}
      <div className="rounded-xl bg-slate-100/80 p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          <span>Transparency & Local Storage Notice</span>
        </div>
        <p className="leading-relaxed">
          StudyMate AI stores your session notes and learning progress locally.
          When using live Gemma 4 inference, only the specific retrieved evidence passages required to answer
          your question are submitted to the inference endpoint. Your files are never utilized for general AI model training.
        </p>
      </div>
    </div>
  );
};
