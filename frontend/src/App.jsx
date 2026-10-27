import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { DashboardView } from './components/DashboardView.jsx';
import { NotesView } from './components/NotesView.jsx';
import { AITutorView } from './components/AITutorView.jsx';
import { EvidenceInspectorView } from './components/EvidenceInspectorView.jsx';
import { QuizView } from './components/QuizView.jsx';
import { ProgressView } from './components/ProgressView.jsx';
import { SettingsView } from './components/SettingsView.jsx';
import { api } from './services/api.js';
import { Sparkles, X } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('default-session');
  const [documents, setDocuments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  // Inspected evidence state (shared between Tutor and Evidence Inspector)
  const [activeEvidence, setActiveEvidence] = useState([]);
  const [inspectedQuestion, setInspectedQuestion] = useState('');
  const [inspectedCoverage, setInspectedCoverage] = useState(0);

  // Mobile sidebar drawer
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Gemma 4 Demo Mode Info Dialog
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Global toast / notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Load
  useEffect(() => {
    loadSessions();
    loadAIStatus();
  }, []);

  // When active session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionData(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const sessList = await api.getSessions();
      setSessions(sessList);
      if (sessList.length > 0 && !sessList.some((s) => s.id === currentSessionId)) {
        setCurrentSessionId(sessList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadAIStatus = async () => {
    try {
      const status = await api.getAIStatus();
      setAiStatus(status);
    } catch (err) {
      console.error('Failed to check AI status:', err);
    }
  };

  const loadSessionData = async (sessId) => {
    try {
      const docs = await api.getDocuments(sessId);
      setDocuments(docs);
      const prog = await api.getProgress(sessId);
      setProgress(prog);
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentTopic = currentSession?.topic || 'General Study Material';

  // Handlers
  const handleUploadDocument = async (file) => {
    const derivedTopic = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const activeTopic =
      !documents.length || currentTopic === 'General Study Material' || currentTopic.includes('Plant Physiology')
        ? derivedTopic
        : currentTopic;
    await api.uploadDocument(file, currentSessionId, activeTopic);
    await loadSessions();
    await loadSessionData(currentSessionId);
    showToast(`Uploaded and chunked: ${file.name}`);
  };

  const handlePasteNotes = async (title, content) => {
    const activeTopic = (title && title.trim()) ? title.trim() : currentTopic;
    await api.pasteNotes(title, content, activeTopic, currentSessionId);
    await loadSessions();
    await loadSessionData(currentSessionId);
    showToast(`Saved notes: "${title}"`);
  };

  const handleClearAllNotes = async () => {
    if (!window.confirm('Clear all notes in this session to upload fresh ones?')) return;
    try {
      await api.resetSession(currentSessionId);
      await loadSessions();
      await loadSessionData(currentSessionId);
      showToast('Session cleared. You can now upload fresh notes on any subject.');
    } catch (err) {
      alert(`Failed to clear session: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (docId) => {
    await api.deleteDocument(docId, currentSessionId);
    await loadSessionData(currentSessionId);
    await loadSessions();
    showToast('Document removed.');
  };

  const handleLoadSampleNotes = async (sampleType) => {
    try {
      await api.loadSampleNotes(sampleType, currentSessionId);
      await loadSessionData(currentSessionId);
      await loadSessions();
      showToast(
        `Preloaded sample notes for ${
          sampleType === 'networks' ? 'Computer Networks' : 'Plant Physiology'
        }!`
      );
    } catch (err) {
      alert(`Error loading sample notes: ${err.message}`);
    }
  };

  const handleUpdateTopic = async (newTopic) => {
    try {
      await api.updateSession(currentSessionId, undefined, newTopic);
      await loadSessions();
      await loadSessionData(currentSessionId);
      showToast(`Updated topic to "${newTopic}"`);
    } catch (err) {
      alert(`Failed to update topic: ${err.message}`);
    }
  };

  const handleAskQuestion = async (question, language, depth, level) => {
    const resp = await api.askQuestion({
      session_id: currentSessionId,
      topic: currentTopic,
      question,
      language,
      depth,
      level,
    });

    setActiveEvidence(resp.supporting_evidence || []);
    setInspectedQuestion(question);
    setInspectedCoverage(resp.source_coverage_percent || 0);

    loadSessionData(currentSessionId);
    return resp;
  };

  const handleInspectEvidenceDirect = (evidence, question, coverage) => {
    setActiveEvidence(evidence);
    setInspectedQuestion(question);
    setInspectedCoverage(coverage);
    setCurrentTab('evidence');
  };

  const handleGenerateQuiz = async (count) => {
    const resp = await api.generateQuiz(currentSessionId, currentTopic, count);
    return resp.questions;
  };

  const handleEvaluateQuizAnswer = async (
    qId,
    question,
    type,
    studentAnswer,
    correctAnswer,
    concept,
    excerpt
  ) => {
    const evalResp = await api.evaluateQuizAnswer({
      session_id: currentSessionId,
      question_id: qId,
      question,
      question_type: type,
      student_answer: studentAnswer,
      correct_answer: correctAnswer,
      concept,
      source_excerpt: excerpt,
    });

    await loadSessionData(currentSessionId);
    return evalResp;
  };

  const handleCreateSession = async (name, topic) => {
    const created = await api.createSession(name, topic);
    await loadSessions();
    setCurrentSessionId(created.id);
    showToast(`Created session: "${name}"`);
  };

  const handleRenameSession = async (id, name) => {
    await api.updateSession(id, name, undefined);
    await loadSessions();
    showToast('Session renamed.');
  };

  const handleDeleteSession = async (id) => {
    await api.deleteSession(id);
    await loadSessions();
    showToast('Session deleted.');
  };

  const handleResetSession = async (id) => {
    await api.resetSession(id);
    await loadSessionData(id);
    await loadSessions();
    showToast('Session reset and cleared.');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-slate-700 animate-slide-up flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        onNewSession={() => {
          setCurrentTab('settings');
        }}
        aiStatus={aiStatus}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-h-screen">
        <Header
          currentSession={currentSession}
          aiStatus={aiStatus}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onQuickUpload={() => setCurrentTab('notes')}
          onViewDemoNotice={() => setShowDemoModal(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              progress={progress}
              currentSession={currentSession}
              onNavigate={setCurrentTab}
              onLoadSample={handleLoadSampleNotes}
            />
          )}

          {currentTab === 'notes' && (
            <NotesView
              documents={documents}
              sessionId={currentSessionId}
              topic={currentTopic}
              onUpload={handleUploadDocument}
              onPasteNotes={handlePasteNotes}
              onDeleteDocument={handleDeleteDocument}
              onLoadSample={handleLoadSampleNotes}
              onUpdateTopic={handleUpdateTopic}
              onClearAllNotes={handleClearAllNotes}
            />
          )}

          {currentTab === 'tutor' && (
            <AITutorView
              topic={currentTopic}
              sessionId={currentSessionId}
              documentCount={documents.length}
              onAsk={handleAskQuestion}
              onInspectEvidence={handleInspectEvidenceDirect}
              onNavigateToNotes={() => setCurrentTab('notes')}
            />
          )}

          {currentTab === 'evidence' && (
            <EvidenceInspectorView
              evidenceList={activeEvidence}
              currentQuestion={inspectedQuestion}
              sourceCoveragePercent={inspectedCoverage}
              onNavigateToTutor={() => setCurrentTab('tutor')}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizView
              topic={currentTopic}
              sessionId={currentSessionId}
              hasDocuments={documents.length > 0}
              onGenerateQuiz={handleGenerateQuiz}
              onEvaluateAnswer={handleEvaluateQuizAnswer}
              onNavigateToNotes={() => setCurrentTab('notes')}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              progress={progress}
              currentSession={currentSession}
              onNavigateToQuiz={() => setCurrentTab('quiz')}
              onNavigateToNotes={() => setCurrentTab('notes')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              sessions={sessions}
              currentSessionId={currentSessionId}
              aiStatus={aiStatus}
              onSelectSession={setCurrentSessionId}
              onCreateSession={handleCreateSession}
              onRenameSession={handleRenameSession}
              onDeleteSession={handleDeleteSession}
              onResetSession={handleResetSession}
              onRefreshAIStatus={loadAIStatus}
            />
          )}
        </main>
      </div>

      {/* Gemma 4 Demo / Configuration Info Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <h4 className="text-base font-bold text-slate-900">Gemma 4 Integration Details</h4>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="rounded-lg bg-teal-50 p-3.5 border border-teal-200">
                <p className="font-bold text-teal-900 text-sm mb-1">
                  {aiStatus?.is_live_connected
                    ? 'Connected to Live Gemma 4 Model'
                    : 'Running in Gemma 4 Grounded Simulation Mode'}
                </p>
                <p className="text-teal-800 leading-relaxed">
                  {aiStatus?.is_live_connected
                    ? `Live inference requests are active using ${aiStatus.model_id}.`
                    : 'The application is performing actual document text parsing, passage retrieval, and strict evidence grounding. To route queries through a live Gemma 4 endpoint, configure GEMMA_API_KEY in your backend .env file.'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Configured Model Identifier:</span>
                <p className="mt-0.5 font-mono text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
                  {aiStatus?.model_id || 'google/gemma-4-it'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Security Guarantee:</span>
                <p className="mt-0.5 text-slate-500">
                  No secret API keys are ever stored or exposed in client-side code. All calls pass through the secure Node.js & Express backend.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDemoModal(false)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
