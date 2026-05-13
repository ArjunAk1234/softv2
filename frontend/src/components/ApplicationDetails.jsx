import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, CheckCircle, Clock, AlertCircle, Trophy, FileText,
  Code2, Calendar, Upload, Loader2, Star, Shield, Briefcase, Video
} from 'lucide-react';
import MCQAssessment from './MCQAssessment';
import CodingAssessment from './CodingAssessment';
import SlotPicker from './SlotPicker';
import InterviewRoom from './InterviewRoom';

const API_BASE = 'http://localhost:8006';


// ── status → human label ──────────────────────────────────────────────────────
const STATUS_MAP = {
  applied: { label: 'Application Submitted', icon: FileText, color: 'blue', desc: 'Your application is under review.' },
  resume_reviewed: { label: 'Resume Reviewed', icon: CheckCircle, color: 'indigo', desc: 'The company reviewed your resume.' },
  shortlisted: { label: 'Shortlisted! 🎉', icon: Star, color: 'cyan', desc: 'You have been shortlisted. Prepare for the test.' },
  rejected: { label: 'Not Selected', icon: AlertCircle, color: 'red', desc: 'Thank you for applying. Keep trying!' },
  test_invited: { label: 'Test Ready', icon: Code2, color: 'yellow', desc: 'You can now take the technical assessment.' },
  test_in_progress: { label: 'Test In Progress', icon: Code2, color: 'orange', desc: 'You have an active test session.' },
  test_completed: { label: 'Test Completed ✓', icon: CheckCircle, color: 'teal', desc: 'Test done! Schedule your interview.' },
  interview_scheduled: { label: 'Interview Scheduled', icon: Calendar, color: 'purple', desc: 'Your interview is confirmed.' },
  interview_completed: { label: 'Interview Done', icon: CheckCircle, color: 'violet', desc: 'Awaiting final decision.' },
  hired: { label: '🎉 Hired!', icon: Trophy, color: 'green', desc: 'Congratulations! You got the job!' },
};

const colorMap = {
  blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
  red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  yellow: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  teal: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
  purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
};

