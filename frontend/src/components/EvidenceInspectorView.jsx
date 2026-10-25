import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Percent,
  ArrowRight,
} from 'lucide-react';

export const EvidenceInspectorView = ({
  evidenceList,
  currentQuestion,
  sourceCoveragePercent,
  onNavigateToTutor,
}) => {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredEvidence = (evidenceList || []).filter(
    (ev) =>
      ev.excerpt.toLowerCase().includes(filterQuery.toLowerCase()) ||
      ev.source_filename.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (ev.section_title && ev.section_title.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Source Coverage Card */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Evidence Inspector</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deep verification of direct citations, page locations, and factual grounding from your notes.
            </p>
          </div>

          {/* Genuine Source Coverage Meter */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 min-w-[260px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-teal-600" />
                Evidence Coverage
              </span>
              <span className="text-sm font-bold text-slate-900">{sourceCoveragePercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  sourceCoveragePercent >= 70
                    ? 'bg-teal-500'
                    : sourceCoveragePercent >= 40
                    ? 'bg-cyan-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(Math.max(sourceCoveragePercent, 0), 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Calculated from actual matching key concept tokens in retrieved passages.
            </p>
          </div>
        </div>

        {/* Current Inspected Question */}
        {currentQuestion && (
          <div className="mt-5 rounded-lg bg-teal-50/60 p-3.5 border border-teal-200/60">
            <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
              Inspecting Query
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">"{currentQuestion}"</p>
          </div>
        )}
      </div>

      {/* Main Evidence Passage List */}
      <div className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Retrieved Evidence Passages ({(evidenceList || []).length})
            </h3>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter passages..."
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {!evidenceList || evidenceList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active evidence to inspect</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Ask a question in the AI Tutor tab first. Verified supporting evidence passages will automatically appear here.
            </p>
            <button
              onClick={onNavigateToTutor}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              <span>Go to AI Tutor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvidence.map((ev, index) => {
              const isExpanded = expandedIndex === index;
              const matchPercent = Math.round(ev.relevance_score * 100);

              return (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-slate-300 shadow-2xs"
                >
                  {/* Header bar */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="flex cursor-pointer items-center justify-between bg-slate-50/80 px-4 py-3 hover:bg-slate-100/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {ev.source_filename}
                        </span>
                        {ev.page_number && (
                          <span className="text-xs text-slate-500 ml-2">Page {ev.page_number}</span>
                        )}
                        {ev.section_title && (
                          <span className="ml-2 rounded bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 border border-teal-200">
                            {ev.section_title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
                        {matchPercent}% Relevance
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Body content */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Direct Quote from Source Notes:
                        </span>
                        <blockquote className="mt-1.5 rounded-lg border-l-4 border-teal-500 bg-slate-50 p-3.5 text-sm font-serif italic text-slate-800">
                          "{ev.excerpt}"
                        </blockquote>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Direct quote verified against study notes</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">Evidence ID: {ev.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
