import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  AlertTriangle,
  BookOpen,
  X,
  FileQuestion,
} from 'lucide-react';

export const NotesView = ({
  documents,
  sessionId,
  topic,
  onUpload,
  onPasteNotes,
  onDeleteDocument,
  onLoadSample,
  onUpdateTopic,
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Paste Form state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [isSavingPaste, setIsSavingPaste] = useState(false);

  // Topic editing state
  const [editingTopic, setEditingTopic] = useState(topic);
  const [isEditingTopic, setIsEditingTopic] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processUpload(file);
    }
  };

  const handleFileInput = async (e) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processUpload(file);
    }
  };

  const processUpload = async (file) => {
    const validExtensions = ['.pdf', '.txt', '.md'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Invalid file type. StudyMate AI supports .pdf, .txt, and .md files.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePaste = async (e) => {
    e.preventDefault();
    if (!pasteContent.trim()) {
      setUploadError('Pasted notes cannot be empty.');
      return;
    }

    setIsSavingPaste(true);
    setUploadError(null);
    try {
      await onPasteNotes(pasteTitle || 'Pasted Notes', pasteContent);
      setPasteTitle('');
      setPasteContent('');
      setActiveTab('upload');
    } catch (err) {
      setUploadError(err.message || 'Failed to save notes');
    } finally {
      setIsSavingPaste(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topic Header & Selector */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Study Session Subject
            </span>
            {isEditingTopic ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editingTopic}
                  onChange={(e) => setEditingTopic(e.target.value)}
                  className="rounded-lg border border-teal-500 px-3 py-1.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Molecular Biology"
                />
                <button
                  onClick={() => {
                    onUpdateTopic(editingTopic);
                    setIsEditingTopic(false);
                  }}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingTopic(topic);
                    setIsEditingTopic(false);
                  }}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-xl font-bold text-slate-900">{topic}</h2>
                <button
                  onClick={() => setIsEditingTopic(true)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Edit Topic
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Gemma 4 strictly grounds all questions, quizzes, and evidence within this academic focus.
            </p>
          </div>

          {/* Quick Demo Preloaders */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Demo Notes:</span>
            <button
              onClick={() => onLoadSample('photosynthesis')}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-teal-600" />
              <span>Plant Biology</span>
            </button>
            <button
              onClick={() => onLoadSample('networks')}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-cyan-600" />
              <span>Networks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Upload File vs Paste Notes */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all mr-6 ${
              activeTab === 'upload'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload PDF or TXT
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Study Notes
          </button>
        </div>

        {uploadError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Mode */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 mb-3">
                <Upload className="h-6 w-6 text-teal-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Drop your lecture notes, textbook chapters, or revision guides
              </h4>
              <p className="text-xs text-slate-500 mb-4 max-w-sm">
                Supports PDF, TXT, and Markdown files up to 15MB. All documents are chunked and indexed locally.
              </p>

              <label className="relative inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer transition-colors">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileInput}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>

              {isUploading && (
                <div className="mt-4 flex items-center gap-2 text-xs text-teal-700 font-medium">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                  <span>Extracting text and chunking passages...</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Security notice: Personal data is not transmitted or used for general model training.</span>
              <span>Max size: 15MB</span>
            </div>
          </div>
        )}

        {/* Paste Notes Mode */}
        {activeTab === 'paste' && (
          <form onSubmit={handleSavePaste} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Photosystem II Notes"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes Content</label>
              <textarea
                rows={8}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste your study notes, definitions, class summaries, or exam syllabus..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteContent('')}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSavingPaste || !pasteContent.trim()}
                className="rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {isSavingPaste ? 'Saving Notes...' : 'Save to Study Session'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Document Library / List */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Active Documents ({documents.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Ready for Grounded AI Tutoring</span>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
            <FileQuestion className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No documents in this session yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Upload a PDF, TXT file, or click one of the demo buttons above to get started immediately.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 text-teal-700 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{doc.filename}</p>
                      <span className="uppercase rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {doc.file_type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{doc.word_count.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}</span>
                      <span>•</span>
                      <span>{doc.char_count.toLocaleString()} chars</span>
                    </div>

                    {/* Status / OCR warning */}
                    {doc.status === 'warning_scanned' && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{doc.status_message}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Info</span>
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <h4 className="text-base font-bold text-slate-900 truncate max-w-xs">{previewDoc.filename}</h4>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-500">Topic:</span>
                  <p className="text-slate-900 font-medium">{previewDoc.topic}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Status:</span>
                  <p className="text-slate-900 font-medium capitalize">{previewDoc.status}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Total Words:</span>
                  <p className="text-slate-900 font-medium">{previewDoc.word_count.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Pages:</span>
                  <p className="text-slate-900 font-medium">{previewDoc.page_count}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Processing Details:</span>
                <p className="mt-1 text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {previewDoc.status_message || 'Indexed for grounded semantic retrieval.'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
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
};
