import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Star, FileText, ChevronRight, Video,
  CheckCircle, Loader2, BookOpen, Mic, MicOff, Send, X,
  TrendingUp, Award, AlertTriangle, Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8006';

// ── AI Notes Panel ────────────────────────────────────────────────────────────
const AiNotesPanel = ({ sessionId, token }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${sessionId}/ai-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setNotes(data.notes);
      else setError(data.error || 'Failed to load notes');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [sessionId]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-white">AI Interview Notes</h3>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
      </div>
      {error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : notes ? (
        <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
          {notes}
        </div>
      ) : (
        <div className="text-slate-400 text-sm">Generating AI notes…</div>
      )}
      <button
        onClick={fetchNotes}
        disabled={loading}
        className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Refreshing…' : '↻ Refresh notes'}
      </button>
    </div>
  );
};

// ── Score Submission Form ─────────────────────────────────────────────────────
const ScoreForm = ({ sessionId, token, onSuccess }) => {
  const [score, setScore] = useState(70);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, feedback }),
      });
      const data = await res.json();
      if (res.ok) onSuccess(data);
      else setError(data.error || 'Failed to submit');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-white">Submit Evaluation</h3>
      </div>

      <div className="mb-4">
        <label className="text-slate-300 text-sm font-semibold mb-2 block">
          Interview Score: <span className="text-yellow-400 text-lg">{score}/100</span>
        </label>
        <input
          type="range"
          min="0" max="100" step="1"
          value={score}
          onChange={e => setScore(Number(e.target.value))}
          className="w-full accent-yellow-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Poor (0)</span>
          <span>Average (50)</span>
          <span>Excellent (100)</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-slate-300 text-sm font-semibold mb-2 block">Feedback / Notes</label>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={4}
          placeholder="Communication skills, technical depth, problem-solving ability…"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-yellow-400 transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading || !feedback.trim()}
        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {loading ? 'Submitting…' : 'Submit Final Score'}
      </button>
    </form>
  );
};

