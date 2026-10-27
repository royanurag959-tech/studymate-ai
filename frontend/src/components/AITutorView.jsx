import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Languages,
  Sliders,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

export const AITutorView = ({
  topic,
  sessionId,
  documentCount = 0,
  onAsk,
  onInspectEvidence,
  onNavigateToNotes,
}) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'tutor',
      text: `Hello! I am your StudyMate AI Tutor powered by Gemma 4. I am ready to answer questions strictly from your study material on "${topic}".\n\nAsk me anything about your uploaded notes, or pick one of the sample questions below to test evidence grounding!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Tutor Settings
  const [language, setLanguage] = useState('english');
  const [depth, setDepth] = useState('detailed');
  const [level, setLevel] = useState('intermediate');

  // Accordion toggle for evidence items in messages
  const [expandedEvidence, setExpandedEvidence] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleEvidence = (msgId) => {
    setExpandedEvidence((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e, customQuestion) => {
    if (e) e.preventDefault();
    const q = (customQuestion || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const resp = await onAsk(q, language, depth, level);
      const tutorMsg = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: resp.answer,
        responseMeta: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
      if (resp.supporting_evidence && resp.supporting_evidence.length > 0) {
        setExpandedEvidence((prev) => ({ ...prev, [tutorMsg.id]: true }));
      }
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        text: `Error contacting tutor: ${err.message || 'Please check backend connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    {
      title: 'Water Photolysis',
      query: 'What reaction does the Oxygen-Evolving Complex catalyze in Photosystem II?',
      category: 'Grounded Answer',
    },
    {
      title: 'Calvin Cycle Enzyme',
      query: 'What role does RuBisCO play in the Calvin cycle?',
      category: 'Grounded Answer',
    },
    {
      title: 'Absent Topic (Anti-Hallucination Test)',
      query: 'What is Quantum Chromodynamics and the strong nuclear force coupling constant?',
      category: 'Insufficient Evidence Test',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-xl bg-white shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Tutor Customization Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Sliders className="h-3.5 w-3.5 text-teal-600" />
          <span>Tutor Mode Settings:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <span className="px-2 text-slate-400 flex items-center gap-1">
              <Languages className="h-3 w-3" /> Lang:
            </span>
            <button
              onClick={() => setLanguage('english')}
              className={`rounded-md px-2 py-1 font-semibold transition-colors ${
                language === 'english' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hinglish')}
              className={`rounded-md px-2 py-1 font-semibold transition-colors ${
                language === 'hinglish' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hinglish (हिंदी)
            </button>
          </div>

          {/* Depth Selector */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <span className="px-2 text-slate-400 flex items-center gap-1">
              <Layers className="h-3 w-3" /> Depth:
            </span>
            {['short', 'detailed', 'step_by_step'].map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={`rounded-md px-2 py-1 font-semibold capitalize transition-colors ${
                  depth === d ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Level Selector */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <span className="px-2 text-slate-400">Level:</span>
            {['beginner', 'intermediate', 'advanced'].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-md px-2 py-1 font-semibold capitalize transition-colors ${
                  level === l ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Notes Status Banner */}
      {documentCount === 0 ? (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Abhi is session mein koi notes loaded nahi hain. Sawaal puchne se pehle 'My Notes' mein notes save karein!</span>
          </div>
          <button
            onClick={onNavigateToNotes}
            className="rounded bg-amber-600 px-2.5 py-1 text-white font-bold hover:bg-amber-700 shrink-0 ml-2"
          >
            Go to My Notes
          </button>
        </div>
      ) : (
        <div className="bg-teal-50/70 border-b border-teal-200/80 px-4 py-2 flex items-center justify-between text-xs text-teal-900">
          <span className="font-medium">
            🟢 Active Study Notes: <strong>{topic}</strong> ({documentCount} document{documentCount > 1 ? 's' : ''} loaded)
          </span>
          <button
            onClick={onNavigateToNotes}
            className="text-teal-700 underline hover:text-teal-900 font-semibold ml-2"
          >
            Manage Notes
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const meta = msg.responseMeta;
          const hasEvidence = meta?.supporting_evidence && meta.supporting_evidence.length > 0;
          const isInsufficient = meta && !meta.has_sufficient_evidence;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-teal-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`space-y-2 max-w-[88%] md:max-w-2xl`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : isInsufficient
                      ? 'bg-amber-50/80 border border-amber-200 text-slate-900 rounded-tl-none'
                      : 'bg-slate-100/90 border border-slate-200/60 text-slate-900 rounded-tl-none'
                  }`}
                >
                  {/* If Insufficient Evidence Warning Banner */}
                  {isInsufficient && (
                    <div className="mb-2.5 flex items-center gap-2 rounded-lg bg-amber-100/70 p-2 text-xs font-semibold text-amber-800 border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Honest Evidence Notice: Missing from Supplied Notes</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Insufficient Evidence CTA */}
                  {isInsufficient && (
                    <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
                      <p className="text-xs text-amber-700">
                        Would you like to add more study material covering this concept?
                      </p>
                      <button
                        onClick={onNavigateToNotes}
                        className="rounded-md bg-amber-600 hover:bg-amber-700 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs"
                      >
                        Upload Notes
                      </button>
                    </div>
                  )}

                  {/* Model badge & copy button for tutor responses */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{meta?.model_used || 'Gemma 4'}</span>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 hover:text-slate-600"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grounded Evidence Box */}
                {hasEvidence && meta && (
                  <div className="rounded-xl border border-teal-200/70 bg-teal-50/50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleEvidence(msg.id)}
                        className="flex items-center gap-2 font-bold text-teal-900 hover:text-teal-700"
                      >
                        <Search className="h-3.5 w-3.5 text-teal-600" />
                        <span>
                          Supporting Evidence ({meta.supporting_evidence.length} passages, {meta.source_coverage_percent}% coverage)
                        </span>
                        {expandedEvidence[msg.id] ? (
                          <ChevronUp className="h-3.5 w-3.5 text-teal-600" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-teal-600" />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          onInspectEvidence(meta.supporting_evidence, msg.text, meta.source_coverage_percent)
                        }
                        className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                      >
                        <span>Deep Inspect</span>
                      </button>
                    </div>

                    {expandedEvidence[msg.id] && (
                      <div className="mt-3 space-y-2 border-t border-teal-200/60 pt-2.5">
                        {meta.supporting_evidence.map((ev, i) => (
                          <div key={i} className="rounded-lg bg-white p-2.5 border border-teal-100 shadow-2xs">
                            <div className="flex items-center justify-between text-[11px] text-teal-800 font-semibold mb-1">
                              <span>
                                {ev.source_filename}
                                {ev.page_number ? ` • Page ${ev.page_number}` : ''}
                                {ev.section_title ? ` [${ev.section_title}]` : ''}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-700">
                                Match: {Math.round(ev.relevance_score * 100)}%
                              </span>
                            </div>
                            <blockquote className="border-l-2 border-teal-400 pl-2 text-slate-700 font-serif italic">
                              "{ev.excerpt}"
                            </blockquote>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-100 p-4 text-xs text-slate-500 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                <span>Searching your notes and verifying evidence with Gemma 4...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Quick Bar */}
      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
          <Sparkles className="h-3 w-3 text-teal-600" />
          <span>Quick Test Questions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(undefined, sq.query)}
              disabled={isLoading}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-900 transition-colors truncate max-w-xs"
              title={sq.query}
            >
              <span className="text-teal-600 font-semibold">[{sq.category}]</span> {sq.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => handleSubmit(e)} className="border-t border-slate-200 p-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask a question grounded in your notes on "${topic}"...`}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