const ScoreBar = ({ label, score }) => (

  <div className="mb-4">
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className={`font-bold ${score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-400'}`}>
        {score != null ? `${Math.round(score)}%` : '—'}
      </span>
    </div>
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${score ?? 0}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`} />
    </div>
  </div>
);

// ── Pipeline Steps ────────────────────────────────────────────────────────────
const PIPELINE = ['applied', 'shortlisted', 'test_invited', 'test_completed', 'interview_scheduled', 'interview_completed', 'hired'];
const pipelineIndex = (status) => {
  if (status === 'rejected') return -1;
  // Map intermediate statuses to their nearest pipeline stage
  if (status === 'resume_reviewed') return 0; // still in "applied" stage
  if (status === 'test_in_progress') return 2; // same position as test_invited
  return PIPELINE.indexOf(status);
};

const ApplicationDetails = ({ application, onBack }) => {
  const [app, setApp] = useState(application);
  const [test, setTest] = useState(null);
  const [phase, setPhase] = useState(null);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [loadingTest, setLoadingTest] = useState(false);
  const [interviewSession, setInterviewSession] = useState(null); // active interview session
  const [activeInterview, setActiveInterview] = useState(false); // show InterviewRoom

  const token = localStorage.getItem('token');

  // Load my interview session if scheduled
  useEffect(() => {
    if (app.status === 'interview_scheduled' || app.status === 'interview_completed') {
      fetch(`${API_BASE}/interview/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(sessions => {
          const sess = Array.isArray(sessions)
            ? sessions.find(s => s.application_id === (app.id || app.application_id))
            : null;
          if (sess) setInterviewSession(sess);
        })
        .catch(() => {});
    }
  }, [app.status]);

  const status = app.rawStatus || app.status;
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.applied;
  const colorCls = colorMap[statusInfo.color] || colorMap.blue;
  const pipeIdx = pipelineIndex(status);

  // Reload fresh data from backend
  const refresh = async () => {
    try {
      const res = await fetch(`${API_BASE}/candidate/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const all = await res.json();
        const fresh = all.find(a => a.id === app.id);
        if (fresh) setApp({ ...app, ...fresh, rawStatus: fresh.status });
      }
    } catch (e) { console.warn('refresh failed', e); }

  };

  // Upload resume
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadMsg('');
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const res = await fetch(`${API_BASE}/candidate/applications/${app.id}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) { setUploadMsg('✓ Resume uploaded and AI screening started!'); refresh(); }
      else setUploadMsg(data.error || 'Upload failed');
    } catch { setUploadMsg('Network error'); }
    setUploading(false);
  };

  // Load test for this application
  const loadTest = async () => {
    setLoadingTest(true);
    try {
      const res = await fetch(`${API_BASE}/test/${app.id}/start`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTest(data);
        // Decide which phase to start: MCQ first if present, else coding directly
        const hasMcq = Array.isArray(data.questions?.mcq?.questions) && data.questions.mcq.questions.length > 0;
        setPhase(hasMcq ? 'mcq' : 'coding');
      } else {
        alert(data.error || 'Failed to load test');
      }
    } catch { alert('Network error'); }
    setLoadingTest(false);
  };

  // Called when MCQ round completes; move to coding
  const handleMcqComplete = (answers) => {
    setMcqAnswers(answers);
    const hasCoding = Array.isArray(test?.questions?.coding?.questions) && test.questions.coding.questions.length > 0;
    setPhase(hasCoding ? 'coding' : null);
    if (!hasCoding) handleFinalSubmit(answers, {});
  };

  // Called when candidate submits all coding answers
  const handleFinalSubmit = async (mAnswers, codingAnswers) => {
    const payload = {
      sessionId: test?.id,
      mcqAnswers: mAnswers || mcqAnswers,
      codingAnswers: codingAnswers || {},
    };
    try {
      const res = await fetch(`${API_BASE}/test/${app.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setPhase(null);
      await refresh();
      return data;
    } catch { alert('Submit failed'); }
  };

  // MCQ Phase
  if (phase === 'mcq' && test) {
    return (
      <MCQAssessment
        test={test} application={app} token={token}
        onBack={() => setPhase(null)} onComplete={handleMcqComplete}
      />
    );
  }

  // Coding Phase
  if (phase === 'coding' && test) {
    return (
      <CodingAssessment
        test={test} mcqAnswers={mcqAnswers} sessionId={test?.id}
        application={app} token={token}
        onBack={() => setPhase(null)}
        onSubmitAll={(payload) => handleFinalSubmit(payload.mcqAnswers, payload.codingAnswers)}
      />
    );
  }

  // Interview Room
  if (activeInterview && interviewSession) {
    return (
      <InterviewRoom
        session={interviewSession}
        role="candidate"
        token={token}
        interviewerName={interviewSession.interviewer_name}
        candidateName={app.name}
        onLeave={() => { setActiveInterview(false); }}
      />
    );
  }


  if (showSlotPicker) {
    return (
      <SlotPicker
        jobId={app.job_id || app.jobId}
        applicationId={app.id}
        token={token}
        onBooked={(bookingInfo) => {
          setShowSlotPicker(false);
          // Immediately reflect the status change locally so the UI updates
          setApp(prev => ({ ...prev, status: 'interview_scheduled', rawStatus: 'interview_scheduled' }));
          if (bookingInfo?.session) setInterviewSession(bookingInfo.session);
          refresh();
        }}
        onBack={() => setShowSlotPicker(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold">
            <ChevronLeft className="w-5 h-5" /> My Applications
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Job Card */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/8 dark:from-dark-primary/8 to-secondary/8 dark:to-dark-secondary/8 border border-primary/20 dark:border-dark-primary/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-primary/15 dark:bg-dark-primary/15 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-7 h-7 text-primary dark:text-dark-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-text dark:text-dark-text">{app.jobTitle || app.job_title}</h1>
              <p className="text-text/60 dark:text-dark-text/60">{app.company || app.company_name} · {app.location}</p>
              <p className="text-xs text-gray-400 mt-1">Applied {new Date(app.appliedDate || app.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`flex items-center gap-4 p-5 rounded-2xl border ${colorCls}`}>
          <statusInfo.icon className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg">{statusInfo.label}</p>
            <p className="text-sm opacity-80">{statusInfo.desc}</p>
          </div>
        </motion.div>

        {/* Pipeline tracker */}
        {status !== 'rejected' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5">
            <p className="text-sm font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-4">Your Progress</p>
            <div className="flex items-center gap-1">
              {['Applied', 'Shortlisted', 'Assessment', 'Test Done', 'Interview', 'Done', 'Hired'].map((step, i) => (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center ${i <= pipeIdx ? 'opacity-100' : 'opacity-35'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= pipeIdx ? 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                      {i <= pipeIdx ? '✓' : i + 1}
                    </div>
                    <span className="text-xs mt-1 text-center leading-tight text-text/60 dark:text-dark-text/60 hidden sm:block" style={{ fontSize: '10px' }}>{step}</span>
                  </div>
                  {i < 6 && <div className={`flex-1 h-0.5 ${i < pipeIdx ? 'bg-primary dark:bg-dark-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}

        {/* Scores */}
        {(app.resumeScore != null || app.resume_score != null || app.testScore != null || app.test_score != null) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5">
            <p className="text-sm font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-4">Your Scores</p>
            <ScoreBar label="Resume / AI Screening (30%)" score={app.resumeScore ?? app.resume_score} />
            <ScoreBar label="Technical Test (30%)" score={app.testScore ?? app.test_score} />
            <ScoreBar label="Interview (40%)" score={app.interviewScore ?? app.interview_score} />
            {(app.finalScore ?? app.final_score) != null && (
              <div className="mt-4 pt-4 border-t border-secondary/10 dark:border-dark-secondary/10">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text dark:text-dark-text">Final Score</span>
                  <span className={`text-2xl font-black ${(app.finalScore ?? app.final_score) >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {Math.round(app.finalScore ?? app.final_score)}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Resume Feedback */}
        {(app.aiFeedback || app.ai_resume_feedback) && (() => {
          const fb = app.aiFeedback || app.ai_resume_feedback;
          return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5">
              <p className="text-sm font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-4">AI Resume Feedback</p>
              {fb.strengths?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1.5">✓ Strengths</p>
                  <ul className="space-y-1">{fb.strengths.map((s, i) => <li key={i} className="text-sm text-text/80 dark:text-dark-text/80 flex items-start gap-2"><span className="text-green-500">•</span>{s}</li>)}</ul>
                </div>
              )}
              {fb.skill_gaps?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-500 dark:text-red-400 mb-1.5">⚠ Skill Gaps</p>
                  <ul className="space-y-1">{fb.skill_gaps.map((s, i) => <li key={i} className="text-sm text-text/80 dark:text-dark-text/80 flex items-start gap-2"><span className="text-red-400">•</span>{s}</li>)}</ul>
                </div>
              )}
              {fb.recommendation && <p className="mt-3 text-sm text-text/70 dark:text-dark-text/70 italic border-t border-secondary/10 dark:border-dark-secondary/10 pt-3">{fb.recommendation}</p>}
            </motion.div>
          );
        })()}

        {/* ── Action Section ─────────────────────────────────────────────────── */}

        {/* Upload Resume (status = applied, resume_reviewed) */}
        {['applied', 'resume_reviewed'].includes(status) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5">
            <p className="text-sm font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload / Update Resume
            </p>
            {uploadMsg && <p className={`text-sm mb-3 font-medium ${uploadMsg.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{uploadMsg}</p>}
            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading ? 'border-primary/50 bg-primary/5' : 'border-secondary/30 dark:border-dark-secondary/30 hover:border-primary dark:hover:border-dark-primary hover:bg-primary/5'}`}>
              {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary mb-2" /> : <Upload className="w-8 h-8 text-text/30 dark:text-dark-text/30 mb-2" />}
              <span className="text-sm text-text/60 dark:text-dark-text/60 font-medium">{uploading ? 'Uploading & AI screening…' : 'Click to upload PDF or DOCX'}</span>
              <span className="text-xs text-gray-400 mt-1">The AI will score your resume against the job description</span>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={uploading} className="hidden" />
            </label>
          </motion.div>
        )}

        {/* Start Test (status = test_invited or test_in_progress) */}
        {['test_invited', 'test_in_progress'].includes(status) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5 text-center">
            <Code2 className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-text dark:text-dark-text mb-1">Technical Assessment Ready</h3>
            <p className="text-sm text-text/60 dark:text-dark-text/60 mb-5">Complete the test to move to the interview stage. The test is timed and proctored.</p>
            <button onClick={loadTest} disabled={loadingTest}
              className="px-8 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2 mx-auto">
              {loadingTest ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code2 className="w-5 h-5" />}
              {loadingTest ? 'Loading Test…' : status === 'test_in_progress' ? 'Continue Test' : 'Start Assessment'}
            </button>
          </motion.div>
        )}

        {/* Schedule Interview (status = test_completed) */}
        {status === 'test_completed' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 text-center">
            <Calendar className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-text dark:text-dark-text mb-1">Schedule Your Interview</h3>
            <p className="text-sm text-text/60 dark:text-dark-text/60 mb-5">Great job on the test! Pick a convenient time slot for your interview.</p>
            <button onClick={() => setShowSlotPicker(true)}
              className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 mx-auto">
              <Calendar className="w-5 h-5" /> Choose Interview Slot
            </button>
          </motion.div>
        )}

        {/* Interview Scheduled Info + Join Button */}
        {status === 'interview_scheduled' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
            <p className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5" /> Interview Confirmed
            </p>
            {interviewSession && (
              <div className="mb-4 space-y-1 text-sm text-text/70 dark:text-dark-text/70">
                <p>📅 {new Date(interviewSession.scheduled_at).toLocaleString()}</p>
                <p>👤 Interviewer: <span className="font-semibold">{interviewSession.interviewer_name}</span></p>
                <p>⏱ Duration: {interviewSession.duration_minutes} minutes</p>
              </div>
            )}
            {interviewSession && (
              <button onClick={() => setActiveInterview(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-all">
                <Video className="w-5 h-5" /> Join Interview Room
              </button>
            )}
            {!interviewSession && (
              <p className="text-sm text-text/60 dark:text-dark-text/60">Interview details loading…</p>
            )}
          </motion.div>
        )}

        {/* Hired Banner */}
        {status === 'hired' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
            className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-8 text-center text-white">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">Congratulations! 🎉</h2>
            <p className="text-white/85 text-lg">You have been selected for this position. The company will reach out with next steps.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetails;
