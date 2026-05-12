import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, Shield, AlertTriangle, Send } from 'lucide-react';
import { useTestSecurity } from './useTestSecurity';

/**
 * MCQAssessment
 * Props:
 *   test         – full test session object from /api/test/:appId/start
 *   application  – application object { id, ... }
 *   token        – JWT token string
 *   onBack       – called when user exits
 *   onComplete   – called with mcqAnswers map when MCQ is done (to move to coding phase)
 */
const MCQAssessment = ({ test, application, token, onBack, onComplete }) => {
  // ── Normalize questions from whatever shape the backend returns ──────────────
  const questions = (() => {
    if (!test) return [];
    const q = test.questions;
    if (!q) return [];
    // Normalized format: { mcq: { questions: [...] } }
    if (Array.isArray(q?.mcq?.questions)) return q.mcq.questions;
    // Direct array
    if (Array.isArray(q)) return q;
    // Old format
    if (Array.isArray(q?.mcqs)) return q.mcqs;
    return [];
  })();

  const totalDuration = test?.duration_minutes ?? 45;
  const passThreshold = test?.questions?.mcq?.passThreshold ?? 50;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
  const [timeLeft, setTimeLeft] = useState(totalDuration * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const { violations, warnings, clearWarning, videoRef, cameraActive } = useTestSecurity({
    applicationId: application?.id,
    token,
    enabled: !submitted,
    maxViolations: 8,
  });

  // Timer
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  const handleAnswerSelect = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    // Calculate local score for display
    let correct = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    questions.forEach(q => {
      const pts = q.points ?? 10;
      totalPoints += pts;
      const userAns = answers[q.id];
      const correctIdx = typeof q.correct_index === 'number' ? q.correct_index : q.correct;
      if (userAns === correctIdx) { correct++; earnedPoints += pts; }
    });
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    setResult({ score, correct, total: questions.length, passed: score >= passThreshold });
  }, [submitted, answers, questions, passThreshold]);

  const proceedToCoding = () => {
    // Build answer map by question id
    const mcqAnswers = {};
    questions.forEach(q => {
      if (answers[q.id] !== undefined) mcqAnswers[q.id] = answers[q.id];
    });
    if (onComplete) onComplete(mcqAnswers);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const safeQ = questions;

  // ── Result Screen ─────────────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full bg-secondary/5 dark:bg-dark-secondary/5 rounded-3xl border border-secondary/30 dark:border-dark-secondary/30 p-8 text-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="mb-6">
            {result.passed
              ? <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              : <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto" />}
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">
            {result.passed ? 'MCQ Round Passed! 🎉' : 'MCQ Round Done'}
          </h2>
          <p className="text-text/60 dark:text-dark-text/60 mb-6">
            {result.passed ? 'Great job! Proceeding to the coding round.' : `You scored ${result.score}%. Proceeding to the coding round.`}
          </p>
          <div className="bg-background dark:bg-dark-background rounded-2xl p-6 mb-6">
            <p className="text-5xl font-black text-primary dark:text-dark-primary mb-1">{result.score}%</p>
            <p className="text-sm text-text/60 dark:text-dark-text/60">{result.correct}/{result.total} correct · Pass threshold: {passThreshold}%</p>
          </div>
          <button
            onClick={proceedToCoding}
            className="w-full px-6 py-3 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all"
          >
            Continue to Coding Round →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Test Screen ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Violation Warnings */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {warnings.slice(0, 3).map(w => (
            <motion.div key={w.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
              className="bg-red-600 text-white rounded-xl px-4 py-3 shadow-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{w.message}</p>
                <p className="text-xs text-red-200">{w.timestamp}</p>
              </div>
              <button onClick={() => clearWarning(w.id)} className="text-red-200 hover:text-white">&times;</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Violation counter */}
      <div className="fixed top-4 left-4 z-50 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border border-secondary/30 dark:border-dark-secondary/30 rounded-xl px-3 py-2 flex items-center gap-2">
        <Shield className={`w-4 h-4 ${Object.values(violations).reduce((a, b) => a + b, 0) > 0 ? 'text-red-500' : 'text-green-500'}`} />
        <span className="text-xs font-bold">Violations: {Object.values(violations).reduce((a, b) => a + b, 0)}</span>
      </div>

      {/* Camera */}
      <div className="fixed bottom-4 right-4 z-50 w-40 h-28 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-secondary/30">
        {!cameraActive && <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-[10px] text-white text-center p-2">Camera required</div>}
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 font-semibold text-sm">
            <ChevronLeft className="w-5 h-5" /> Exit
          </button>
          <div className="flex flex-col items-center">
            <p className="text-xs text-text/50 dark:text-dark-text/50 font-medium">MCQ Round</p>
            <p className="text-xs text-text/40 dark:text-dark-text/40">{Object.keys(answers).length}/{safeQ.length} answered</p>
          </div>
          <div className={`text-2xl font-bold font-mono ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-primary dark:text-dark-primary'}`}>
            <Clock className="inline w-4 h-4 mr-1 mb-0.5" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-secondary/20 dark:bg-dark-secondary/20">
          <motion.div className="h-full bg-primary dark:bg-dark-primary" animate={{ width: `${safeQ.length ? ((currentQuestion + 1) / safeQ.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {safeQ.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-xl font-bold">No questions loaded</p>
            <p className="text-text/60 dark:text-dark-text/60 mt-2">Please contact support or try again.</p>
          </div>
        ) : (
          <>
            {/* Question Navigator */}
            <div className="flex flex-wrap gap-2 mb-6">
              {safeQ.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentQuestion(idx)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                    answers[safeQ[idx]?.id] !== undefined
                      ? 'bg-green-500 text-white'
                      : idx === currentQuestion
                        ? 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background'
                        : 'bg-secondary/20 dark:bg-dark-secondary/20 text-text dark:text-dark-text hover:bg-secondary/40'
                  }`}>
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div key={currentQuestion}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl p-6 border border-secondary/30 dark:border-dark-secondary/30 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10 px-2 py-0.5 rounded-full">
                    Q{currentQuestion + 1} of {safeQ.length}
                  </span>
                  <span className="text-xs text-text/40">{safeQ[currentQuestion]?.points ?? 10} pts</span>
                </div>
                <h2 className="text-xl font-bold mb-5 text-text dark:text-dark-text leading-relaxed">
                  {safeQ[currentQuestion]?.question}
                </h2>
                <div className="space-y-3">
                  {(safeQ[currentQuestion]?.options || []).map((option, idx) => {
                    const qId = safeQ[currentQuestion]?.id;
                    const selected = answers[qId] === idx;
                    return (
                      <motion.button key={idx} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswerSelect(qId, idx)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all font-medium ${
                          selected
                            ? 'bg-primary/15 dark:bg-dark-primary/15 border-primary dark:border-dark-primary text-primary dark:text-dark-primary'
                            : 'bg-background dark:bg-dark-background border-secondary/30 dark:border-dark-secondary/30 hover:border-secondary dark:hover:border-dark-secondary'
                        }`}>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-sm font-bold ${selected ? 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background' : 'bg-secondary/20 dark:bg-dark-secondary/20'}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))} disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-secondary/30 dark:border-dark-secondary/30 font-semibold disabled:opacity-40 hover:bg-secondary/10 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {currentQuestion === safeQ.length - 1 ? (
                <button onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:opacity-90 transition-all">
                  <Send className="w-4 h-4" /> Submit MCQ
                </button>
              ) : (
                <button onClick={() => setCurrentQuestion(p => Math.min(safeQ.length - 1, p + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MCQAssessment;