// ── Live Interview Panel ──────────────────────────────────────────────────────
const LiveInterviewPanel = ({ session, token, onClose, onComplete }) => {
  const [started, setStarted] = useState(session.status === 'in_progress');
  const [completed, setCompleted] = useState(session.status === 'completed');
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!started || completed) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [started, completed]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${session.id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStarted(true);
    } catch {}
    setLoading(false);
  };

  const handleScoreSuccess = (data) => {
    setCompleted(true);
    onComplete(data);
  };

  const scoreColors = (s) => {
    if (s >= 70) return 'text-green-400';
    if (s >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-5xl my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{session.candidate_name}</h2>
              <p className="text-slate-400 text-sm">{session.job_title} • {session.company_name}</p>
            </div>
            {started && !completed && (
              <div className="bg-red-500/20 border border-red-500 px-4 py-2 rounded-full">
                <span className="text-red-400 font-mono font-bold">● {formatTime(elapsed)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left: Candidate Info */}
          <div className="space-y-4">
            {/* Score Summary */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Candidate Scores
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Resume Score', value: session.resume_score, color: 'blue' },
                  { label: 'Technical Test', value: session.test_score, color: 'purple' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className={`font-bold ${scoreColors(value)}`}>{value || 0}/100</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full bg-${color}-500`}
                        style={{ width: `${value || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Details */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Candidate Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white text-xs">{session.candidate_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Interview</span>
                  <span className="text-white">
                    {new Date(session.scheduled_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white">{session.duration_minutes} mins</span>
                </div>
              </div>
            </div>

            {/* Start / Status */}
            {!started && !completed && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                Start Interview
              </button>
            )}

            {completed && (
              <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-bold">Interview Completed</p>
              </div>
            )}
          </div>

          {/* Middle: AI Notes */}
          <div>
            <AiNotesPanel sessionId={session.id} token={token} />
          </div>

          {/* Right: Score Form */}
          <div>
            {started && !completed ? (
              <ScoreForm sessionId={session.id} token={token} onSuccess={handleScoreSuccess} />
            ) : completed ? (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                <Award className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Score Submitted</h3>
                <p className="text-slate-400 text-sm">The candidate's final ranking has been updated.</p>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600 text-center">
                <p className="text-slate-400 text-sm">Start the interview to submit evaluation</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Session Card ──────────────────────────────────────────────────────────────
const SessionCard = ({ session, onOpen }) => {
  const scheduledAt = new Date(session.scheduled_at);
  const now = new Date();
  const isNow = Math.abs(scheduledAt - now) < 30 * 60 * 1000; // within 30 min
  const isPast = scheduledAt < now;
  const isCompleted = session.status === 'completed';

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    completed: 'bg-green-500/20 text-green-400 border-green-500/50',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-slate-800/50 rounded-2xl p-5 border transition-all cursor-pointer ${
        isNow && !isCompleted
          ? 'border-yellow-500/70 shadow-lg shadow-yellow-500/20'
          : 'border-slate-700 hover:border-slate-500'
      }`}
      onClick={() => onOpen(session)}
    >
      {isNow && !isCompleted && (
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
          </span>
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">Starting Soon</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {session.candidate_name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-bold text-white">{session.candidate_name}</h3>
            <p className="text-slate-400 text-sm">{session.candidate_email}</p>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusColors[session.status] || statusColors.scheduled}`}>
          {session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <span>{session.job_title}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>{scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes} mins)</span>
        </div>
      </div>

      {/* Mini scores */}
      <div className="flex gap-3 mb-4">
        {[
          { label: 'Resume', value: session.resume_score },
          { label: 'Test', value: session.test_score },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 bg-slate-700/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-bold text-white">{value ? `${value}%` : 'N/A'}</p>
          </div>
        ))}
      </div>

      <button
        className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          isCompleted
            ? 'bg-slate-700 text-slate-400'
            : isNow
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
        onClick={(e) => { e.stopPropagation(); onOpen(session); }}
      >
        {isCompleted ? (
          <><CheckCircle className="w-4 h-4" /> View Results</>
        ) : isNow ? (
          <><Video className="w-4 h-4" /> Start Interview</>
        ) : (
          <><ChevronRight className="w-4 h-4" /> View Details</>
        )}
      </button>
    </motion.div>
  );
};

// ── Briefcase icon local ──────────────────────────────────────────────────────
const Briefcase = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

// ── Main Interviewer Dashboard ────────────────────────────────────────────────
const InterviewerDashboard = () => {
  const { auth } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/interview/interviewer/sessions`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const filtered = sessions.filter(s => {
    if (filter === 'upcoming') return s.status === 'scheduled' && new Date(s.scheduled_at) > new Date();
    if (filter === 'today') {
      const d = new Date(s.scheduled_at);
      const t = new Date();
      return d.toDateString() === t.toDateString();
    }
    if (filter === 'completed') return s.status === 'completed';
    return true;
  });

  const stats = {
    total: sessions.length,
    today: sessions.filter(s => new Date(s.scheduled_at).toDateString() === new Date().toDateString()).length,
    upcoming: sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()).length,
    completed: sessions.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Interviewer Portal</h1>
            <p className="text-slate-400 mt-1">Welcome, {auth?.user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {auth?.user?.name?.charAt(0) || 'I'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: stats.total, icon: Calendar, color: 'blue' },
            { label: 'Today', value: stats.today, icon: Clock, color: 'yellow' },
            { label: 'Upcoming', value: stats.upcoming, icon: Video, color: 'purple' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'today', 'upcoming', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No sessions found</h3>
            <p className="text-slate-500 mt-2">Check back later for scheduled interviews</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(session => (
              <SessionCard key={session.id} session={session} onOpen={setActiveSession} />
            ))}
          </div>
        )}
      </div>

      {/* Live Interview Modal */}
      <AnimatePresence>
        {activeSession && (
          <LiveInterviewPanel
            session={activeSession}
            token={auth.token}
            onClose={() => setActiveSession(null)}
            onComplete={(data) => {
              setActiveSession(null);
              fetchSessions();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewerDashboard;
