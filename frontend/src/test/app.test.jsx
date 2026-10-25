import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App.jsx';
import { LandingHero } from '../components/LandingHero.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

describe('StudyMate AI Frontend User Flows & Accessibility (Test 9)', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/sessions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 'default-session',
                name: 'Plant Biology Session',
                topic: 'Plant Physiology & Cellular Respiration',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                document_count: 1,
                questions_asked: 2,
                quizzes_taken: 1,
              },
            ]),
        });
      }
      if (url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 'doc-1',
                filename: 'photosynthesis_notes.txt',
                file_type: 'txt',
                session_id: 'default-session',
                topic: 'Plant Physiology & Cellular Respiration',
                word_count: 320,
                char_count: 2100,
                page_count: 1,
                status: 'processed',
                created_at: new Date().toISOString(),
              },
            ]),
        });
      }
      if (url.includes('/progress')) {
        return Promise.resolve({
          current_topic: 'Plant Physiology & Cellular Respiration',
          total_documents: 1,
          total_questions_asked: 2,
          total_quizzes_taken: 1,
          average_quiz_score: 100.0,
          concepts_mastered: ['RuBisCO'],
          concepts_to_revise: [],
          recent_sessions: [],
          recent_activity: [],
          topic_breakdown: [{ name: 'Photosynthesis', mastery: 90 }],
        });
      }
      if (url.includes('/ai/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'online',
              model_family: 'Gemma 4',
              model_id: 'google/gemma-4-it',
              provider: 'huggingface',
              mode: 'grounded_demo_mode',
              is_live_connected: false,
              anti_hallucination_guardrails: 'active',
              supported_providers: [],
              configuration_instructions: 'Set GEMMA_API_KEY in backend/.env',
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders landing hero with headline, subheading, and primary CTA', () => {
    const handleStart = vi.fn();
    const handleSample = vi.fn();

    render(
      <LandingHero onStartLearning={handleStart} onLoadSample={handleSample} />
    );

    expect(
      screen.getByText(/Your Notes. Your AI Tutor./i)
    ).toBeDefined();
    expect(
      screen.getByText(/Better Learning./i)
    ).toBeDefined();

    const ctaButton = screen.getByRole('button', { name: /Start Learning/i });
    expect(ctaButton).toBeDefined();
    fireEvent.click(ctaButton);
    expect(handleStart).toHaveBeenCalled();
  });

  it('renders sidebar navigation tabs and keyboard accessible buttons', () => {
    const handleTab = vi.fn();
    render(
      <Sidebar
        currentTab="dashboard"
        setCurrentTab={handleTab}
        sessions={[
          {
            id: 'sess-1',
            name: 'Biology Session',
            topic: 'Photosynthesis',
            created_at: '',
            updated_at: '',
            document_count: 1,
            questions_asked: 0,
            quizzes_taken: 0,
          },
        ]}
        currentSessionId="sess-1"
        setCurrentSessionId={vi.fn()}
        onNewSession={vi.fn()}
        aiStatus={null}
        isOpenMobile={false}
        setIsOpenMobile={vi.fn()}
      />
    );

    const tutorNav = screen.getByRole('button', { name: /AI Tutor/i });
    expect(tutorNav).toBeDefined();
    fireEvent.click(tutorNav);
    expect(handleTab).toHaveBeenCalledWith('tutor');

    const quizNav = screen.getByRole('button', { name: /Practice Quiz/i });
    fireEvent.click(quizNav);
    expect(handleTab).toHaveBeenCalledWith('quiz');
  });

  it('renders main application dashboard and loads mock session state', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/StudyMate/i)).toBeDefined();
    });

    expect(screen.getByText(/Current Study Focus/i)).toBeDefined();
  });
});
